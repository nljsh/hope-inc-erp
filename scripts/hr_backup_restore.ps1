param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("backup", "restore")]
    [string]$Action,

    [Parameter(Mandatory = $false)]
    [string]$DatabaseUrl = $env:DATABASE_URL,

    [Parameter(Mandatory = $false)]
    [string]$OutputFile = "backups\hope_hr_backup.sql",

    [Parameter(Mandatory = $false)]
    [string]$InputFile = "backups\hope_hr_backup.sql"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    throw "DATABASE_URL is not set. Pass -DatabaseUrl or set `$env:DATABASE_URL before running."
}

if ($Action -eq "backup") {
    $parentDir = Split-Path -Path $OutputFile -Parent
    if ($parentDir -and -not (Test-Path -Path $parentDir)) {
        New-Item -ItemType Directory -Force -Path $parentDir | Out-Null
    }

    Write-Host "Creating HR/public backup to $OutputFile..."
    pg_dump "$DatabaseUrl" `
        --schema=public `
        --no-owner `
        --no-privileges `
        --file="$OutputFile"

    Write-Host "Backup completed: $OutputFile"
}
elseif ($Action -eq "restore") {
    if (-not (Test-Path -Path $InputFile)) {
        throw "Backup file not found: $InputFile"
    }

    Write-Host "Restoring database from $InputFile..."
    psql "$DatabaseUrl" -v ON_ERROR_STOP=1 -f "$InputFile"
    Write-Host "Restore completed from: $InputFile"
}
