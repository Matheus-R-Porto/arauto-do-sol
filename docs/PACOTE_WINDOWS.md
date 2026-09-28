# Pacote portátil para Windows

Entrega: `Arauto-do-Sol-v0.3.0-Windows.zip`, na pasta acima do projeto.

O jogador extrai o ZIP inteiro e abre **Jogar Arauto do Sol.exe**. O iniciador abre o navegador padrão e oferece uma pequena janela para reabrir a aba ou encerrar o servidor. Deve permanecer aberto durante a partida. Não usa Node.js, não instala nada e funciona offline. O alvo é Windows 10/11 com navegador; macOS/Linux não usam esse executável.

A pasta contém `Jogar Arauto do Sol.exe`, `LEIA-ME.txt`, `index.html`, `style.css`, `src/`, `config/` e `assets/sprites/protagonist/`: 58 arquivos, 153.687 bytes descompactados. Inclui os 27 PNGs e o manifesto da primeira iteração de arte. RAW, intermediários, previews e ferramentas Python não são distribuídos.

## Implementação

Fonte do iniciador: `tools/WindowsLauncher.cs`. Compilação: `tools/build-windows.ps1`, usando o compilador .NET Framework presente no Windows. A versão distribuída é AnyCPU, sem assinatura digital. Não há dependência de compilador na máquina do jogador.

O servidor escuta exclusivamente em 127.0.0.1 e escolhe uma porta livre, sem conflitar com o servidor de desenvolvimento. Só serve os arquivos do jogo; não aceita escrita, não expõe arquivos fora das pastas permitidas e não solicita privilégio de administrador. Não há download, conta, telemetria ou save em disco.

## Validação do ZIP

O arquivo foi extraído numa pasta com espaços e acento, e o executável dessa cópia serviu todos os 56 arquivos de runtime com conteúdo idêntico ao disco. Foram verificados MIME de módulos, HEAD, arquivo inexistente, tentativa de sair da pasta, métodos de escrita e duas instâncias simultâneas. Resultado em `art/windows-package-test.txt`; MIME PNG/JSON e bloqueio de RAW também foram verificados.

A cópia extraída também foi aberta no navegador através do servidor do executável. A tela inicial e o início com Espaço funcionaram com os sprites novos, sem erros no console. O código de gameplay permanece igual ao da v0.2.0; a suíte atual tem 104 verificações da demo/apresentação e 32 da ferramenta/arte.

O ZIP foi compilado, extraído e teve seus 27 PNGs e arquivos de runtime comparados byte a byte com o projeto. O servidor temporário de validação foi encerrado; o servidor habitual de desenvolvimento continua disponível em http://localhost:5174/.

Para reconstruir, execute `tools/build-windows.ps1` a partir do projeto. Builds e cópias de validação ficam em `release/`, ignorada pelo Git.

SHA-256 do ZIP final: `6CFCCE317FE4891145B9E15C679D35EAD2B9A4F76935AFF3C6EC053A3FF5436D`.
