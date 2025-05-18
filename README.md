# Gitz

Gitz is a simple version control system that allows you to track changes in your files, similar to Git. It supports basic operations like initializing a repository, adding files, committing changes, and viewing commit logs.I made this project to understand the internal working of git.

## Features
- Initialize a new repository
- Add files to the staging area
- Commit changes with messages
- View commit history
- Show differences between commits

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com//Gitz.git
   ```

2. **Change Directory**
    ```bash
    cd gitz
    ```

3. **Install dependencies**
    ```bash
    npm install 
    ```
    ```bash
    pnpm install
    ```
    ```bash
    yarn install
    ```

## Usage

1. **Init**
    ```bash
    node gitz.mjs init
    ```

2. **Add a file**
    ```bash
    node gitz.mjs add path/to/your/file.txt
    ```

3. **Commit**
    ```bash
    node gitz.mjs commit "Your commit message"
    ```

4. **View commit log**
    ```bash
    node gitz.mjs log
    ```

5. **Show commit diff**
    ```bash
    node gitz.mjs diff <commit-hash>
    ```