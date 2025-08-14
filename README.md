# Sítio do Pica-Pau IA

![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF)
![React](https://img.shields.io/badge/Frontend-React-61DAFB)
![TensorFlow.js](https://img.shields.io/badge/IA-TensorFlow.js-ff6f00)
![Tone.js](https://img.shields.io/badge/Audio-Tone.js-ff66aa)
![GitHub Pages](https://img.shields.io/badge/Hosting-GitHub%20Pages-171515)

Aplicativo web/mobile que combina jogo da memória com trilha sonora gerativa e visão computacional para reconhecer cartas físicas usando IA — tudo no navegador, sem backend.

> Demo (GitHub Pages): substitua pelo link do seu repositório GitHub Pages
> https://SEU_USUARIO.github.io/sitio-do-pica-pau-ia/

## ✨ Principais recursos
- Jogo da memória (versão virtual) com 3 dificuldades: Fácil (6), Médio (9) e Difícil (12)
- Reconhecimento de cartas físicas via câmera (MobileNet + TensorFlow.js) e matching por embedding
- Música gerativa com Tone.js (efeitos leves, snippet temático ao finalizar)
- Visualizador de áudio do microfone e controles de câmera (troca de dispositivo e espelhamento)
- UI moderna (glassmorphism, animações suaves), responsiva e de alto contraste
- Deploy estático gratuito via GitHub Pages

## 🧭 Navegação (abas)
- Jogo Virtual: padrão ao abrir; roda 100% local, com imagens em `public/characters/*.png`
- Reconhecimento (Câmera): visão computacional para cartas físicas (toggle IA, câmera/mic dedicados)

## 🖼️ Personagens (base local)
As imagens dos personagens reais do Sítio são carregadas de `public/characters`:
```
visconde.png, emilia.png, dona_benta.png, tia_nastacia.png,
pedrinho.png, narizinho.png, saci.png, cuca.png,
rabico.png, barnabe.png, quindim.png, conselheiro.png
```
Se um arquivo estiver ausente, o app usa um avatar de fallback (DiceBear) para não quebrar a UI.

## 🧠 Visão computacional (TFJS)
- Carregamento dinâmico de `@tensorflow/tfjs` e `@tensorflow-models/mobilenet`
- Extração de embeddings com `infer(..., 'conv_preds')` e similaridade cosseno
- Throttle de inferência (~350ms) e pré-processamento em offscreen canvas
- Template matching por cor como heurística auxiliar

## 🔊 Áudio
- Geração de melodias com Tone.js (PolySynth/Synth) e efeitos leves
- Visualizador do microfone com AnalyserNode
- Snippet temático ao concluir o jogo (sampler opcional via `public/samples`)

## 🏗️ Arquitetura
- Frontend: Vite + React
- Áudio: Tone.js
- IA: TensorFlow.js + MobileNet (client-side)
- Hospedagem: GitHub Pages (estático)

Fluxo simplificado:
1) Jogo Virtual renderiza grid de cartas com imagens locais
2) Ao trocar a dificuldade (6/9/12), reembaralha pares e reinicia o placar
3) Na aba de Reconhecimento, câmera/mic ligam sob demanda; IA roda embeddings e matching

## 📂 Estrutura do projeto
```
src/
  App.jsx       # Navegação, câmera, IA e controles
  App.css       # Estilos gerais e layout
  index.css     # Reset/tema base
  components/
    MemoryGame.jsx  # Jogo da memória (dificuldades, grid, pontuação)
    memory.css      # Estilos do jogo
public/
  characters/   # PNGs locais dos personagens
  samples/      # (opcional) amostras de instrumentos
```

## 🚀 Como rodar localmente
Requisitos: Node.js LTS.

```bash
npm install
npm run dev
```
Abra o endereço exibido (geralmente http://localhost:5173).

## 🌐 Deploy (GitHub Pages)
O projeto já está preparado para GH Pages.

```bash
npm run build
npm run deploy
```
Certifique-se de configurar `base` no `vite.config.js` conforme o nome do repositório.

## ✅ Acessibilidade e UX
- Alto contraste, pesos de fonte elevados e sombras sutis para legibilidade
- Botões com foco/hover visíveis; seletor de dificuldade com estado persistido (localStorage)
- Layout responsivo (grid auto-fit) e animações moderadas

## 📈 Performance
- Lazy loading (MemoryGame e modelos TFJS) para reduzir bundle inicial
- Throttle de IA, uso de offscreen canvas e redimensionamento pontual (224x224)
- Sugestões adicionais:
  - Mover IA para Web Worker para paralelizar render/IA
  - Quantizar/usar modelo menor (ex.: MobileNet v2 lighter) e cachear com Service Worker (PWA)
  - `manualChunks` no Vite para melhorar chunking

## 🔒 Privacidade
- Todo processamento acontece no navegador; nenhuma imagem/áudio é enviado a servidores
- Sem login, sem coleta de dados; ideal para ambientes educacionais

## 🧪 Testes rápidos
- Verifique o jogo virtual em 3 dificuldades e o snippet final
- Na aba de Reconhecimento, capture um template e mova o objeto para ver o matching de cartas detectadas

## 🗺️ Roadmap sugerido
- PWA (offline + instalação) e Service Worker (cache de modelos e assets)
- Worker para IA (desbloqueio do main thread) e UI de calibração de limiar de similaridade
- Placar/ranqueamento local e modo campanha (desafios progressivos)
- Inclusão midiática: trilhas temáticas com ritmos regionais e narrações acessíveis

## 📢 Relevância educacional e social
Este projeto une cultura brasileira (Sítio do Pica-Pau Amarelo) à inovação em IA acessível no navegador. Em feiras de ciências, demonstra:
- Integração prática de visão computacional e música gerativa
- Inclusão e engajamento por meio de gamificação e multimodalidade
- Código aberto e hospedagem gratuita, facilitando replicação em escolas

## 📜 Créditos e licenças
- TensorFlow.js, MobileNet, Tone.js, React, Vite
- Avatares de fallback: DiceBear (uso livre); use imagens próprias/livres para os personagens
- Uso educacional. Verifique direitos autorais ao adicionar novas mídias

---
Feito por Malie, Tauan, Carla e vovó Jane — Projeto para a feira de ciências (Meta - Sobradinho DF)
