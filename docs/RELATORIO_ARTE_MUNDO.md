# Arauto do Sol — arte do mundo, v0.4.0

Primeira passagem de arte integrada em todas as categorias existentes da demo. Os 27 quadros do protagonista foram preservados. Foram acrescentados 72 sprites de mundo e 48 painéis que compõem quatro fundos; o jogo usa 147 PNGs finais.

## Conteúdo

| Categoria | Entrega |
|---|---|
| Fundos | Exterior com lua e árvores mortas, cripta, ossuário e sepulcro; camada intermediária com parallax |
| Terreno | Duas texturas de pedra, bordas, plataformas atravessáveis e espinhos |
| Acessos | Arco aberto, porta solar, portão de corrente, grade de atalho, escada e saída luminosa |
| Objetos | Chave, alavanca, fonte, repouso, fragmento e pedra rachada |
| Cenário | Estátua, mausoléu, vitral, ossos, sino, árvore, urnas e lápides |
| Inimigos | Coveiro, cão de ossos e acólito: oito poses cada, com dois quadros de caminhada |
| Guardião | Doze poses: repouso, caminhada, dano, preparação/ação dos três ataques, recuperação e morte |
| Efeitos | M1/M2, impacto/coleta, projétil com dois quadros, poeira e onda da queda; chama de repouso |
| Interface | Medalhão, caveiras, energia, fragmentos, chave, barra do chefe e ornamentação de início/fim |

As animações de inimigos são compactas: preparação, ataque, recuperação e dano usam uma pose por estado, sincronizada aos tempos reais da IA. Não se trata ainda de um conjunto de animações com muitos quadros intermediários. A fase 2 do chefe recebe uma chama discreta. O contorno extra do protagonista foi removido na revalidação do complemento, preservando a paleta dos PNGs; ver `docs/art/COMPLEMENTO_PIPELINE.md`.

## Integração e leitura

Arte observadora em `src/ui/world-art.js`. Carregamento somente de PNGs finais, com erro visível se algum arquivo faltar. Camadas de cenário, terreno, objetos e atores seguem a câmera existente. Topos de colisão conservam sua posição; pisos sólidos e plataformas atravessáveis têm espessuras distintas. Ouro identifica chave/porta, ciano a corrente/alavanca, cobre os atalhos e verde-claro o repouso. Os avisos do chefe continuam em texto, e a indicação da queda permanece durante preparação e salto. Efeitos de golpes são recortados dentro do volume correspondente.

Os preenchimentos de barras, texto, partículas ambientais e avisos geométricos continuam desenhados por código para refletir valores reais e manter legibilidade. As telas de mapa/debug também permanecem funcionais. Não foram introduzidos objetos interativos sem função.

## Produção reproduzível

- Gerador de imagens integrado do Codex, conforme skill imagegen; sem API externa configurada.
- Dezessete originais imutáveis e prompts em `assets/raw/world/`.
- Receita em `tools/sprite_pipeline/world-build.json`; exportador `build_world.py`.
- Perfis e paletas separados: fundo 64 cores, pedra/props 32, inimigos 24, chefe 32, HUD 16, efeitos 24.
- Componentes de alpha isolam os personagens das folhas para evitar armas cortadas ou fragmentos de quadros vizinhos. Os recortes e origens constam do manifesto de produção.
- Redução inicial Lanczos, alpha binário e quantização em paletas fixas. Exibição sem suavização.
- PNGs até 128×128. Cada fundo 480×270 é recomposto a partir de doze painéis 120×90, com margem no arquivo 122×92.
- `assets/work/world/` contém intermediários regeneráveis. `assets/sprites/world/` contém os finais.
- Inventário, hashes, recortes e dimensões em `docs/art-world/production.json`; folha de contato em `docs/art-world/contact.png`.

Para reconstruir, execute `python tools/sprite_pipeline/build_world.py` usando Python com Pillow. Para validar: `python tools/sprite_pipeline/validate_world.py`. A receita já está pronta; `expand_world_recipe.py` é apenas ferramenta de autoria do inventário, não requisito do build.

## Verificação

- Suíte de gameplay e apresentação aprovada; quatro verificações adicionais em `tests/world-art.test.mjs`.
- Comparação SHA-256 dos arquivos de regras, física, mapas e áudio com a base registrada antes desta iteração: nenhum alterado.
- Dois mundos, com as mesmas entradas, produziram resultado idêntico com e sem o observador de arte. O teste desenha durante a travessia.
- Percurso também executado no navegador: 355,7 s simulados, 17/17 salas, quatro fragmentos, cinco mortes deliberadas, atalhos e chefe concluídos; nenhum erro registrado no console.
- Revisão visual da cripta, exterior, ossuário, acessos, HUD e poses do chefe. Página de inspeção: `tests/world-art-review.html`; não faz parte da distribuição.
- Validação de paletas, alpha, margens, hashes e reconstrução sem emendas dos 48 painéis.
- Iniciador Windows testado servindo o conteúdo integralmente sem Node.js, com MIME adequado e acesso limitado aos arquivos do jogo.

## Pacote

`../Arauto-do-Sol-v0.4.0-Windows.zip`. Extrair a pasta completa e abrir **Jogar Arauto do Sol.exe**. Funciona offline no navegador e não precisa instalar Node.js. O pacote inclui somente jogo, arte final, iniciador e instruções. RAW, folhas piloto, Python, relatórios e páginas de teste ficam fora. O ZIP v0.3.0 foi preservado.

## Próximo refinamento artístico

Todas as categorias da demo receberam esta primeira passagem. Permanecem oportunidades de polimento: mais quadros entre poses dos inimigos, decoração menos repetida nas salas longas e variações de terreno específicas por área. A composição dos fundos foi feita para a resolução interna 480×270; detalhes menores se simplificam nessa escala.
