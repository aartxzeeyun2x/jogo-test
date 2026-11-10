# Kings League 2D — Desafio pelo título

Projeto acadêmico de jogo de plataforma 2D desenvolvido com HTML, CSS e JavaScript puro, mantendo a apresentação visual da primeira versão e ampliando as mecânicas inspiradas nas regras da Kings League.

## Como executar no VS Code
1. Extraia o arquivo ZIP.
2. Abra a pasta `kings-league-2d-final` no Visual Studio Code.
3. Abra `index.html` no navegador. Para facilitar, instale a extensão Live Server e clique em **Go Live**.

## Controles
- `A` / `D` ou `←` / `→`: correr.
- `Espaço`, `W` ou `↑`: pular.
- `C`: ativar a carta secreta no segundo tempo.
- `P`: pausar/continuar.
- Durante shootout ou pênalti reverso, pressione `Espaço` quando o marcador estiver na faixa verde.
- No celular, use os botões abaixo do campo.

## Requisitos de plataforma do enunciado
- Background com nuvens e efeito paralaxe.
- Solo/campo.
- Personagem controlável.
- Adversários/obstáculos com colisão.
- Itens coletáveis.
- Contador de itens.
- Temporizador.
- Game Over ao sofrer gol.
- Game Over ao perder a partida ou não concluir o Matchball.
- Botão de reinício.
- Progressão entre etapas e tela de campeão.

## Regras Kings League adaptadas
- Dois tempos: 20 minutos no primeiro e 16 no segundo.
- Modo demonstração: 1 segundo real equivale a 1 minuto de jogo.
- Entrada progressiva de jogadores no primeiro tempo, exibida no HUD.
- Gols em dobro nos últimos 4 minutos do primeiro tempo.
- Dado gigante no início do segundo tempo, definindo 1x1, 2x2 ou 3x3 como formação reduzida (representada no HUD e nos adversários).
- Cartas secretas: Gol 2x, Suspensão, Pênalti, Pênalti Reverso, Shootout, Jogador Estrela e Coringa.
- Se o placar terminar empatado, o jogo inicia uma disputa de cinco shootouts.
- Se houver liderança ao final do tempo, começa o Matchball, com tempo reduzido, menos adversários e objetivo de vitória/gol de ouro.
- A colisão com adversário representa gol sofrido e encerra a partida com Game Over, conforme solicitado.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub.
2. Envie `index.html`, `style.css`, `game.js` e `README.md` para a raiz.
3. Abra **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha `main` e `/ (root)`, depois salve.
6. Aguarde o GitHub Pages gerar o endereço público.

## Arquivos
- `index.html`: estrutura da página.
- `style.css`: aparência e responsividade.
- `game.js`: lógica, controles, colisões, fases e regras.
- `README.md`: documentação e instruções.
