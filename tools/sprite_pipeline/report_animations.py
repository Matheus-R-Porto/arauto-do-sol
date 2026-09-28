"""Write the reviewable inventory directly from integrated runtime metadata."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2]
hero=json.loads((ROOT/'assets/sprites/protagonist/manifest.json').read_text())
world=json.loads((ROOT/'assets/sprites/world/manifest.json').read_text())
lines=['# Relatório — expansão das animações v0.5.0','',
'## 1–2. State machine audit e animation map','',
'A auditoria anterior à geração está em [ANIMATION_AUDIT_V2.md](ANIMATION_AUDIT_V2.md). Player: death > hurt > último ataque iniciado > jump/fall > run/walk > idle. AI dos inimigos: idle (inclui patrulha/perseguição/recuo), windup, active, recovery; dano e morte são sobreposições observadas. Boss: intro, approach, windup, active, recovery, dead; phase 2 é uma flag, não um estado com pausa.',
'',
'Timers de fases fornecem o tempo das animações. Recovery segura a pose final; a fase 2 comprime a sequência conforme a duração real de recovery. Marcadores não criam dano nem projéteis. Hitstop e transições congelam os relógios visuais. Direção usa o facing da entidade; inverter o sprite não reinicia a animação.',
'',
'## 3–7. Inventário integrado por entidade','',
'Os caminhos abaixo são relativos a assets/sprites/protagonist (Player) ou assets/sprites/world (demais). Cada pasta contém PNGs individuais; o primeiro caminho identifica o conjunto. Todos os quadros de um conjunto são distintos após processamento.',
'']
groups={'player':hero['animations'],**{k:v for k,v in world['animations'].items() if k!='vfx'}}
for actor,anims in groups.items():
    lines += [f'### {actor}','', '| Animação | Quadros | Duração (s) | Reprodução | Marcadores | Primeiro frame |','|---|---:|---:|---|---|---|']
    for name,a in anims.items():
        markers=', '.join(f"{m['name']} @{m['time']}" for m in a.get('markers',[])) or '—'
        lines += [f"| {name} | {len(a['frames'])} | {sum(f['duration'] for f in a['frames']):.3f} | {'loop' if a['loop'] else '1× + hold'} | {markers} | {a['frames'][0]['file']} |"]
    lines+=['']
lines += [
'Walker mantém 0,65 / 0,16 / 1,25 s; Lunger 0,85 / 0,48 / 1,80 s; Ranged 0,90 / 0,12 / 2,30 s. Hurt visual dos inimigos dura até 0,20 s, sem estender stun; morte acompanha os 0,40 s existentes.',
'',
'M1 é estocada; M2 é corte diagonal. Como ambos aplicam dano imediatamente, o contato é o primeiro quadro, seguido de follow-through e retorno à guarda. Não foi acrescentada preparação que atrasasse o acerto. Jump/fall são subordinados à velocidade vertical; os dois quadros de queda não ficam alternando indefinidamente.',
'',
'Boss: intro 1,80 s; slash 0,95 / 0,20 / 2,10; charge 1,15 / 0,95 / 2,40; slam 1,20 / 0,60 / 2,60. Recovery ×0,85 na fase 2. Os 3 quadros de slam active usam 0,30 / 0,28 / 0,02 s: contato só ao fim da trajetória real. A morte usa 6 quadros em 0,40 s. A arena deixa de estar selada na derrota lógica, mas o intervalo pós-boss existente de 2,40 s impede sair antes de terminar o colapso.',
'',
'**Transição de fase: adaptação explícita.** O boss atual não possui pausa de transição. Os 5 quadros de 0,85 s são um halo animado independente sobre a cabeça. O corpo continua exibindo seu ataque/movimento real. Assim não se oculta uma hitbox ativa com uma pose inofensiva, nem se inventa invulnerabilidade. Metadata: world.animations.vfx.phase-transition. Hurt também não encobre windup/active.',
'',
'## 8. VFX','', '| Efeito | Quadros | Duração (s) | Uso / disparo |','|---|---:|---:|---|']
uses={'phase-transition':'flag phase 1 → 2; overlay não bloqueante','projectile':'somente projétil real existente; loop','projectile-impact':'remoção por colisão; exclui TTL e troca de sala','flame':'checkpoint e brilho do boss fase 2; loop','charge':'windup do cajado; marcador fire mostra pulso final por 0,06 s','slash-light':'flash real de M1; rastro linear de estocada','slash-heavy':'M2 e golpe do Walker; recortado à área do golpe','boss-slash':'corte do boss; variante maior do mesmo RAW','hit':'redução real de health e feedback de coleta/progressão','dust':'pouso, corrida do Player, investida do Lunger/Guardião','shockwave':'primeiro tick com hitbox real do slam, uma vez'}
for name,a in world['animations']['vfx'].items():
    lines += [f"| {name} | {len(a['frames'])} | {sum(f['duration'] for f in a['frames']):.3f} | {uses[name]} |"]
lines += [
'',
'VFX são separados do corpo e não influenciam dano, spawn ou colisão. Escalas diferentes dos cortes são exportadas do RAW com a mesma paleta, sem esticar pixel art no renderer. Flashes brancos são silhuetas em cache, não cores extras nos PNGs.',
'',
'## 9–11. RAW, final e metadata','',
'- RAW novos: assets/raw/animations-v2/{player,walker,lunger,ranged,boss,vfx}. Treze PNGs originais preservados. Prompts exatos: tools/sprite_pipeline/animation-build.json e batch*.json nas pastas RAW. Geração pela ferramenta imagegen integrada.',
'- Fontes anteriores preservadas; jump/fall/hurt/death do Player reaproveitam os 10 quadros já aprovados.',
'- Final: assets/sprites/protagonist/v2/player e assets/sprites/world/v2/{walker,lunger,ranged,boss,vfx}.',
'- Metadata consumida: assets/sprites/protagonist/manifest.json e assets/sprites/world/manifest.json (animations, frames, durations, loop, markers).',
'- Receitas reproduzíveis: tools/sprite_pipeline/animation-build.json; exportação incremental: build_animations.py --actor player|walker|lunger|ranged|boss|vfx; sem argumento exporta apenas esta expansão.',
'- Hashes RAW: docs/animations-v2/raw-sha256.json. Relatório por quadro: production-all.json. Provas em 1×: *-native.png; ampliação auxiliar *-4x.png usa nearest.',
'',
'Perfis/paletas aprovados preservados, Lanczos inicial e nearest posterior, alpha binário 128, sem dithering. Player: canvas 64×40, pivot 32,36, altura de referência 24, paleta mestre de até 16 cores. Walker 24; Lunger 18; Ranged 32; Boss 65 de referência. A escala é única por lote e vem da receita/perfis existentes, nunca é ajustada por quadro.',
'',
'**Exceção técnica documentada no canvas do boss:** a arma levantada/recuada foi rejeitada pelo pipeline por clipping no canvas 128×96/pivot 40,90. Para todos os novos quadros do boss, o perfil boss-animation.json usa canvas 128×112/pivot 64,106, ainda sob 128×128. Só mudou a margem transparente. O ponto de apoio desenhado continua na mesma coordenada do mundo; escala/paleta/hitboxes/timers não mudaram. Alinhamento do galope usa raízes comuns no RAW para não acompanhar pontas de pés móveis.',
'',
'## 12. Renderer','',
'PlayerSpriteView continua usando os cooldowns, morte e movimento observados. ActorAnimator passou a selecionar quadros por duração, com relógios derivados dos timers reais. WorldArt carrega os PNGs antecipadamente, observa danos/colisões/fase e desenha VFX independentes. MarkerCursor impede eventos duplicados. Silhuetas brancas são preparadas no carregamento, sem novos Image objects por frame. O idle do boss também aparece na antevisão existente da sala de repouso.',
'',
'## 13–14. Gameplay e hitboxes','',
'Nenhuma alteração em regras, física, velocidades, energia, IA, mapa, dano, hitboxes ou timings. Os hashes de docs/art-world/gameplay-baseline.json continuam passando. Câmera 1,25 mantida. O teste pareado com/sem apresentação termina com estado idêntico, inclusive posições, energia, progresso e mortes.',
'',
'## 15. Testes automatizados','',
'npm test: todas as suítes anteriores preservadas e aprovadas; 7 testes novos de animações (inventário, timers/recovery, fase 2, morte/hitstop/flip, loop/hold, marcador real de disparo, impacto sem TTL/troca de sala). Logs: docs/animations-v2/tests-node.txt.',
'',
'Python: 38 testes aprovados, incluindo reconstrução byte a byte, RAW imutável, método por perfil, paleta mestre, alpha, canvas/pivot e distinção dos frames. validate_world.py confere 210 sprites do mundo e os 48 painéis de fundo. Logs: docs/animations-v2/tests-python.txt. Estética não é declarada aprovada por teste automático.',
'',
'## 16. Playtest','',
'Percurso real assistido no navegador: 17/17 salas, quatro fragmentos, cinco mortes deliberadas, boss derrotado e saída/fim funcionais em 355,7 s simulados. O controlador usa comandos normais; não teleporta, cura ou modifica estados da AI. Nenhum erro registrado no console. Ver docs/animations-v2/browser-playtest.txt para estados e medição de renderização.',
'',
'Inspeção visual complementar: idle Player em sala real a 1×, flip e collider; provas de todos os frames em resolução nativa; Walker windup, Lunger active espelhado, Ranged active e boss com arma levantada na página animation-sets.html. Essa página é uma fixture visual; não é confundida com o percurso jogável acima. Nela, um caso adicional executou a AI real do Ranged: -18,70 px de recuo em 0,85 s, com todos os 4 quadros de walk observados.',
'',
'## 17. Limitações restantes','',
'A resolução pequena simplifica dedos, tecidos e detalhes do equipamento; não é um passe de animação desenhado quadro a quadro à mão. Há discretização de 1 pixel em contornos e alguma variação de tecido entre poses. O ciclo de caminhada tem duração fixa enquanto o gameplay acelera/desacelera, então pode haver deslizamento dos pés nessas transições. Não foi implementado um sistema novo de foot locking. Não foi observado clipping dos PNGs finais; o pipeline o rejeita. O zoom 1,25 mantém nearest, mas repete pixels em tamanhos alternados, característica já existente.',
'',
'O sinal da fase 2 é um overlay de cinco quadros, não uma nova pausa do corpo. Isso é intencional para preservar os ataques existentes. O flash de hurt do boss não sobrepõe seus sinais de ataque.',
'',
'Pacote Windows atualizado: Arauto-do-Sol-v0.5.0-Windows.zip, na pasta acima do projeto. Somente arquivos usados pelo runtime, sem RAW/ferramentas. Integridade do ZIP e autoteste do iniciador em release-check.json / launcher-test.txt.',
]
(ROOT/'docs/RELATORIO_ANIMACOES_V2.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('Relatório atualizado')

