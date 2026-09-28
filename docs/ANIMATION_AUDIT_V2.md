# Expansão das animações — auditoria anterior à geração

19/09/2026. Fontes: Player, Enemy, CemeteryGuardian, tuning, PlayerAnimator e ActorAnimator. Perfis, paletas e câmera 1,25 preservados. A implementação visual apenas observa o mundo.

| Entidade | Gameplay → apresentação | Relógio / prioridade |
|---|---|---|
| Player | parado → idle; chão + velocidade → walk/run; vy negativo → jump; restante aéreo → fall | death > hurt > último ataque iniciado > aéreo > movimento > idle |
| Player | cooldown light/m2 iniciado → attack-light / attack-m2 | Ambos causam dano imediatamente; 0,25 s de cooldown. Primeiro quadro deve representar contato; preparação não pode atrasar contato. M1 estocada, M2 diagonal. |
| Player | perda de crânios → hurt; dying → death | 0,14 / 0,85 s. Ataques alternados podem interromper visualmente um ao outro. |
| Walker | idle com deslocamento observado → walk; windup/active/recovery → respectivos sets | 0,65 / 0,16 / 1,25 s. Active começa antes do primeiro tick com hitbox. |
| Lunger | idle com deslocamento → walk; windup → compressão; active → galope; recovery → freada/hold | 0,85 / 0,48 / 1,80 s; deslocamento só pela AI. |
| Ranged | idle com deslocamento/passo atrás → walk; windup → cajado; active → disparo; recovery → hold | 0,90 / 0,12 / 2,30 s. Projétil nasce na transição windup→active. |
| Inimigos | redução de health → hurt; dead → death | Stun 0,18 s; hurt visual até 0,20; death 0,40 s. Dano reinicia recovery real. |
| Boss | intro → despertar; approach móvel → walk, imóvel → idle | Intro 1,80 s, approach até 2,30 s. |
| Boss slash | windup / active / recovery → sets próprios | 0,95 / 0,20 / 2,10 s. |
| Boss charge | windup / active / recovery → sets próprios | 1,15 / 0,95 / 2,40 s. |
| Boss slam | windup / active / recovery → sets próprios | 1,20 / 0,60 / 2,60 s. Active inclui salto; impacto só no fim. Não representar contato no começo do salto. |
| Boss phase 2 | health <= 50% → sinal visual separado | Não existe estado nem janela de transição na AI. Sinal de 5 quadros em overlay mantém telegraph/ataque visível; não impõe trava de 0,85 s. Recovery subsequente ×0,85. |
| Boss hurt/death | dano → flash/flinch seguro; dead → colapso | Hurt não deve encobrir telegraph/active; sem knockback. Death tem 0,40 s para 6 quadros; fluxo pós-boss permanece existente. |

## Implementação planejada

Reutilizar pipeline.process e perfis aprovados. RAW novos em assets/raw/animations-v2, sem substituir fontes anteriores. Escala única por lote calibrada pela anatomia, nunca pelo bounding box individual. Metadata inclui durações por frame, loop e marcadores exclusivamente visuais. Relógios de fases derivam de timers reais; loops ambientais têm relógio visual independente. Carregamento antecipado.

Gates: Player completo e inspecionado → Walker → Lunger → Ranged → Boss → VFX → testes e playtest completo. Relatório final distinguirá execução real de fixtures visuais.
