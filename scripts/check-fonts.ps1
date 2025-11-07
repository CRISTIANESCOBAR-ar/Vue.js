# Check that Poppins woff2 files are served by the local dev server
# Usage: pwsh -NoProfile -File .\scripts\check-fonts.ps1

Set-StrictMode -Version Latest
$base = 'http://localhost:5173/fonts'
$files = @('poppins-300.woff2','poppins-400.woff2','poppins-600.woff2','poppins-700.woff2')

foreach ($f in $files) {
    $url = "$base/$f"
    try {
        $r = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -ErrorAction Stop
        $status = $r.StatusCode
        $cl = $r.Headers['content-length']
        if (-not $cl) { $cl = '(unknown)' }
        Write-Host "$f -> $status Content-Length: $cl"
    } catch {
        # Try a GET if HEAD is not supported
        try {
            $r2 = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -ErrorAction Stop
            $status = $r2.StatusCode
            $len = $r2.RawContentLength
            if (-not $len) { $len = '(unknown)' }
            Write-Host "$f -> $status (GET) RawContentLength: $len"
        } catch {
            Write-Host "$f -> FAILED: $($_.Exception.Message)"
        }
    }
}
