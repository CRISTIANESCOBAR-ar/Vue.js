Add-Type -AssemblyName System.Drawing

function New-Image {
    param (
        [int]$width,
        [int]$height,
        [string]$text,
        [string]$outputPath
    )

    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $brush = [System.Drawing.Brushes]::RoyalBlue
    $graphics.FillRectangle($brush, 0, 0, $width, $height)

    $font = New-Object System.Drawing.Font "Arial", ($width / 5), [System.Drawing.FontStyle]::Bold
    $textBrush = [System.Drawing.Brushes]::White
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $graphics.DrawString($text, $font, $textBrush, ($width / 2), ($height / 2), $format)

    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Host "Created $outputPath"
}

New-Image -width 192 -height 192 -text "STC" -outputPath "public/pwa-192x192.png"
New-Image -width 512 -height 512 -text "STC" -outputPath "public/pwa-512x512.png"
New-Image -width 64 -height 64 -text "STC" -outputPath "public/favicon.ico" # Saving as PNG actually, but naming ico for simplicity or convert later. Browsers handle png favicons.
