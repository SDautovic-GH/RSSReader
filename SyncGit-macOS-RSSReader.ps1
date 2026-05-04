#!/usr/bin/env pwsh
# SyncGit-macOS-RSSReader.ps1
# PowerShell 7 (pwsh) for macOS - RSS Reader Sync
# ============================================

# -------------------------------------------
# Configuration
# -------------------------------------------
$RepoPath   = $PSScriptRoot
$MainBranch = "main"
$RemoteName = "origin"

# -------------------------------------------
# Helper Functions
# -------------------------------------------

function Write-Section {
    param([string]$Text)
    Write-Host ""
    Write-Host $Text
    Write-Host ""
}

function Stop-WithError {
    param([string]$Message, [int]$Code = 1)
    Write-Host ""
    Write-Host "ERROR: $Message"
    Write-Host ""
    exit $Code
}

function Invoke-GitChecked {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [string]$ActionDescription = "Git command"
    )

    $output = & git @Arguments 2>&1 | Where-Object {
        $_ -notmatch "^Already on " -and
        $_ -notmatch "^Switched to branch " -and
        $_ -notmatch "^From https?://" -and
        $_ -notmatch "^To https?://" -and
        $_ -notmatch "^\s*\* branch\s+" -and
        $_ -notmatch "^\s+[0-9a-f]+\.\.[0-9a-f]+\s+" -and
        $_ -notmatch "^Everything up-to-date"
    }
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        $outputText = ($output | Out-String).Trim()
        if ([string]::IsNullOrWhiteSpace($outputText)) {
            $outputText = "No additional error output returned by git."
        }
        throw "$ActionDescription failed.`nCommand: git $($Arguments -join ' ')`n$outputText"
    }

    return $output
}

# -------------------------------------------
# Validation
# -------------------------------------------

if (-not (Test-Path $RepoPath)) {
    Stop-WithError -Message "Repo path not found: $RepoPath`nRun: git clone https://github.com/SDautovic-GH/RSSReader.git '$RepoPath'"
}

Set-Location $RepoPath

$gitDir = & git rev-parse --git-dir 2>$null
if ($LASTEXITCODE -ne 0 -or $gitDir -ne ".git") {
    Stop-WithError -Message "Path is not a standalone Git repository: $RepoPath"
}

$configuredRemotes = & git remote 2>$null
if ($configuredRemotes -notcontains $RemoteName) {
    Stop-WithError -Message "Remote '$RemoteName' is not configured."
}

# -------------------------------------------
# Sync RSSReader repo
# -------------------------------------------

try {
    Write-Section "Syncing RSSReader repo..."

    # Ensure .gitignore exists with sensible defaults
    $GitIgnorePath = Join-Path $RepoPath ".gitignore"
    $GitIgnorePatterns = @(".DS_Store", "Thumbs.db", "*.log", "node_modules/", ".env", "*.local")
    if (-not (Test-Path $GitIgnorePath)) {
        New-Item -Path $GitIgnorePath -ItemType File -Force | Out-Null
    }
    $content = Get-Content $GitIgnorePath -ErrorAction SilentlyContinue
    foreach ($pattern in $GitIgnorePatterns) {
        if ($content -notcontains $pattern) {
            Add-Content -Path $GitIgnorePath -Value $pattern
        }
    }

    # Abort any in-progress merge
    $mergeHead = Join-Path $RepoPath ".git/MERGE_HEAD"
    if (Test-Path $mergeHead) {
        Write-Host "Unresolved merge detected - aborting before checkout."
        & git merge --abort 2>$null
    }

    # Abort any in-progress rebase
    $rebaseMergeDir = Join-Path $RepoPath ".git/rebase-merge"
    $rebaseApplyDir = Join-Path $RepoPath ".git/rebase-apply"
    if ((Test-Path $rebaseMergeDir) -or (Test-Path $rebaseApplyDir)) {
        Write-Host "Unresolved rebase detected - aborting before checkout."
        & git rebase --abort 2>$null
    }

    Invoke-GitChecked -Arguments @("checkout", $MainBranch) -ActionDescription "Checkout $MainBranch"

    # 1. Fetch remote changes first
    Invoke-GitChecked -Arguments @("fetch", $RemoteName) -ActionDescription "Fetch from $RemoteName"

    # 2. Force-add .opml, .md, and .html recursively using absolute paths
    $forceFiles = Get-ChildItem -Path $RepoPath -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -match '^\.(opml|md|html)$' }
    foreach ($f in $forceFiles) {
        & git add --force -- $f.FullName 2>$null
    }

    # 3. Stage and commit any local changes before merging
    Invoke-GitChecked -Arguments @("add", "-A") -ActionDescription "Stage RSSReader changes"
    $prePullChanges = & git status --porcelain 2>$null
    if ($prePullChanges) {
        $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Invoke-GitChecked -Arguments @("commit", "-m", "Auto sync macOS $TimeStamp") -ActionDescription "Commit RSSReader changes"
    }

    # 4. Rebase local commits onto remote to keep history linear and preserve
    # atomic local commits (file moves, deletions paired with adds). On conflict,
    # abort and fall back to a merge preferring remote changes (-Xtheirs).
    try {
        Invoke-GitChecked -Arguments @("rebase", "$RemoteName/$MainBranch") -ActionDescription "Rebase onto $RemoteName/$MainBranch"
    }
    catch {
        Write-Host "Rebase conflict detected - aborting and retrying with merge preferring remote changes."
        & git rebase --abort 2>$null
        Invoke-GitChecked -Arguments @("merge", "-Xtheirs", "$RemoteName/$MainBranch", "--no-edit") -ActionDescription "Merge $RemoteName/$MainBranch (Xtheirs fallback)"
    }

    # 5. Push if the local branch is ahead of the remote
    $unpushed = & git log "$RemoteName/$MainBranch..$MainBranch" --oneline 2>$null
    if ($unpushed) {
        Invoke-GitChecked -Arguments @("push", $RemoteName, $MainBranch) -ActionDescription "Push RSSReader to $RemoteName"
        Write-Host "RSSReader updated on GitHub."
    }
    else {
        Write-Host "RSSReader sync completed successfully. (Up to date)"
    }
}
catch {
    Stop-WithError -Message $_.Exception.Message
}

# -------------------------------------------
# Repo Size
# -------------------------------------------

Write-Section "Calculating repository size..."

$WorkingSize = (Get-ChildItem $RepoPath -Recurse -File -Force | Measure-Object -Property Length -Sum).Sum
$WorkingSizeMB = [math]::Round(($WorkingSize ?? 0) / 1MB, 2)

$GitFolder = Join-Path $RepoPath ".git"
$GitSize = (Get-ChildItem $GitFolder -Recurse -File -Force | Measure-Object -Property Length -Sum).Sum
$GitSizeMB = [math]::Round(($GitSize ?? 0) / 1MB, 2)

Write-Host "Repo Working Size : $WorkingSizeMB MB"
Write-Host "Git History Size  : $GitSizeMB MB"
Write-Host ""
Write-Host "Sync complete."
Write-Host ""
