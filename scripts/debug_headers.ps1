
param($Path, $Sheet)
Import-Module ImportExcel
try {
    $data = Import-Excel -Path $Path -WorksheetName $Sheet -StartRow 1 -EndRow 2
    $headers = $data[0].PSObject.Properties | Select-Object -ExpandProperty Name
    Write-Host "Headers found:"
    $headers -join ", "
    
    Write-Host "`nFirst row data:"
    $data[0] | Out-String
} catch {
    Write-Host "Error: $_"
}
