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

    # Work the old stash/pull/pop version of this script set aside and never restored.
    $oldStashes = @(& git stash list 2>$null | Where-Object { $_ -match 'auto-sync-prepull-' })
    if ($oldStashes.Count -gt 0) {
        Write-Host "NOTE: an earlier sync left local work in a stash (not restored automatically):"
        $oldStashes | ForEach-Object { Write-Host "  $_" }
        Write-Host "  Inspect: git stash show -p 'stash@{n}'   Restore: git stash pop 'stash@{n}'   Discard: git stash drop 'stash@{n}'"
    }

    # ============================================
    # COMMIT-FIRST flow, the same as the ScriptLibrary syncs: commit local edits,
    # THEN fast-forward or rebase onto origin. The old stash/pull/pop could leave
    # work hidden in a stash (an exit before the pop, or a pop that conflicted).
    # With the work committed first there is nothing to set aside, and a real
    # conflict stops with the work as a normal commit on a clean tree.
    # ============================================

    # Force-add .opml, .md, and .html recursively (parent .gitignore otherwise blocks)
    $forceFiles = Get-ChildItem -Path $RepoPath -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -match '^\.(opml|md|html)$' }
    foreach ($f in $forceFiles) {
        & git add --force -- $f.FullName 2>$null
    }

    Invoke-GitChecked -Arguments @("add", "-A") -ActionDescription "Stage RSSReader changes"
    $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $committedThisRun = $false
    $localChanges = & git status --porcelain 2>$null
    if ($localChanges) {
        Invoke-GitChecked -Arguments @("commit", "-m", "Auto sync macOS $TimeStamp") -ActionDescription "Commit RSSReader changes"
        $committedThisRun = $true
    }

    Invoke-GitChecked -Arguments @("fetch", $RemoteName, $MainBranch) `
        -ActionDescription "Fetch $MainBranch from $RemoteName"

    # The working tree is clean from here on, so this only moves commits.
    $null = & git merge --ff-only -q "$RemoteName/$MainBranch" 2>&1
    if ($LASTEXITCODE -ne 0) {
        # Both sides have commits the other lacks, normally edits to different
        # files. Rebase replays the local commits on top of the remote ones.
        Write-Host "Histories diverged - replaying local commits on top of $RemoteName/$MainBranch..."
        $rebaseOutput = & git rebase "$RemoteName/$MainBranch" 2>&1
        if ($LASTEXITCODE -ne 0) {
            # Abort restores the pre-rebase state: the local commit survives and the tree stays clean.
            & git rebase --abort 2>$null
            throw ("Local commits can't be replayed onto $RemoteName/$MainBranch automatically (normally both machines edited the same part of the same file).`n" +
                   "Nothing is lost and nothing is stashed: your work is a normal commit on local $MainBranch ('git log -1') and the working tree is clean.`n" +
                   "See both sides: git log --oneline HEAD..$RemoteName/$MainBranch   and   git log --oneline $RemoteName/$MainBranch..HEAD`n" +
                   "To resolve: git rebase $RemoteName/$MainBranch, fix the file, git add <file>, git rebase --continue, then run this sync again.`n" +
                   "Rebase output:`n$($rebaseOutput | Out-String)")
        }
        Write-Host "Replayed - local commits now sit on top of $RemoteName/$MainBranch."
    }

    # Auto-bump SW cache version when the local commits change index.html (see the
    # Windows sync script for the full rationale). Keeps CACHE_NAME + APP_BUILD in
    # lockstep so returning users never get served a stale page. It runs after the
    # pull, so the new number is one above GitHub's even when the other machine
    # bumped it meanwhile; a number already above GitHub's (bumped by hand, or by an
    # earlier run whose push failed) is left alone.
    $IndexPath = Join-Path $RepoPath "index.html"
    & git diff --quiet "$RemoteName/$MainBranch" HEAD -- "index.html" 2>$null
    $indexChanged = ($LASTEXITCODE -ne 0)
    if ($indexChanged -and (Test-Path $IndexPath)) {
        # Read+write as UTF-8 explicitly (never Get-Content -Raw, which uses the ANSI
        # codepage and corrupts multi-byte chars). See Windows sync script for detail.
        $utf8 = New-Object System.Text.UTF8Encoding($false)
        $html = $utf8.GetString([System.IO.File]::ReadAllBytes($IndexPath))
        $m = [regex]::Match($html, "rss-reader-v(\d+)")
        $remoteM = [regex]::Match(((& git show "${RemoteName}/${MainBranch}:index.html" 2>$null) -join "`n"), "rss-reader-v(\d+)")
        if ($m.Success) {
            $cur = [int]$m.Groups[1].Value
            $next = if ($remoteM.Success) { [int]$remoteM.Groups[1].Value + 1 } else { $cur + 1 }
            if ($cur -ge $next) {
                Write-Host "Cache version v$cur is already above $RemoteName's - not bumped again."
            }
            else {
                $html = $html -replace "rss-reader-v$cur\b", "rss-reader-v$next"
                $html = $html -replace "(window\.APP_BUILD\s*=\s*)$cur\b", "`${1}$next"
                [System.IO.File]::WriteAllText($IndexPath, $html, $utf8)
                Invoke-GitChecked -Arguments @("add", "--", "index.html") -ActionDescription "Stage cache version bump"
                if ($committedThisRun) {
                    Invoke-GitChecked -Arguments @("commit", "--amend", "--no-edit") -ActionDescription "Add cache version bump to the sync commit"
                }
                else {
                    Invoke-GitChecked -Arguments @("commit", "-m", "Auto sync macOS $TimeStamp") -ActionDescription "Commit cache version bump"
                }
                Write-Host "Auto-bumped cache version: v$cur -> v$next"
            }
        }
        else {
            Write-Host "WARNING: index.html changed but no 'rss-reader-vNN' token found - cache NOT bumped."
        }
    }

    # Push whenever local main is ahead: this run's commit, or commits made by hand.
    $unpushed = @(& git log "$RemoteName/$MainBranch..$MainBranch" --oneline 2>$null)
    if ($unpushed.Count -gt 0) {
        try {
            Invoke-GitChecked -Arguments @("push", $RemoteName, $MainBranch) -ActionDescription "Push RSSReader to $RemoteName"
        }
        catch {
            throw "Push failed; your commits are safe on local $MainBranch ('git log -$($unpushed.Count)').`n$($_.Exception.Message)"
        }
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