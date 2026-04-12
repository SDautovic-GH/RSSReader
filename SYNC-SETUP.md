# RSS Reader - Sync Setup

## Overview

RSS Reader is a **standalone Git repository** stored as a subfolder inside the ScriptLibrary folder on all machines. It syncs independently from ScriptLibrary using its own dedicated sync script per platform.

---

## Repository

| | |
|---|---|
| GitHub | https://github.com/SDautovic-GH/RSSReader.git |
| Branch | `main` |

---

## Folder Locations

| Machine | Path |
|---|---|
| Windows | `C:\.ScriptLibrary\RSS Reader` |
| macOS | `~/Library/Mobile Documents/com~apple~CloudDocs/Git/ScriptLibrary/RSS Reader` |

---

## Sync Scripts

| Machine | Script |
|---|---|
| Windows | `C:\.ScriptLibrary\RSS Reader\SyncGit-RSSReader.ps1` |
| macOS | `~/...Git/ScriptLibrary/macOS/SyncGit-macOS-RSSReader.ps1` |

The Windows script also mirrors the repo to OneDrive after syncing.

---

## Relationship to ScriptLibrary

- `RSS Reader/` is listed in the ScriptLibrary `.gitignore` so it is not tracked by the ScriptLibrary repo
- ScriptLibrary's macOS sync script (`SyncGit-macOS-ScriptLibrary.ps1`) has `$Exclusions = @()` — it does **not** re-add RSS Reader to `.gitignore`
- VS Code setting `"explorer.dimIgnoredFiles": false` is set on Windows machines so the RSS Reader folder does not appear dimmed in the explorer

---

## First-Time Setup on a New Machine

### Windows
```powershell
git clone https://github.com/SDautovic-GH/RSSReader.git "C:\.ScriptLibrary\RSS Reader"
```
Then run `SyncGit-RSSReader.ps1`.

### macOS
```bash
git clone https://github.com/SDautovic-GH/RSSReader.git ~/Library/Mobile\ Documents/com~apple~CloudDocs/Git/ScriptLibrary/RSS\ Reader
```
Then run:
```bash
pwsh ~/Library/Mobile\ Documents/com~apple~CloudDocs/Git/ScriptLibrary/macOS/SyncGit-macOS-RSSReader.ps1
```

---

## Common Issues

| Symptom | Cause | Fix |
|---|---|---|
| "Repo path not found" | Repo never cloned on this machine | Run the clone command above |
| Nothing syncs, no error | No `.git` inside RSS Reader — picking up parent ScriptLibrary `.git` | Run the clone command above |
| Files dimmed in VS Code | `RSS Reader/` in ScriptLibrary `.gitignore` | Remove those lines and set `"explorer.dimIgnoredFiles": false` in VS Code settings |
| macOS script re-adds RSS Reader to ScriptLibrary `.gitignore` | `$Exclusions` in `SyncGit-macOS-ScriptLibrary.ps1` contains `RSS Reader/` | Ensure `$Exclusions = @()` in that script |
| "Cannot edit read-only editor" when prompted | Script ran inside VS Code terminal | Run in Terminal.app instead |
