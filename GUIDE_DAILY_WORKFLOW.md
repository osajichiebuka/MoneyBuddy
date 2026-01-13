# 🛠️ moneyBuddy Developer Workflow Guide

Here is your daily cheat sheet for working with Git and GitHub. Follow this routine to keep your code safe and organized.

---

## ☀️ 1. Morning Routine (Start of Day)
**Goal:** Get your computer in sync with the real world (GitHub).

1.  **Open Terminal** and go to your project:
    ```bash
    cd Documents/MoneyBuddy
    ```
2.  **Go to the main branch:**
    ```bash
    git checkout main
    ```
3.  **Download the latest code:**
    *(This ensures you aren't working on old stuff)*
    ```bash
    git pull origin main
    ```
4.  **Install dependencies:**
    *(Only needed if you or a teammate added new libraries)*
    ```bash
    cd client && npm install
    cd ../server && npm install
    cd ..
    ```

---

## 🚀 2. Starting a New Feature
**Goal:** Create a safe playground for your new work. **NEVER** work directly on `main`.

1.  **Create a new branch:**
    *   Naming convention: `feature/name-of-feature` or `fix/name-of-bug`
    ```bash
    git checkout -b feature/amazing-new-screen
    ```
2.  **Start Coding!** 👨‍💻
    *   Launch your app:
        *   Terminal 1: `cd server && node index.js`
        *   Terminal 2: `cd client && npx expo start`

---

## 💾 3. During the Day (Save Points)
**Goal:** Save your progress locally so you don't lose work if your computer crashes.

1.  **Check what you changed:**
    ```bash
    git status
    ```
2.  **Stage (Select) your files:**
    ```bash
    git add .
    ```
3.  **Commit (Save) with a message:**
    ```bash
    git commit -m "feat: built the basic layout for the transaction screen"
    ```
    *(Repeat this step as often as you like—every hour or after every specific task)*

---

## 🌙 4. End of Day (Pushing Up)
**Goal:** Upload your work to GitHub so it's safe in the cloud.

1.  **Push your branch:**
    ```bash
    git push origin feature/amazing-new-screen
    ```
    *(If it's the first time pushing this branch, Git might ask you to run a specific command. just copy-paste what it tells you, usually `git push --set-upstream ...`)*

2.  **Open a Pull Request (PR):**
    *   Go to your GitHub repository in the browser.
    *   You will see a yellow bar: "feature/amazing-new-screen had recent pushes".
    *   Click **"Compare & pull request"**.
    *   Review your changes and click **"Create pull request"**.

---

## 🤝 5. Merging (Making it Official)
**Goal:** Combine your feature into the main app.

1.  On GitHub, after your PR is approved (or if you are approving it yourself), click **"Merge pull request"**.
2.  **Cleanup Local:** Now that it's in `main` on the cloud, update your local computer:
    ```bash
    git checkout main
    git pull origin main
    ```
3.  **Delete the old branch:**
    ```bash
    git branch -d feature/amazing-new-screen
    ```

---

## 🆘 Emergency Commands

*   **"I messed up and want to undo everything to the last commit"**:
    `git checkout .` (Warning: deletes unsaved work!)

*   **"I committed to main by accident!"**:
    Don't panic. Just create a branch *now*: `git checkout -b feature/saved-my-work`
