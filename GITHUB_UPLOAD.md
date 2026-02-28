# 📤 GitHub Upload Instructions

## Step 1: Get Your Repository URL

Go to your GitHub repository page and copy the URL. It looks like:
```
https://github.com/YOUR_USERNAME/edutrack.git
```

## Step 2: Connect and Push

Run these commands in terminal:

```bash
# Navigate to project folder
cd "/Users/asilbekanvarov/Documents/edu track"

# Add remote repository
git remote add origin YOUR_GITHUB_REPO_URL

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Enter Credentials

GitHub will ask for:
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)

### How to create Personal Access Token:

1. Go to GitHub.com
2. Click your profile → Settings
3. Developer settings → Personal access tokens → Tokens (classic)
4. Generate new token
5. Select scopes: `repo` (full control)
6. Copy the token and use it as password

## Alternative: GitHub Desktop

1. Download GitHub Desktop: https://desktop.github.com
2. Open GitHub Desktop
3. File → Add Local Repository
4. Select: `/Users/asilbekanvarov/Documents/edu track`
5. Click "Publish repository"

## ✅ Done!

Your code is now on GitHub! 🎉

Repository will be at:
```
https://github.com/YOUR_USERNAME/REPO_NAME
```
