# Run migration helper - run this in PowerShell on your machine
# It will prompt for Oracle credentials, create server/.env (local), run the migration script
# and leave the .env file in place (so server can use it). Do NOT paste credentials here.

Write-Host "This helper will run rename_comment_to_comment_text.js using local credentials."

$oracleUser = Read-Host -Prompt 'ORACLE_USER'
$oraclePassword = Read-Host -Prompt 'ORACLE_PASSWORD' -AsSecureString
$oracleConnectionString = Read-Host -Prompt 'ORACLE_CONNECTIONSTRING (host:port/servicename)'
$schemaPrefix = Read-Host -Prompt 'SCHEMA_PREFIX (optional, e.g. MYSCHEMA.)'

# Convert secure string to plain (only in local script), will be written to .env
$ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($oraclePassword)
$plainPwd = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

$envContent = @"
ORACLE_USER=$oracleUser
ORACLE_PASSWORD=$plainPwd
ORACLE_CONNECTIONSTRING=$oracleConnectionString
PORT=3001
SCHEMA_PREFIX=$schemaPrefix
"@

$envPath = Join-Path -Path (Get-Location) -ChildPath 'server\.env'

Write-Host "Writing .env to: $envPath"
$envContent | Out-File -FilePath $envPath -Encoding UTF8

Write-Host "Running migration script..."
node server/rename_comment_to_comment_text.js

$exitCode = $LASTEXITCODE
if ($exitCode -eq 0) {
    Write-Host "Migration script finished successfully. Check DB to validate." -ForegroundColor Green
}
else {
    Write-Host "Migration script finished with exit code $exitCode" -ForegroundColor Yellow
}

Write-Host "Helper done. .env left in server/.env (remove it if you prefer)."
