# Sítio do Pica-Pau Amarelo — Jogo da Memória com IA Musical e Visão Computacional

Projeto de jogo da memória com dois modos de jogo (virtual e cartas físicas) e trilha sonora procedural gerada em tempo real. O objetivo é unir mecânicas clássicas de memória com recursos de IA e visão computacional para uma experiência interativa e educativa.

Status: Em desenvolvimento

## Visão geral
- Modo virtual: jogue no navegador com cartas na tela.
- Modo cartas físicas: use a webcam para reconhecer cartas reais posicionadas na mesa.
- Música procedural: a trilha sonora é gerada durante a partida e reage a eventos do jogo (acertos/erros, ritmo e progresso).

## Principais funcionalidades
- Mecânica de memória completa (embaralhamento, verificação de pares, pontuação/tempo).
- Trilha sonora procedural:
  - Geração dinâmica e responsiva aos eventos do gameplay.
  - Controle de volume e opção de ativar/desativar a trilha.
- Visão computacional (modo físico):
  - Uso da webcam para detectar/identificar cartas físicas.
  - Calibração e feedback visual para estabilidade de detecção.
- Interface web responsiva (modo virtual) com feedback visual de interações.
- Execução 100% no navegador (sem backend obrigatório para jogar localmente).

## Requisitos
- Navegador moderno com:
  - MediaDevices.getUserMedia (acesso à câmera) para o modo físico.
  - Web Audio API para a música procedural.
- Permissão de acesso à câmera quando solicitada (modo cartas físicas).
- Áudio habilitado (alto-falantes/fones) para ouvir a trilha sonora.

## Como executar localmente
- Opção 1 — Abrir diretamente (apenas para testes rápidos; a câmera pode não funcionar sem servidor):
  - Abra site/index.html no navegador.
- Opção 2 — Servidor local (recomendado, especialmente para usar a câmera):
  - Python:
    - python3 -m http.server 8000 --directory site
    - Acesse http://localhost:8000
  - Node (serve):
    - npx serve site
    - Acesse a URL exibida (ex.: http://localhost:3000)

## Dicas para o modo de cartas físicas
- Use HTTPS (ou localhost) para o navegador permitir a webcam.
- Ambiente com boa iluminação e fundo sem muitos padrões/reflexos.
- Mantenha as cartas bem enquadradas e estáveis.
- Siga instruções de calibração se o jogo as apresentar.

## Como jogar
- Virtual:
  - Clique em duas cartas para revelar.
  - Encontre pares iguais para pontuar e avançar.
  - Ajuste trilha sonora/volume nas configurações do jogo.
- Cartas físicas:
  - Posicione as cartas no campo de visão da webcam.
  - Siga instruções de calibração/posicionamento.
  - Revele e emparelhe as cartas físicas conforme a interface orienta.

## Música procedural
- A trilha é sintetizada no navegador e varia conforme:
  - Acertos/erros e sequência de acertos (combos).
  - Ritmo de jogo e progresso.
  - Possível dificuldade configurada.
- Controles:
  - Ativar/desativar trilha.
  - Ajustar volume.

## Arquitetura (alto nível)
- Interface Web: site/index.html como ponto de entrada.
- Mecânica do jogo: estado, embaralhamento, validação de pares, pontuação/tempo.
- Áudio: camada de geração procedural (eventos do jogo disparam mudanças musicais).
- Visão computacional: captura da webcam e detecção/identificação de cartas no modo físico.
- Módulos compartilham a mesma lógica central do jogo; o que muda é a origem da entrada (cliques vs. detecção por câmera).

## Estrutura do repositório
- site/ — arquivos do jogo executados no navegador (HTML/CSS/JS).
- README.md — documentação do projeto.

## Deploy (GitHub Pages)
- Configure o GitHub Pages para servir a pasta /site a partir do branch main.
- Após habilitar, acesse a URL gerada pelo Pages (HTTPS) para jogar online, com suporte à câmera.

## Configuração e personalização
- Parâmetros comuns:
  - Tamanho do tabuleiro (número de pares).
  - Dificuldade/tempo-limite (se aplicável).
  - Ativar/desativar trilha sonora e ajustar volume.
  - Sensibilidade/calibração da detecção (modo físico).
- Consulte o código em site/ para ver as opções disponíveis e onde ajustá-las.

## Resolução de problemas
- A câmera não funciona:
  - Verifique permissões do navegador e contexto seguro (HTTPS/localhost).
  - Teste em outro navegador (Chrome/Firefox/Edge).
- Detecção instável:
  - Melhore a iluminação, reduza reflexos e aumente o contraste do fundo.
  - Refaça a calibração se houver essa opção.
- Áudio não toca:
  - Interaja com a página (clique) para liberar o áudio no navegador.
  - Verifique o volume do sistema e do jogo.

## Roadmap
- Refinar UI/UX do modo virtual.
- Melhorar robustez da detecção no modo físico.
- Expandir paleta/estilos de trilha procedural.
- Adicionar modos de dificuldade e ranking.
- Testes automatizados e métricas de desempenho.

## Contribuição
- Abra issues com bugs, sugestões e melhorias.
- Envie pull requests com descrição clara do impacto.
- Inclua capturas de tela/GIFs ao alterar UI/UX quando possível.

## Privacidade
- O vídeo da webcam é processado localmente no navegador para detecção das cartas.
- Por padrão, nenhum dado de vídeo/áudio é enviado a servidores.

## Licença
- Ainda não definida. Recomenda-se adotar uma licença (ex.: MIT) e incluí-la no repositório.

## Créditos
- Autor e manutenção: @TauanRibeiro.
- Inspirado no universo do Sítio do Pica-Pau Amarelo.
