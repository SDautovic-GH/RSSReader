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

    # ============================================
    # PULL-FIRST flow: stash local edits, fast-forward to origin, then pop.
    # Guarantees the working tree sits on top of the latest remote state
    # before any local commit. If FF is impossible or stash-pop conflicts,
    # we abort cleanly with the user's work preserved -- never silently
    # overwrite either side. (Replaces previous -Xtheirs fallback which
    # silently discarded local Mac edits on rebase conflict.)
    # ============================================

    $isDirty = [bool](& git status --porcelain 2>$null)
    $stashed = $false
    if ($isDirty) {
        Write-Host "Local changes detected - stashing before pull."
        $stashLabel = "auto-sync-prepull-$(Get-Date -Format 'yyyyMMddHHmmss')"
        Invoke-GitChecked -Arguments @("stash", "push", "-u", "-m", $stashLabel) `
            -ActionDescription "Stash local changes before pull"
        $stashed = $true
    }

    Invoke-GitChecked -Arguments @("fetch", $RemoteName, $MainBranch) `
        -ActionDescription "Fetch $MainBranch from $RemoteName"
    try {
        Invoke-GitChecked -Arguments @("merge", "--ff-only", "$RemoteName/$MainBranch") `
            -ActionDescription "Fast-forward $MainBranch to $RemoteName/$MainBranch"
    }
    catch {
        if ($stashed) { & git stash pop 2>$null }
        Stop-WithError -Message ("Cannot fast-forward $MainBranch from $RemoteName/$MainBranch.`n" +
            "Local branch has commits that aren't on the remote, or history has diverged.`n" +
            "Resolve manually: review 'git log HEAD..$RemoteName/$MainBranch' and " +
            "'git log $RemoteName/$MainBranch..HEAD', then merge or rebase deliberately.")
    }

    if ($stashed) {
        $popOutput = & git stash pop 2>&1
        if ($LASTEXITCODE -ne 0) {
            Stop-WithError -Message ("Stash-pop conflict after pull. Your local changes remain in the stash.`n" +
                "Resolve the conflict in the working tree, then run 'git stash drop' when done.`n" +
                "Conflict output:`n$($popOutput | Out-String)")
        }
    }

    # Force-add .opml, .md, and .html recursively (parent .gitignore otherwise blocks)
    $forceFiles = Get-ChildItem -Path $RepoPath -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -match '^\.(opml|md|html)$' }
    foreach ($f in $forceFiles) {
        & git add --force -- $f.FullName 2>$null
    }

    # Auto-bump SW cache version when index.html changed (see Windows sync script
    # for the full rationale). Keeps CACHE_NAME + APP_BUILD in lockstep so returning
    # users never get served a stale page.
    $IndexPath = Join-Path $RepoPath "index.html"
    & git diff --quiet HEAD -- "index.html" 2>$null
    $indexChanged = ($LASTEXITCODE -ne 0)
    if ($indexChanged -and (Test-Path $IndexPath)) {
        # Read+write as UTF-8 explicitly (never Get-Content -Raw, which uses the ANSI
        # codepage and corrupts multi-byte chars). See Windows sync script for detail.
        $utf8 = New-Object System.Text.UTF8Encoding($false)
        $html = $utf8.GetString([System.IO.File]::ReadAllBytes($IndexPath))
        $m = [regex]::Match($html, "rss-reader-v(\d+)")
        if ($m.Success) {
            $cur = [int]$m.Groups[1].Value
            $next = $cur + 1
            $html = $html -replace "rss-reader-v$cur\b", "rss-reader-v$next"
            $html = $html -replace "(window\.APP_BUILD\s*=\s*)$cur\b", "`${1}$next"
            [System.IO.File]::WriteAllText($IndexPath, $html, $utf8)
            Write-Host "Auto-bumped cache version: v$cur -> v$next"
        }
        else {
            Write-Host "WARNING: index.html changed but no 'rss-reader-vNN' token found - cache NOT bumped."
        }
    }

    # Commit any local changes (now safely on top of latest origin)
    Invoke-GitChecked -Arguments @("add", "-A") -ActionDescription "Stage RSSReader changes"
    $postPullChanges = & git status --porcelain 2>$null
    if ($postPullChanges) {
        $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Invoke-GitChecked -Arguments @("commit", "-m", "Auto sync macOS $TimeStamp") -ActionDescription "Commit RSSReader changes"
    }

    # Push if the local branch is ahead of the remote
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
if (-not $WorkingSize) { $WorkingSize = 0 }
$WorkingSizeMB = [math]::Round($WorkingSize / 1MB, 2)

$GitFolder = Join-Path $RepoPath ".git"
$GitSize = (Get-ChildItem $GitFolder -Recurse -File -Force | Measure-Object -Property Length -Sum).Sum
if (-not $GitSize) { $GitSize = 0 }
$GitSizeMB = [math]::Round($GitSize / 1MB, 2)

Write-Host "Repo Working Size : $WorkingSizeMB MB"
Write-Host "Git History Size  : $GitSizeMB MB"
Write-Host ""
Write-Host "Sync complete."
Write-Host ""