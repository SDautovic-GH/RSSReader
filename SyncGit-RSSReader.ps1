# SyncGit-RSSReader.ps1
# PowerShell 7 Compatible
# Sync RSS Reader + OneDrive Mirror
# ============================================

# -------------------------------------------
# Load WinForms safely for PowerShell 7
# -------------------------------------------
try {
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
}
catch {
    $winForms = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\System.Windows.Forms.dll"
    if (Test-Path $winForms) {
        Add-Type -Path $winForms
    }
}

# -------------------------------------------
# Configuration
# -------------------------------------------
$RepoPath = "C:\.ScriptLibrary\RSSReader"
$OneDrivePath = "C:\Users\21968\OneDrive - WilmerHale\.ScriptLibrary\RSSReader"
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
    param(
        [string]$Message,
        [int]$Code = 1
    )

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

        if ($outputText -match "refusing to merge unrelated histories") {
            $cmd = "git " + ($Arguments -join ' ')
            $fixCmd = "git push $RemoteName --all --force, then: git push $RemoteName --tags --force"
            $nl = [Environment]::NewLine
            $msg = $ActionDescription + ' failed.' + $nl + 'Command: ' + $cmd + $nl + 'Local and remote histories have diverged (likely after a history rewrite).' + $nl + 'Fix: ' + $fixCmd
            throw $msg
        }

        throw "$ActionDescription failed.`nCommand: git $($Arguments -join ' ')`n$outputText"
    }

    return $output
}

function Test-GitInstalled {
    try {
        $null = & git --version 2>&1
        return ($LASTEXITCODE -eq 0)
    }
    catch {
        return $false
    }
}

function Test-IsGitRepo {
    try {
        $result = & git rev-parse --is-inside-work-tree 2>$null
        return ($result -match "true")
    }
    catch {
        return $false
    }
}

function Set-GitIgnoreEntries {
    param(
        [string]$GitIgnorePath,
        [string[]]$Patterns
    )

    if (-not (Test-Path $GitIgnorePath)) {
        New-Item -Path $GitIgnorePath -ItemType File -Force | Out-Null
    }

    $content = @()
    if (Test-Path $GitIgnorePath) {
        $content = Get-Content $GitIgnorePath -ErrorAction SilentlyContinue
    }

    $updated = $false

    foreach ($pattern in $Patterns) {
        if ($content -notcontains $pattern) {
            Add-Content -Path $GitIgnorePath -Value $pattern
            $updated = $true
        }
    }

    return $updated
}

# -------------------------------------------
# Validation
# -------------------------------------------

if (-not (Test-Path $RepoPath)) {
    Stop-WithError -Message "Repo path not found: $RepoPath"
}

if (-not (Test-GitInstalled)) {
    Stop-WithError -Message "Git is not installed or not available in PATH."
}

Set-Location $RepoPath

if (-not (Test-IsGitRepo)) {
    Stop-WithError -Message "Path is not a valid Git repository: $RepoPath"
}

$configuredRemotes = & git remote 2>$null
if ($configuredRemotes -notcontains $RemoteName) {
    Stop-WithError -Message "Remote '$RemoteName' is not configured. Run: git remote add $RemoteName [repo-url]"
}

# Ensure OneDrive target exists
if (-not (Test-Path $OneDrivePath)) {
    New-Item -Path $OneDrivePath -ItemType Directory -Force | Out-Null
}

# -------------------------------------------
# Sync RSSReader repo
# -------------------------------------------

try {
    Write-Section "Syncing RSSReader repo..."

    # Ensure RSSReader .gitignore exists with sensible defaults
    $RSSGitIgnorePath = Join-Path $RepoPath ".gitignore"
    $RSSGitIgnorePatterns = @(
        ".DS_Store",
        "Thumbs.db",
        "*.log",
        "node_modules/",
        ".env",
        "*.local"
    )
    $rssGitIgnoreUpdated = Set-GitIgnoreEntries -GitIgnorePath $RSSGitIgnorePath -Patterns $RSSGitIgnorePatterns

    # Explicitly untrack any previously ignored .opml or .md files and re-stage them
    $opmlFiles = & git ls-files --others --exclude-standard -- "*.opml" 2>$null
    $mdFiles   = & git ls-files --others --exclude-standard -- "*.md"   2>$null
    $filesToAdd = @($opmlFiles) + @($mdFiles) | Where-Object { $_ -match '\S' }
    if ($filesToAdd.Count -gt 0) {
        foreach ($f in $filesToAdd) {
            & git add --force -- $f 2>$null
            Write-Host "Force-added: $f"
        }
    }
    if ($rssGitIgnoreUpdated) {
        Write-Host "Updated RSSReader .gitignore."
    }

    # Abort any in-progress merge or rebase before checkout
    $mergeHead = Join-Path $RepoPath ".git\MERGE_HEAD"
    if (Test-Path $mergeHead) {
        Write-Host "Unresolved merge detected - aborting before checkout."
        & git merge --abort 2>$null
    }
    $rebaseMergeDir = Join-Path $RepoPath ".git\rebase-merge"
    $rebaseApplyDir = Join-Path $RepoPath ".git\rebase-apply"
    if ((Test-Path $rebaseMergeDir) -or (Test-Path $rebaseApplyDir)) {
        Write-Host "Unresolved rebase detected - aborting before checkout."
        & git rebase --abort 2>$null
    }

    Invoke-GitChecked -Arguments @("checkout", $MainBranch) -ActionDescription "Checkout $MainBranch"

    # Note: deliberately do NOT auto-restore tracked files missing from disk.
    # Deletions and renames (delete + add) are legitimate edits the user wants
    # committed; resurrecting them here would silently block every rm/mv.

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

    # Force-add .opml, .md, and .html - parent .gitignore would otherwise block them
    $forceFiles = @(Get-ChildItem -Path $RepoPath -File -Include "*.opml","*.md","*.html" -ErrorAction SilentlyContinue)
    foreach ($f in $forceFiles) {
        & git add --force -- $f.Name 2>$null
    }

    Invoke-GitChecked -Arguments @("add", "-A") -ActionDescription "Stage RSSReader changes"
    $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $committedThisRun = $false
    $localChanges = & git status --porcelain 2>$null
    if ($localChanges) {
        Invoke-GitChecked -Arguments @("commit", "-m", "Auto sync $TimeStamp") -ActionDescription "Commit RSSReader changes"
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

    # ============================================
    # AUTO-BUMP service-worker cache version.
    # The SW caches index.html stale-while-revalidate; if CACHE_NAME doesn't change
    # when the file changes, returning users (esp. installed PWAs) keep serving the
    # OLD page. Bumping by hand was error-prone and easy to forget. Here we detect
    # local commits that change index.html and auto-increment BOTH the SW cache key
    # (CACHE_NAME = 'rss-reader-vNN') and the user-facing build stamp (APP_BUILD = NN)
    # in lockstep, so the version can never lag the code again.
    # It runs after the pull, so the new number is one above GitHub's even when the
    # other machine bumped it meanwhile. A number already above GitHub's (bumped by
    # hand, or by an earlier run whose push failed) is left alone.
    # ============================================
    $IndexPath = Join-Path $RepoPath "index.html"
    & git diff --quiet "$RemoteName/$MainBranch" HEAD -- "index.html" 2>$null
    $indexChanged = ($LASTEXITCODE -ne 0)
    if ($indexChanged -and (Test-Path $IndexPath)) {
        # CRITICAL: read as UTF-8 explicitly. Get-Content -Raw on Windows PowerShell
        # reads using the system ANSI codepage (Windows-1252), which corrupts every
        # multi-byte UTF-8 char (em-dashes, ✕/✓, arrows) on the way in — then the
        # UTF-8 write below bakes the mojibake back to disk. Decoding the raw bytes as
        # UTF-8 (matching the write) keeps the round-trip byte-clean.
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
                # Bump CACHE_NAME and APP_BUILD in one pass.
                $html = $html -replace "rss-reader-v$cur\b", "rss-reader-v$next"
                $html = $html -replace "(window\.APP_BUILD\s*=\s*)$cur\b", "`${1}$next"
                # Write UTF-8 without BOM, matching the read encoding above.
                [System.IO.File]::WriteAllText($IndexPath, $html, $utf8)
                Invoke-GitChecked -Arguments @("add", "--", "index.html") -ActionDescription "Stage cache version bump"
                if ($committedThisRun) {
                    Invoke-GitChecked -Arguments @("commit", "--amend", "--no-edit") -ActionDescription "Add cache version bump to the sync commit"
                }
                else {
                    Invoke-GitChecked -Arguments @("commit", "-m", "Auto sync $TimeStamp") -ActionDescription "Commit cache version bump"
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
        Write-Host "No RSSReader changes detected."
    }
}
catch {
    Stop-WithError -Message $_.Exception.Message
}

# -------------------------------------------
# Mirror Repo -> OneDrive
# -------------------------------------------

Write-Section "Mirroring Repo -> OneDrive (includes deletions)..."

robocopy `
$RepoPath `
$OneDrivePath `
/MIR `
/XD ".git" `
/R:2 `
/W:1 `
/NFL `
/NDL `
/NP | Out-Null

if ($LASTEXITCODE -ge 8) {
    Write-Host "Robocopy encountered an error."
}
else {
    Write-Host "OneDrive mirror complete."
}

# -------------------------------------------
# Repo Size Calculation
# -------------------------------------------

Write-Section "Calculating repository size..."

$WorkingSize = (
    Get-ChildItem $RepoPath -Recurse -File -Force |
    Measure-Object -Property Length -Sum
).Sum

if (-not $WorkingSize) {
    $WorkingSize = 0
}

$WorkingSizeMB = [math]::Round($WorkingSize / 1MB, 2)

$GitFolder = Join-Path $RepoPath ".git"

if (Test-Path $GitFolder) {
    $GitSize = (
        Get-ChildItem $GitFolder -Recurse -File -Force |
        Measure-Object -Property Length -Sum
    ).Sum
}
else {
    $GitSize = 0
}

if (-not $GitSize) {
    $GitSize = 0
}

$GitSizeMB = [math]::Round($GitSize / 1MB, 2)

Write-Host ""
Write-Host "Repo Working Size : $WorkingSizeMB MB"
Write-Host "Git History Size  : $GitSizeMB MB"

Write-Host ""
Write-Host "Sync complete."
Write-Host ""
