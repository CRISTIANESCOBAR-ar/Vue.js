# Download Poppins woff2 files (300,400,600,700) into public/fonts/
# Usage: pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\download-poppins.ps1

Set-StrictMode -Version Latest
# Determine repository root (script is in <repo>/scripts)
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot
$fontsDir = Join-Path $repoRoot 'public\fonts'
New-Item -ItemType Directory -Path $fontsDir -Force | Out-Null

$cssUrl = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap'
Write-Host "Fetching CSS from $cssUrl ..."
# Use a modern Chrome User-Agent so Google Fonts returns woff2 references
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
try {
    $css = (Invoke-WebRequest -Uri $cssUrl -Headers @{ 'User-Agent' = $ua } -UseBasicParsing -ErrorAction Stop).Content
} catch {
    Write-Error "Error fetching CSS: $_"
    exit 1
}

Write-Host "CSS length: $($css.Length)"
Write-Host "CSS preview (first 600 chars):"
Write-Host ($css.Substring(0,[math]::Min(600,$css.Length)))

# Find @font-face blocks and extract weight -> woff2 URL using a single regex
$map = @{}
[regex]$re = '@font-face[\s\S]*?font-weight:\s*(\d+)[\s\S]*?url\((https://[^)]+\.woff2)'
$matches = $re.Matches($css)
foreach ($m in $matches) {
    $w = $m.Groups[1].Value
    $url = $m.Groups[2].Value
    if (-not $map.ContainsKey($w)) { $map[$w] = $url }
}

$wanted = @{
    300 = 'poppins-300.woff2'
    400 = 'poppins-400.woff2'
    600 = 'poppins-600.woff2'
    700 = 'poppins-700.woff2'
}

$success = @()
$fail = @()
foreach ($k in $wanted.Keys) {
    $key = [string]$k
    if ($map.ContainsKey($key)) {
        $url = $map[$key]
        $out = Join-Path $fontsDir $wanted[$k]
        Write-Host "Downloading weight $k -> $out"
        try {
            Invoke-WebRequest -Uri $url -OutFile $out -Headers @{ 'User-Agent'=$ua } -UseBasicParsing -ErrorAction Stop
            $success += $out
        } catch {
            Write-Warning "Failed to download $url : $_"
            $fail += $k
        }
    } else {
        Write-Warning "No URL found for weight $k"
        $fail += $k
    }
}

Write-Host "`nDownload summary:"
if ($success.Count -gt 0) { Write-Host "Downloaded:"; $success | ForEach-Object { Write-Host "  - $_" } }
if ($fail.Count -gt 0) { Write-Warning "Failed for weights: $($fail -join ', ')" }

Write-Host "`nFiles in ${fontsDir}:"
Get-ChildItem $fontsDir -File | Select-Object Name, @{Name='KB';Expression={[math]::Round($_.Length/1KB,2)}} | Format-Table -AutoSize

Write-Host "\nDone. If files downloaded, restart dev server to pick them up."
