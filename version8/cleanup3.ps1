$dir = 'c:\Users\user\Desktop\projects\Seng430\src\components'

$files = Get-ChildItem -Path $dir -Filter '*.jsx' -Recurse
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $changed = $false
    
    # Replace glass-depth classes with solid card styles
    $replacements = @{
        'glass-depth-light-3' = 'bg-white border-slate-200'
        'glass-depth-light-2' = 'bg-white border-slate-200'
        'glass-depth-light-1' = 'bg-white border-slate-200'
        'glass-depth-3' = 'bg-slate-800 border-slate-700'
        'glass-depth-2' = 'bg-slate-800 border-slate-700'
        'glass-depth-1' = 'bg-slate-800 border-slate-700'
    }
    
    foreach ($key in $replacements.Keys) {
        if ($content.Contains($key)) {
            $content = $content.Replace($key, $replacements[$key])
            $changed = $true
        }
    }
    
    # Remove card-inner-shine 
    if ($content.Contains('card-inner-shine')) {
        $content = $content.Replace(' card-inner-shine', '')
        $content = $content.Replace('card-inner-shine ', '')
        $content = $content.Replace('card-inner-shine', '')
        $changed = $true
    }
    
    # Remove metric-value-glow
    if ($content.Contains('metric-value-glow')) {
        $content = $content.Replace(' metric-value-glow', '')
        $content = $content.Replace('metric-value-glow ', '')
        $content = $content.Replace('metric-value-glow', '')
        $changed = $true
    }
    
    # Remove feature-bar-container
    if ($content.Contains('feature-bar-container')) {
        $content = $content.Replace(' feature-bar-container', '')
        $content = $content.Replace('feature-bar-container ', '')
        $content = $content.Replace('feature-bar-container', '')
        $changed = $true
    }
    
    if ($changed) {
        Set-Content $f.FullName $content -NoNewline
        Write-Host "Processed: $($f.Name)"
    }
}

Write-Host 'Done!'
