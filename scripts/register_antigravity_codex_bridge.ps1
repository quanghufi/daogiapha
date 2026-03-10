[CmdletBinding()]
param(
    [string]$ServerName = "codex-bridge"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$bridgePath = (Resolve-Path (Join-Path $repoRoot "scripts\codex_bridge_mcp.py")).Path
$schemaPath = (Resolve-Path (Join-Path $repoRoot "scripts\codex_review_schema.json")).Path
$convSchemaPath = (Resolve-Path (Join-Path $repoRoot "scripts\codex_conversation_schema.json")).Path

$pythonCommand = $null
$pythonPrefixArgs = @()
$antigravity = Get-Command antigravity -ErrorAction Stop

$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    $pythonCommand = $python.Source
}
else {
    $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        $pythonCommand = $pyLauncher.Source
        $pythonPrefixArgs = @("-3")
    }
    else {
        throw "Neither 'python' nor 'py' is available in PATH."
    }
}

$serverArgs = $pythonPrefixArgs + @(
    $bridgePath,
    "--workspace",
    $repoRoot,
    "--schema",
    $schemaPath,
    "--conversation-schema",
    $convSchemaPath,
    "--codex-timeout-sec",
    "600",
    "--codex-profile",
    "9router"
)

$serverDefinition = @{
    name    = $ServerName
    command = $pythonCommand
    args    = $serverArgs
}

$json = $serverDefinition | ConvertTo-Json -Compress

Write-Host "Registering MCP server '$ServerName' in Antigravity..."
$antigravityExe = $antigravity.Source
$env:CODEX_BRIDGE_REGISTRATION_JSON = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
$env:CODEX_BRIDGE_ANTIGRAVITY_EXE = $antigravityExe
$encodedCommand = @'
import base64
import os
import subprocess

payload = base64.b64decode(os.environ["CODEX_BRIDGE_REGISTRATION_JSON"]).decode("utf-8")
antigravity_exe = os.environ["CODEX_BRIDGE_ANTIGRAVITY_EXE"]
subprocess.run([antigravity_exe, "--add-mcp", payload], check=True)
'@

$pythonRunnerArgs = $pythonPrefixArgs + @("-")
$encodedCommand | & $pythonCommand @pythonRunnerArgs
$env:CODEX_BRIDGE_REGISTRATION_JSON = $null
$env:CODEX_BRIDGE_ANTIGRAVITY_EXE = $null
Write-Host "Done."
