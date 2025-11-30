# PowerShell script to remove dev.db from project root
$path = Join-Path $PSScriptRoot "..\dev.db"
if (Test-Path $path) {
    try {
        Remove-Item -LiteralPath $path -Force
        Write-Output "Removed dev.db at: $path"
    } catch {
        Write-Error "Failed to remove dev.db: $_"
    }
} else {
    Write-Output "No dev.db found at: $path"
}
