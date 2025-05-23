import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import chalk from 'chalk';
import { diffLines } from 'diff';


class Gitz {
  constructor(repoPath = '.') {
    this.repoPath = path.join(repoPath, '.gitz');
    this.objectsPath = path.join(this.repoPath, 'objects'); //.gitz/objects
    this.headPath = path.join(this.repoPath, 'HEAD'); //.gitz/HEAD
    this.indexPath = path.join(this.repoPath, 'index'); //.gitz/index
    this.init();
  }

  async init() {
    await fs.mkdir(this.objectsPath, {recursive: true});
    try {
      await fs.writeFile(this.headPath, '', {flag: 'wx'});
      await fs.writeFile(this.indexPath,JSON.stringify([]),{flag: 'wx'});
    } catch (error) {
      console.error("Already initialised the .gitz folder");
    }
  }

  hashObject(content){
    return crypto.createHash('sha1').update(content, 'utf-8').digest('hex');
  }
  async add(fileToBeAdded){
    const fileData = await fs.readFile(fileToBeAdded, { encoding: 'utf-8'});
    const fileHash = this.hashObject(fileData);
    console.log(fileHash);

    const newFolderHashedObjectPath = path.join(this.objectsPath, fileHash.slice(0,2));
    await fs.mkdir(newFolderHashedObjectPath,{recursive: true});
    const newFileHashedObjectPath = path.join(newFolderHashedObjectPath, fileHash.slice(2));
    await fs.writeFile(newFileHashedObjectPath, fileData);
    await this.updateStagingArea(fileToBeAdded, fileHash);
    console.log(`Added ${fileToBeAdded}`);
  }

  async updateStagingArea(filePath, fileHash) {
    const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8'}));
    index.push({ path: filePath, hash: fileHash });
    await fs.writeFile(this.indexPath, JSON.stringify(index));
  }

  async commit(message) {
    const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8'}));
    const parentCommit = await this.getCurrentHead();

    const commitData = {
      timeStamp: new Date().toISOString(),
      message,
      files: index,
      parent: parentCommit
    };

    const commitHash = this.hashObject(JSON.stringify(commitData));
    const newCommitFolderPath = path.join(this.objectsPath, commitHash.slice(0,2));
    //console.log(newCommitFolderPath);
    await fs.mkdir(newCommitFolderPath, {recursive: true});
    const commitpath = path.join(newCommitFolderPath, commitHash.slice(2));
    //console.log(commitpath);
    await fs.writeFile(commitpath, JSON.stringify(commitData));
    await fs.writeFile(this.headPath, commitHash);
    await fs.writeFile(this.indexPath, JSON.stringify([]));
    console.log(`Commit successfully created: ${commitHash}`);
  }

  async getCurrentHead() {
    try {
      return await fs.readFile(this.headPath, {encoding: 'utf-8'});
    } catch (error) {
      return  null;
    }
  }

  async log() {
    let currentCommitHash = await this.getCurrentHead();
    while(currentCommitHash) {
      const currentFolderPath = path.join(this.objectsPath, currentCommitHash.slice(0,2));
      const commitPath = path.join(currentFolderPath, currentCommitHash.slice(2));
      const commitData = JSON.parse(await fs.readFile(path.join(commitPath), {encoding: 'utf-8'}));

      console.log(`------------------------`);
      console.log(`Commit: ${currentCommitHash}\nDate:${commitData.timeStamp}\n\n${commitData.message}\n\n`);

      currentCommitHash = commitData.parent;
    }
  }

  async showCommitDiff(commitHash) {
    const commitData = JSON.parse(await this.getCommitData(commitHash));
    if(!commitData) {
      console.log("Commit not found");
      return;
    }
    console.log("Changes in the last commit are: ");

    for(const file of commitData.files) {
      console.log(`File: ${file.path}`);
      const fileContent = await this.getFileContent(file.hash);
      console.log(fileContent); 

      if(commitData.parent) {
        const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent));
        const getParentFileContent = await this.getParentFileContent(parentCommitData, file.path);
        if(getParentFileContent !== undefined) {
          console.log('\nDiff');
          const diff = diffLines(getParentFileContent, fileContent);

          diff.forEach(part => {
            if(part.added) {
              process.stdout.write(chalk.green("++" + part.value));
            } else if(part.removed) {
              process.stdout.write(chalk.red("--" + part.value));
            } else {
              process.stdout.write(chalk.white(part.value));
            }
          });
          console.log();
        } else {
          console.log("New file in this commit");
        }
      } else {
        console.log("First commit");
      }
    }
  }

  async getParentFileContent(parentCommitData, filePath) {
    const parentFile = parentCommitData.files.find(file => file.path === filePath);
    if(parentFile) {
      return await this.getFileContent(parentFile.hash);
    }
  }

  async getCommitData(commitHash) {
    const commitFolderPath = path.join(this.objectsPath, commitHash.slice(0, 2));
    const commitFilePath = path.join(commitFolderPath, commitHash.slice(2));

    try {
      return await fs.readFile(commitFilePath, {encoding: 'utf-8'});
    } catch (error) {
      console.log(`Faild to read the commit data`, error);
      return null;
    }
  }

  async getFileContent(fileHash) {
    const folderPath = path.join(this.objectsPath, fileHash.slice(0,2));
    const objectPath = path.join(folderPath, fileHash.slice(2));
    return await fs.readFile(objectPath, {encoding: 'utf-8'});
  }
}

(async () => {
  const gitz = new Gitz();

  const command = process.argv[2];
  const arg = process.argv[3];

  switch(command) {
    case 'init':
      await gitz.init();
      break;
    case 'add':
      if(!arg){
        console.error("Please specify a file to add");
        break;
      } 
      await gitz.add(arg);
      break;
    case 'commit': 
      if(!arg){
        console.error("please specify a commit message");
        break;
      }
      await gitz.commit(arg);
      break;
    case 'log':
      await gitz.log();
      break;
    case 'diff':
      if(!arg){
        console.error("Please specify a commit hash to show the diff.");
        break;
      }
      await gitz.showCommitDiff(arg);
      break;

    default: 
    console.error('Unknown command. Use init, add, commit, log,or diff');
    break;
  }
})();