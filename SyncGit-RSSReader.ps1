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

    # ============================================
    # PULL-FIRST flow: stash local edits, fast-forward to origin, then pop.
    # Guarantees the working tree sits on top of the latest remote state
    # before any local commit. If FF is impossible or stash-pop conflicts,
    # we abort cleanly with the user's work preserved -- never silently
    # overwrite either side.
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

    # Force-add .opml, .md, and .html — parent .gitignore would otherwise block them
    $forceFiles = @(Get-ChildItem -Path $RepoPath -File -Include "*.opml","*.md","*.html" -ErrorAction SilentlyContinue)
    foreach ($f in $forceFiles) {
        & git add --force -- $f.Name 2>$null
    }

    # ============================================
    # AUTO-BUMP service-worker cache version.
    # The SW caches index.html stale-while-revalidate; if CACHE_NAME doesn't change
    # when the file changes, returning users (esp. installed PWAs) keep serving the
    # OLD page. Bumping by hand was error-prone and easy to forget. Here we detect an
    # uncommitted change to index.html and auto-increment BOTH the SW cache key
    # (CACHE_NAME = 'rss-reader-vNN') and the user-facing build stamp (APP_BUILD = NN)
    # in lockstep, so the version can never lag the code again.
    # ============================================
    $IndexPath = Join-Path $RepoPath "index.html"
    # Decide via diff-against-HEAD (working tree AND index), so the earlier force-add
    # staging can't mask or fake a change. Non-zero exit from either diff = changed.
    & git diff --quiet HEAD -- "index.html" 2>$null
    $indexChanged = ($LASTEXITCODE -ne 0)
    if ($indexChanged -and (Test-Path $IndexPath)) {
        $html = Get-Content $IndexPath -Raw
        $m = [regex]::Match($html, "rss-reader-v(\d+)")
        if ($m.Success) {
            $cur = [int]$m.Groups[1].Value
            $next = $cur + 1
            # Bump CACHE_NAME (all occurrences are the same literal, but replace the
            # canonical 'rss-reader-vNN' token) and APP_BUILD in one pass.
            $html = $html -replace "rss-reader-v$cur\b", "rss-reader-v$next"
            $html = $html -replace "(window\.APP_BUILD\s*=\s*)$cur\b", "`${1}$next"
            # Write UTF-8 without BOM to keep the file byte-clean.
            [System.IO.File]::WriteAllText($IndexPath, $html, (New-Object System.Text.UTF8Encoding($false)))
            Write-Host "Auto-bumped cache version: v$cur -> v$next"
        }
        else {
            Write-Host "WARNING: index.html changed but no 'rss-reader-vNN' token found - cache NOT bumped."
        }
    }

    # Commit any local changes (now safely on top of latest origin)
    $needsPush = $false
    Invoke-GitChecked -Arguments @("add", "-A") -ActionDescription "Stage RSSReader changes"
    $PostPullChanges = & git status --porcelain 2>$null
    if ($PostPullChanges) {
        $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Invoke-GitChecked -Arguments @("commit", "-m", "Auto sync $TimeStamp") -ActionDescription "Commit RSSReader changes"
        $needsPush = $true
    }

    if ($needsPush) {
        Invoke-GitChecked -Arguments @("push", $RemoteName, $MainBranch) -ActionDescription "Push RSSReader to $RemoteName"
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
