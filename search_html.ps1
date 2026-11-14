Get-ChildItem -Path "frontend" -Recurse -Filter *.html | ForEach-Object {
    $content = Get-Content -Raw -Path $_.FullName
    if ($content -like '*<<*') {
        Write-Output $_.FullName
    }
}
