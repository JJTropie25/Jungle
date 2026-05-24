$envPath = Join-Path (Get-Location) '.env'
if (!(Test-Path $envPath)) { throw 'Missing .env' }
$lines = Get-Content $envPath | Where-Object { $_ -and ($_ -notmatch '^\s*#') }
foreach ($line in $lines) {
  $pair = $line.Split('=',2)
  if ($pair.Count -ne 2) { continue }
  $name = $pair[0].Trim()
  $value = $pair[1].Trim()
  if ($name -like 'EXPO_PUBLIC_*') {
    Write-Host "Setting $name on EAS"
    & npx eas-cli env:create --name $name --value $value --environment development --scope project
  }
}
