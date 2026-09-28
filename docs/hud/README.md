# HUD com maior definição — v0.5.4

Medalhão, caveiras de vida, moldura de energia e fragmento reprocessados a partir de `assets/raw/world/hud.png`, preservado. Perfil `hud-detail.json`: canvas 512×192, pivot (256,176), densidade 4, escala de tela 0,25, paleta original de 16 cores, Lanczos inicial, alpha 128, sem dithering nem smoothing.

Posições e tamanho do HUD preservados. A barra lê a densidade do asset para manter exatamente os mesmos retângulos e preenchimentos, inclusive em 0%, 10%, 50% e 100%. O medalhão do menu e a moldura compartilhada do boss também recebem a definição maior, sem alteração de tamanho. Gameplay, personagens e cenário não foram alterados.

Reprodução: `python tools/sprite_pipeline/build_world.py --hud`. Comparação por arquivo em `production.json`; manifesto anterior em `before-manifest.json`. Validação visual no navegador e testes registrados em `tests.txt`.
