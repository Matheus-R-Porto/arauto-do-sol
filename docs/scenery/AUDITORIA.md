# Auditoria anterior ao retrabalho

Referência: v0.5.2, travessia completa 17/17 salas, 355,7 s simulados, cinco mortes e quatro fragmentos. PNGs finais de cenário ainda não foram substituídos nesta etapa.

Prioridade 1: árvore, estátua, sino, mausoléu e janelas. Prioridade 2: portões, arcos e terreno. Prioridade 3: urnas, lápides, altar, fonte, alavanca e demais props pequenos. Fundos: aumentar definição moderadamente, conservar paleta/overlays e fatores de parallax. HUD, personagens, animações e VFX fora do retrabalho.

| Sala | Diagnóstico/prioridade |
|---|---|
| Câmara do despertar | Mausoléu e moldura do arco perdem ornamentos; tijolos apresentam pixels grandes. |
| Passagem das lápides | Árvore prioritária: contorno dos ramos serrilhado; faixa central da raiz termina cerca de 2 px acima da superfície, embora uma raiz lateral alcance a baseline. |
| Pátio da estátua | Estátua e degraus do pedestal perdem definição; manter plataformas passando à frente. |
| Vigília da corrente | Portão e corrente pouco definidos; ledges precisam continuar distintos da arquitetura. |
| Poço dos sinos | Sino grande com inscrição degradada pela redução; preservar suspensão, não assentá-lo artificialmente no piso. |
| Ponte do contrapeso | Lápides, alavanca e vista distante de ossos; fundo não deve sugerir nova ponte. |
| Cripta das raízes | Raízes/árvores e moldura da vista; manter leitura da descida e plataformas acima da névoa. |
| Capela sem teto | Janela/rosácea e pedra secreta; manter segredo reconhecível sem parecer nova plataforma. |
| Grande ossuário | Pilha de ossos e repetição de pedra; foreground legível contra arquitetura distante. |
| Escadaria das urnas | Urnas precisam recuperar relevo, sem mudar degraus e plataformas. |
| Galeria das sentinelas | Janela e lápides: padronizar densidade de detalhe. |
| Jardim das cinzas | Fonte pequena perde entalhes; preservar contraste moderado do exterior. |
| Repouso do guardião | Mausoléu, altar e vista do Guardião; nenhuma mudança na escala do boss. |
| Escada do retorno | Corrente, portais e bordas das plataformas; evitar confusão com ruínas do fundo. |
| Alameda sob as raízes | Árvores repetidas e túmulos; corrigir apoio pelo mesmo metadata, sem redistribuir instâncias. |
| Sepulcro do guardião | Mausoléu e fundo da arena: definir materiais sem competir com o boss. |
| Além do sepulcro | Árvore e arco final; mesmas posições e trigger de encerramento. |

As posições, canvas, pivots, bounds visíveis em unidades de mundo, papel visual/interativo e tile sob a âncora estão registrados por instância em `positions-before.json`. Portas/checkpoints/alavancas continuam dirigidos pelas coordenadas de sala. Landmarks decorativos não geram colisão. Terreno renderiza os mesmos sólidos/plataformas/spikes definidos pelo tilemap.

Foreground: pedra, bordas e hazards; midground: landmarks/props com alpha existente 0,63; background: quatro temas e árvores/janelas com parallax 0,17 horizontal / 0,05 vertical, alpha 0,18. Manter essa distribuição.

Árvore morta: PNG antigo 128×128, bounds [11,7,119,124], pivot [64,124]. Bounds total toca o plano y; nos oito pixels centrais a última linha opaca é y=121, deixando aproximadamente duas unidades visuais de gap. Ajuste autorizado proposto: worldOffset [0,2] exclusivamente no asset, sem mover nenhuma instância nem plataforma. Todas as instâncias auditadas têm tile sólido no ponto de apoio.

Fontes: dez RAWs existentes adequados (landmarks, relics, doors, terrain, interactions, secrets e quatro backgrounds). Não é necessário gerar novas imagens para esta revisão.
