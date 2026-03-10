<#
.SYNOPSIS
    Automated Codex review-debug loop. Runs up to N rounds of Codex review + fix verification.

.DESCRIPTION
    For each round:
    1. Sends file(s) to Codex CLI for bug review
    2. Captures findings to a file
    3. Runs test suite to verify current state
    4. Reports findings for Antigravity to fix
    Stops early if Codex finds no more bugs.

.PARAMETER Files
    Comma-separated list of files to review (relative to workspace)

.PARAMETER MaxRounds
    Maximum number of review rounds (default: 5)

.PARAMETER TestCommand
    Test command to run between rounds (default: auto-detect)

.PARAMETER Workspace
    Workspace root directory (default: repo root)

.PARAMETER PreviousFixes
    Running description of fixes applied (grows each round)

.EXAMPLE
    .\scripts\codex_review_loop.ps1 -Files "scripts/codex_bridge_mcp.py" -MaxRounds 5
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Files,

    [int]$MaxRounds = 5,

    [string]$TestCommand = "",

    [string]$Workspace = ""
)

$ErrorActionPreference = "Stop"

# Resolve workspace
if (-not $Workspace) {
    $Workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

# Output directory
$outputDir = Join-Path $Workspace ".agent" "handoff" "codex-review-loop"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

# Auto-detect test command
if (-not $TestCommand) {
    if (Test-Path (Join-Path $Workspace "scripts\test_codex_bridge_mcp.py")) {
        $TestCommand = "python -m unittest discover -s scripts -p 'test_*.py' -v"
    }
    elseif (Test-Path (Join-Path $Workspace "package.json")) {
        $TestCommand = "npm test"
    }
    elseif (Test-Path (Join-Path $Workspace "pytest.ini") -or (Test-Path (Join-Path $Workspace "pyproject.toml"))) {
        $TestCommand = "python -m pytest -v"
    }
    else {
        $TestCommand = ""
    }
}

$fileList = $Files -split ","

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Codex Review-Debug Loop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Files:      $Files"
Write-Host " Max rounds: $MaxRounds"
Write-Host " Workspace:  $Workspace"
Write-Host " Test cmd:   $(if ($TestCommand) { $TestCommand } else { '(none)' })"
Write-Host " Output dir: $outputDir"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$previousFixes = ""
$totalBugs = 0
$roundResults = @()

for ($round = 1; $round -le $MaxRounds; $round++) {
    Write-Host ""
    Write-Host "--- Round $round of $MaxRounds ---" -ForegroundColor Yellow
    Write-Host ""

    # Build review prompt
    $fileListStr = ($fileList | ForEach-Object { $_.Trim() }) -join ", "
    $prompt = "Review $fileListStr for bugs, logic errors, and edge cases. List only real bugs, not style nits. Be concise."
    if ($previousFixes) {
        $prompt += "`n`nPrevious fixes already applied:`n$previousFixes`n`nFind any REMAINING bugs not yet fixed."
    }

    # Run Codex review
    $outputFile = Join-Path $outputDir "round-${round}-findings.txt"
    $stderrFile = Join-Path $outputDir "round-${round}-stderr.txt"

    Write-Host "[Codex] Reviewing..." -ForegroundColor DarkGray

    try {
        $prompt | codex exec -C $Workspace -s read-only --color never -o $outputFile - 2>$stderrFile
        $exitCode = $LASTEXITCODE
    }
    catch {
        Write-Host "[ERROR] Codex failed to start: $_" -ForegroundColor Red
        $roundResults += @{
            Round   = $round
            Status  = "codex_error"
            Bugs    = 0
            Details = $_.ToString()
        }
        continue
    }

    # Read findings
    if (-not (Test-Path $outputFile) -or (Get-Item $outputFile).Length -eq 0) {
        Write-Host "[Round $round] No output from Codex (exit code: $exitCode)" -ForegroundColor Red

        # Check stderr for clues
        if (Test-Path $stderrFile) {
            $stderr = Get-Content $stderrFile -Tail 3 -ErrorAction SilentlyContinue
            if ($stderr) {
                Write-Host "  Stderr: $($stderr -join ' | ')" -ForegroundColor DarkGray
            }
        }

        $roundResults += @{
            Round   = $round
            Status  = "no_output"
            Bugs    = 0
            Details = "Codex returned no output"
        }
        continue
    }

    $findings = Get-Content $outputFile -Raw -Encoding UTF8

    # Check if clean
    $cleanPatterns = @(
        "no.*bugs",
        "no.*issues",
        "no.*remaining",
        "did not find",
        "looks correct",
        "no additional",
        "clean"
    )
    $isClean = $false
    foreach ($pattern in $cleanPatterns) {
        if ($findings -match $pattern -and $findings -notmatch "\d+\.\s+(High|Medium|Low|Critical):") {
            $isClean = $true
            break
        }
    }

    # Count bugs found
    $bugCount = ([regex]::Matches($findings, "^\d+\.", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count

    if ($isClean -or $bugCount -eq 0) {
        Write-Host "[Round $round] " -NoNewline
        Write-Host "CLEAN - No bugs found!" -ForegroundColor Green
        Write-Host ""
        Write-Host $findings -ForegroundColor DarkGray
        $roundResults += @{
            Round   = $round
            Status  = "clean"
            Bugs    = 0
            Details = $findings
        }
        break
    }

    $totalBugs += $bugCount
    Write-Host "[Round $round] " -NoNewline
    Write-Host "Found $bugCount bug(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host $findings
    Write-Host ""

    $roundResults += @{
        Round   = $round
        Status  = "bugs_found"
        Bugs    = $bugCount
        Details = $findings
    }

    # Run tests if configured
    if ($TestCommand) {
        Write-Host "[Test] Running: $TestCommand" -ForegroundColor DarkGray
        $testOutputFile = Join-Path $outputDir "round-${round}-tests.txt"
        try {
            Push-Location $Workspace
            Invoke-Expression "$TestCommand 2>&1" | Out-File $testOutputFile -Encoding UTF8
            $testExit = $LASTEXITCODE
            Pop-Location
            if ($testExit -eq 0) {
                Write-Host "[Test] PASSED" -ForegroundColor Green
            }
            else {
                Write-Host "[Test] FAILED (exit: $testExit)" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "[Test] Error: $_" -ForegroundColor Red
            Pop-Location
        }
    }

    # Save findings for next round context
    $previousFixes += "`nRound ${round}: $bugCount bugs found. Findings: $($findings.Substring(0, [Math]::Min(500, $findings.Length)))..."

    if ($round -lt $MaxRounds) {
        Write-Host ""
        Write-Host ">>> Waiting for fixes before round $($round + 1)..." -ForegroundColor Yellow
        Write-Host "    Fix the bugs above, then press ENTER to continue." -ForegroundColor Yellow
        Write-Host "    (Or type 'skip' to skip to next round, 'quit' to stop)" -ForegroundColor DarkGray
        $input = Read-Host

        if ($input -eq "quit") {
            Write-Host "Stopping review loop." -ForegroundColor Yellow
            break
        }
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Review Loop Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$completedRounds = $roundResults.Count
$totalBugsFound = ($roundResults | Measure-Object -Property Bugs -Sum).Sum
$lastStatus = if ($roundResults.Count -gt 0) { $roundResults[-1].Status } else { "not_started" }

Write-Host " Rounds completed: $completedRounds / $MaxRounds"
Write-Host " Total bugs found: $totalBugsFound"
Write-Host " Final status:     $lastStatus"
Write-Host ""

foreach ($r in $roundResults) {
    $icon = switch ($r.Status) {
        "clean" { "[OK]" }
        "bugs_found" { "[!!]" }
        "codex_error" { "[ERR]" }
        "no_output" { "[??]" }
        default { "[--]" }
    }
    $color = switch ($r.Status) {
        "clean" { "Green" }
        "bugs_found" { "Red" }
        default { "Yellow" }
    }
    Write-Host "  Round $($r.Round): $icon $($r.Bugs) bugs - $($r.Status)" -ForegroundColor $color
}

# Write summary JSON
$summaryPath = Join-Path $outputDir "summary.json"
$summaryObj = @{
    timestamp      = (Get-Date -Format "o")
    files_reviewed = $fileList
    max_rounds     = $MaxRounds
    rounds         = $roundResults
    total_bugs     = $totalBugsFound
    final_status   = $lastStatus
}
$summaryObj | ConvertTo-Json -Depth 5 | Out-File $summaryPath -Encoding UTF8

Write-Host ""
Write-Host " Summary saved to: $summaryPath" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Cyan
