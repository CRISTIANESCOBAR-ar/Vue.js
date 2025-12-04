
param($Path, $Sheet)
Import-Module ImportExcel
try {
    $data = Import-Excel -Path $Path -WorksheetName $Sheet -NoHeader -StartRow 1 -EndRow 1
    Write-Host "Raw Headers (Row 1):"
    $data.PSObject.Properties | ForEach-Object { 
        if ($_.Name -match '^P\d+$') {
            Write-Host "$($_.Name): '$($_.Value)'"
        }
    }
} catch {
    Write-Host "Error: $_"
}
