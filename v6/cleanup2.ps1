$files = @(
  'DataExploration.jsx',
  'DataPreparation.jsx',
  'ModelSelection.jsx',
  'ResultsEvaluation.jsx',
  'Explainability.jsx',
  'EthicsBias.jsx'
)
$dir = 'c:\Users\user\Desktop\projects\Seng430\src\components'

foreach ($f in $files) {
  $path = Join-Path $dir $f
  if (Test-Path $path) {
    $content = Get-Content $path -Raw
    
    # Remove step-accent class (the animated rainbow top bar)
    $content = $content -replace ' step-accent', ''
    
    # Remove boxShadow glow on Next Step buttons inline styles  
    $content = $content -replace "boxShadow: ``0 4px 14px 0 [^']+''40``", ''
    
    # Remove hover:shadow-sm hover:scale-105 active:scale-95 from buttons (overly animated)
    $content = $content -replace 'hover:scale-105 active:scale-95', ''
    $content = $content -replace 'hover:scale-\[1\.03\]', ''
    $content = $content -replace 'hover:scale-\[1\.02\]', ''
    $content = $content -replace 'hover:scale-110', ''
    
    # Remove whileHover and whileTap framer motion props (too bouncy)
    $content = $content -replace "whileHover=\{\{ scale: [0-9.]+ \}\}", ''
    $content = $content -replace "whileHover=\{\{ scale: [0-9.]+, [^}]+ \}\}", ''
    $content = $content -replace "whileTap=\{\{ scale: [0-9.]+ \}\}", ''
    
    # Remove drop-shadow-sm and drop-shadow-md
    $content = $content -replace ' drop-shadow-sm', ''
    $content = $content -replace ' drop-shadow-md', ''
    
    # Remove ring-1 ring-* classes (neon rings)
    $content = $content -replace ' ring-1 ring-[a-z-]+/[0-9]+', ''
    $content = $content -replace ' ring-4 [a-z-]+', ''
    
    Set-Content $path $content -NoNewline
    Write-Host "Processed: $f"
  }
}
Write-Host 'Done!'
