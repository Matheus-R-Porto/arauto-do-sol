# Alinhamento de M1/M2 — v0.5.2

As escalas atuais estão aprovadas. Nenhum sprite, perfil, manifesto, zoom, collider, hurtbox, alcance, dano ou tempo de combate foi alterado. `preserved.json` registra hashes dos arquivos de arte, perfis, manifestos, tuning, player e configuração de renderização para impedir regressões dessa aprovação.

O erro principal vinha do renderer genérico: ele centralizava o feixe no meio da hitbox de 18×22, enquanto a espada do M1 está aproximadamente 18 pixels acima dos pés. No M2, além da origem inadequada, a curvatura do efeito apontava para baixo da lâmina. Ao alternar rapidamente os golpes, os dois timers de flash podiam permanecer positivos e desenhar dois efeitos sobre uma única pose.

Correção restrita à apresentação:

- Pontos da ponta da espada medidos nos frames aprovados de 128×128. O renderer usa o pivot e a escala já existentes do quadro, incluindo o flip horizontal e o arredondamento de posição usado pelo corpo.
- M1 fica no eixo da lâmina e acompanha a retração.
- M2 termina na ponta da lâmina, com transposição dos eixos de pixels do VFX para a curva acompanhar o corte por cima. É uma transformação ortogonal, sem mudar escala nem reprocessar arquivos.
- Somente o efeito da pose atual é desenhado. Hurt, morte, idle e recuperação com espada levantada não recebem resíduos do golpe anterior. O flash de gameplay continua com 0,12 s; apenas a apresentação deixa de mostrar um efeito incompatível com a pose.
- O recorte permanece limitado à hitbox existente; os efeitos não estendem alcance e não causam dano.

Verificação: seis testes específicos cobrem altura do M1, retração, os dois sentidos, salto, alternância, interrupção por hurt, recorte e preservação dos arquivos aprovados. Suíte de gameplay/apresentação aprovada. Inspeção no navegador em `tests/attack-alignment.html`, usando entradas reais e avanço por quadro, no enquadramento normal e em ampliação 8× sem smoothing. O painel é somente de desenvolvimento e não faz parte do ZIP.

Travessia integrada com hitboxes visíveis: 17/17 salas, cinco mortes deliberadas, Guardião derrotado, final alcançado em 355,7 segundos simulados; nenhum erro/aviso no console. Após a travessia, a orientação final do arco foi conferida novamente no painel de golpes. Não foram recalibradas animações ou escalas de inimigos.

Para repetir a inspeção: abrir `/tests/attack-alignment.html`; escolher golpe, direção e estado no ar; arrastar o quadro de 0 a 17; usar “Alternar M1/M2” para o caso dos flashes simultâneos. Verde é o collider; amarelo é a hitbox de ataque. O teste não afirma que toda a área retangular de dano deve ficar preenchida por luz: o feixe acompanha a lâmina dentro dela.
