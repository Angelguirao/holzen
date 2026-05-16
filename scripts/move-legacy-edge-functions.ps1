# Move non-MVP edge handlers to supabase/functions/legacy/full-shell/
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

$legacy = @(
  'badge-notify',
  'reflection-insights',
  'journal-prompt',
  'deliver-letters',
  'night-reflection',
  'weekly-digest',
  'monthly-report',
  'personalized-nudge',
  'generate-wallpaper',
  'suggest-grounding',
  'suggest-ritual',
  'fetch-source-feeds',
  'admin-library-preview'
)

$destRoot = 'supabase/functions/legacy/full-shell'
New-Item -ItemType Directory -Force -Path $destRoot | Out-Null

foreach ($name in $legacy) {
  $src = "supabase/functions/$name"
  if (Test-Path $src) {
    git mv $src "$destRoot/$name"
    Write-Host "moved $name"
  }
}

Write-Host 'Done.'
