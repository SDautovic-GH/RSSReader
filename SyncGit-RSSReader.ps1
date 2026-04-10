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
$RepoPath = "C:\.ScriptLibrary\RSS Reader"
$OneDrivePath = "C:\Users\21968\OneDrive - WilmerHale\.ScriptLibrary\RSS Reader"
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

    # Abort any in-progress merge before checkout (avoids "needs merge" index error)
    $mergeHead = Join-Path $RepoPath ".git\MERGE_HEAD"
    if (Test-Path $mergeHead) {
        Write-Host "Unresolved merge detected - aborting before checkout."
        & git merge --abort 2>$null
    }

    Invoke-GitChecked -Arguments @("checkout", $MainBranch) -ActionDescription "Checkout $MainBranch"

    # Restore any tracked files that are missing from disk before staging
    $deletedTracked = & git ls-files --deleted 2>$null
    foreach ($f in ($deletedTracked | Where-Object { $_ -match '\S' })) {
        & git checkout -- $f 2>$null
        Write-Host "Restored missing tracked file: $f"
    }

    # Force-add .opml, .md, and .html — parent .gitignore would otherwise block them
    $forceFiles = @(Get-ChildItem -Path $RepoPath -File -Include "*.opml","*.md","*.html" -ErrorAction SilentlyContinue)
    foreach ($f in $forceFiles) {
        & git add --force -- $f.Name 2>$null
    }

    # Commit any local changes BEFORE pulling to avoid merge conflicts
    Invoke-GitChecked -Arguments @("add", "-A") -ActionDescription "Stage RSSReader changes"
    $PrePullChanges = & git status --porcelain 2>$null
    if ($PrePullChanges) {
        $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Invoke-GitChecked -Arguments @("commit", "-m", "Auto sync $TimeStamp") -ActionDescription "Commit RSSReader changes before pull"
    }

    Invoke-GitChecked -Arguments @("pull", "--no-rebase", $RemoteName, $MainBranch) -ActionDescription "Pull $MainBranch"

    # Check for any remaining changes after pull and commit
    $RSSChanges = & git status --porcelain 2>$null
    if ($RSSChanges) {
        Invoke-GitChecked -Arguments @("add", "-A") -ActionDescription "Stage post-pull changes"
        $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Invoke-GitChecked -Arguments @("commit", "-m", "Auto sync $TimeStamp") -ActionDescription "Commit RSSReader changes"
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
