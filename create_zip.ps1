$sourceDir = $PSScriptRoot
$destZip = Join-Path $sourceDir "LearnSmith_full_code.zip"
if (Test-Path $destZip) {
    Remove-Item -Force $destZip
}

$tempDir = Join-Path $env:TEMP ("LearnSmith_" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir | Out-Null

$excludeNames = @("node_modules", ".git", "LearnSmith_full_code.zip")

Get-ChildItem -Path $sourceDir -Force | ForEach-Object {
    if ($excludeNames -notcontains $_.Name) {
        Copy-Item -Path $_.FullName -Destination $tempDir -Recurse -Force
    }
}

Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $destZip -Force
Remove-Item -Recurse -Force $tempDir

$zipItem = Get-Item $destZip
Write-Output "ZIP_CREATED: $($zipItem.FullName) ($([math]::Round($zipItem.Length / 1MB, 2)) MB)"
