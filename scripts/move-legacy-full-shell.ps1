# Bulk git mv to src/legacy/full-shell/ (pause-first Step 3)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$destRoot = 'src/legacy/full-shell'

function Move-Legacy($relPath) {
  if (-not (Test-Path $relPath)) { return }
  $target = Join-Path $destRoot $relPath
  $targetDir = Split-Path -Parent $target
  if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
  git mv $relPath $target
  Write-Host "moved $relPath"
}

$files = @(
  'src/pages/ToolsHub.tsx',
  'src/pages/Ground.tsx',
  'src/pages/GroundHistory.tsx',
  'src/pages/ToolsGroundLayout.tsx',
  'src/pages/ToolsLetters.tsx',
  'src/pages/Breathe.tsx',
  'src/pages/PracticeCheckIn.tsx',
  'src/pages/PracticeJournal.tsx',
  'src/pages/PracticeBodyScan.tsx',
  'src/pages/PracticeReplay.tsx',
  'src/pages/Profile.tsx',
  'src/pages/BadgeGuide.tsx',
  'src/components/BadgesPanelV2.tsx',
  'src/components/AIInsightsPanel.tsx',
  'src/components/ReflectionWallpaper.tsx',
  'src/components/NightReflectionCard.tsx',
  'src/components/pause/PauseDoneBriefJourneyRecap.tsx',
  'src/components/home/HomeStatTiles.tsx',
  'src/components/home/HomeQuickCapture.tsx',
  'src/hooks/use-badge-sync.ts',
  'src/hooks/use-pause-stats-data.ts',
  'src/hooks/use-tools-hub-data.ts',
  'src/hooks/use-badges.ts',
  'src/lib/pause-stats-data-query.ts',
  'src/lib/tools-catalog.ts',
  'src/lib/tools-hub-data-query.ts',
  'src/lib/tools-hub-practice-suggestions.ts',
  'src/lib/grounding-enrichment-query.ts',
  'src/lib/guided-journal-prompts-query.ts',
  'src/lib/night-reflection-visible-query.ts',
  'src/lib/home-quick-capture-last-pause-query.ts'
)

foreach ($f in $files) { Move-Legacy $f }

$dirs = @(
  'src/components/stats',
  'src/components/practice',
  'src/components/tools',
  'src/lib/badges',
  'src/lib/stats'
)

foreach ($d in $dirs) {
  if (Test-Path $d) {
    $target = Join-Path $destRoot $d
    $targetParent = Split-Path -Parent $target
    if (-not (Test-Path $targetParent)) { New-Item -ItemType Directory -Path $targetParent -Force | Out-Null }
    git mv $d $target
    Write-Host "moved dir $d"
  }
}

Write-Host 'Done.'
