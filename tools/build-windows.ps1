# Rebuild the player distribution using the compiler shipped with Windows/.NET Framework.
$ErrorActionPreference = 'Stop'
$gameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseRoot = Join-Path $gameRoot 'release'
$destination = Join-Path $releaseRoot 'Arauto do Sol - Demo v0.6.0'
$zipPath = Join-Path (Split-Path $gameRoot -Parent) 'Arauto-do-Sol-v0.6.0-Windows.zip'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (!(Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
New-Item -ItemType Directory -Force -Path $destination | Out-Null
foreach ($folder in @('src','config')) {
    Copy-Item -LiteralPath (Join-Path $gameRoot $folder) -Destination $destination -Recurse -Force
}
foreach ($file in @('index.html','style.css')) {
    Copy-Item -LiteralPath (Join-Path $gameRoot $file) -Destination $destination -Force
}
$spriteSource = Join-Path $gameRoot 'assets\sprites'
$spriteDestination = Join-Path $destination 'assets\sprites'
# Only runtime PNGs and the relative-path manifest; no RAW, previews, Python or reports.
$runtimeSprites = [Collections.Generic.HashSet[string]]::new()
foreach ($group in @('protagonist','world')) {
    $manifest = Get-Content -LiteralPath (Join-Path $spriteSource "$group\manifest.json") -Raw | ConvertFrom-Json
    [void]$runtimeSprites.Add("$group/manifest.json")
    if ($group -eq 'protagonist') {
        foreach ($animation in $manifest.animations.PSObject.Properties.Value) {
            foreach ($frame in $animation.frames) { [void]$runtimeSprites.Add("$group/" + $frame.file) }
        }
    } else {
        foreach ($asset in $manifest.assets.PSObject.Properties.Value) { [void]$runtimeSprites.Add("$group/" + $asset.file) }
        foreach ($background in $manifest.backgrounds.PSObject.Properties.Value) {
            foreach ($panel in $background.panels) { [void]$runtimeSprites.Add("$group/" + $panel.file) }
        }
    }
}
foreach ($relativeSprite in $runtimeSprites) {
    $spriteTarget = Join-Path $spriteDestination $relativeSprite
    New-Item -ItemType Directory -Force -Path (Split-Path $spriteTarget -Parent) | Out-Null
    Copy-Item -LiteralPath (Join-Path $spriteSource $relativeSprite) -Destination $spriteTarget -Force
}
Copy-Item -LiteralPath (Join-Path $gameRoot 'tools\LEIA-ME-JOGADOR.txt') -Destination (Join-Path $destination 'LEIA-ME.txt') -Force
$exe = Join-Path $destination 'Jogar Arauto do Sol.exe'
& $compiler /nologo /target:winexe /platform:anycpu /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll "/out:$exe" (Join-Path $gameRoot 'tools\WindowsLauncher.cs')
if ($LASTEXITCODE -ne 0) { throw 'A compilação do iniciador falhou.' }
Compress-Archive -LiteralPath $destination -DestinationPath $zipPath -Force
Get-Item -LiteralPath $zipPath | Select-Object FullName,Length
