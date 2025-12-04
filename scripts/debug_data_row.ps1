
param($Path, $Sheet)
Import-Module ImportExcel
try {
    $data = Import-Excel -Path $Path -WorksheetName $Sheet -NoHeader -StartRow 2 -EndRow 2
    Write-Host "Row 2 Data:"
    $data.PSObject.Properties | ForEach-Object { 
        if ($_.Name -match '^P\d+$') {
            Write-Host "$($_.Name): '$($_.Value)'"
        }
    }
} catch {
    Write-Host "Error: $_"
}
