# 🏡 Sítio do Pica### **3 Níveis de Dificuldade**: Fácil (6 cartas), Médio (12 cartas), Difícil (12 cartas únicas)Pau IA

![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=for-the-badge&logo=vite)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)
![TensorFlow.js](https://img.shields.io/badge/IA-TensorFlow.js-ff6f00?style=for-the-badge&logo=tensorflow)
![Tone.js](https://img.shields.io/badge/Audio-Tone.js-ff66aa?style=for-the-badge&logo=javascript)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=pwa)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-171515?style=for-the-badge&logo=github)

**Aplicativo web/PWA que combina jogo da memória gamificado, música gerativa em tempo real, visão computacional para reconhecimento de cartas físicas usando IA, sistema de conquistas e temas customizáveis — tudo no navegador, sem backend!**

> 🚀 **Demo Ao Vivo:** [https://tauanribeiro.github.io/sitio-do-pica-pau-ia/](https://tauanribeiro.github.io/sitio-do-pica-pau-ia/)

---

## ⭐ **Principais Recursos**

### 🎮 **Jogo da Memória Gamificado**
- **3 Níveis de Dificuldade**: Fácil (6 cartas), Médio (9 cartas), Difícil (12 cartas)
- **Sistema de Conquistas**: 8 achievements desbloqueáveis com notificações animadas
- **Pontuação Dinâmica**: Sistema de streak com bônus multiplicadores
- **Estatísticas Persistentes**: Melhor streak, movimentos e progresso salvos
- **Celebrações Visuais**: Animações especiais e overlay de comemoração

### 🤖 **Visão Computacional Avançada**
- **Web Workers**: AI processando em background sem travar a interface
- **TensorFlow.js + MobileNet**: Reconhecimento de cartas físicas via câmera
- **Template Matching**: Captura e compare padrões visuais
- **Similarity Engine**: Cosine similarity com threshold ajustável (0.92)
- **Performance Otimizada**: Throttling inteligente (350ms) e tensor cleanup

### 🎵 **Sistema Áudio Interativo**
- **Música Gerativa**: Melodias procedurais com Tone.js
- **Compatibilidade iOS/Mobile**: HTML5 Audio fallback para dispositivos Apple
- **Inicialização Inteligente**: Múltiplas estratégias para ativação de áudio móvel
- **Feedback Sonoro**: Tons diferentes para match/miss/streak
- **Trilha Temática**: Snippet especial ao completar jogos
- **Efeitos Profissionais**: Reverb, delay e síntese avançada

### 🎨 **Temas e Personalização**
- **5 Temas Visuais**: Sítio Clássico, Floresta, Pôr do Sol, Oceano, Galáxia
- **CSS Variables**: Sistema reativo de cores em tempo real
- **Design Glassmorphism**: Backdrop blur e transparências elegantes
- **Animações Fluidas**: Transições suaves e micro-interações
- **Responsivo Completo**: Adaptação perfeita para mobile e desktop

### 📱 **PWA (Progressive Web App)**
- **Instalação Offline**: Funciona sem internet após primeira visita
- **Service Worker**: Cache inteligente de assets e modelos
- **App Shortcuts**: Acesso rápido via menu do sistema
- **Meta Tags Otimizadas**: Suporte completo para dispositivos móveis
- **Performance**: Lazy loading e code splitting automático

---

## 🧭 **Navegação e Interface**

### **🎯 Aba Principal: Jogo Virtual**
- Interface limpa com seletor de dificuldade persistente
- Grid responsivo que se adapta automaticamente ao número de cartas
- Estatísticas em tempo real: pontuação, streak, movimentos
- Botões de acesso rápido para conquistas, temas e áudio

### **📹 Aba Secundária: Reconhecimento por Câmera**
- Controles de câmera: liga/desliga, trocar dispositivo, espelhamento
- Sistema de templates: capture padrões para reconhecimento
- Histórico de fotos: últimas 5 capturas em miniatura
- Indicador de status da AI: carregando/pronto
- Microfone com visualização espectral

---

## 🎯 **Sistema de Conquistas**

| 🏆 Achievement | Descrição | Condição |
|---|---|---|
| **Primeira Vitória** | Complete seu primeiro jogo | Terminar qualquer dificuldade |
| **Mestre da Velocidade** | Complete com menos de 20 movimentos | Eficiência máxima |
| **Herói do Streak** | Alcance streak de 10 | Sequência perfeita |
| **Perfeccionista** | Complete difícil com streak perfeito | Zero erros no hard |
| **Explorador** | Use jogo, câmera e IA | Experimentar tudo |
| **Fotógrafo** | Tire 10 fotos | Usar câmera ativamente |
| **Treinador de IA** | Capture 5 templates | Ensinar a AI |
| **Maratonista** | Complete 20 jogos | Persistência total |

---

## 🖼️ **Personagens e Assets**

### **Personagens do Sítio (12 cartas)**
```
visconde.png    - Visconde de Sabugosa    dona_benta.png    - Dona Benta
emilia.png      - Emília                  tia_nastacia.png  - Tia Nastácia  
pedrinho.png    - Pedrinho                narizinho.png     - Narizinho
saci.png        - Saci                    cuca.png          - Cuca
rabico.png      - Rabicó                  barnabe.png       - Tio Barnabé
quindim.png     - Quindim                 conselheiro.png   - Conselheiro
```

### **Fallback System**
- Se PNG local não existir → DiceBear avatars automáticos
- Garantia de funcionamento mesmo com assets ausentes
- Loading lazy para performance otimizada

---

## 🧠 **Arquitetura Técnica**

### **Frontend Stack**
- **React 18** - Componentes funcionais com Hooks
- **Vite** - Build tool otimizado e dev server
- **CSS Modules** - Estilos isolados e temas dinâmicos
- **Lazy Loading** - Code splitting automático

### **AI Pipeline**
```javascript
Câmera → Canvas → ImageData → Web Worker → TensorFlow.js → 
MobileNet → Embedding → Cosine Similarity → Match Detection
```

### **Audio Engine**
- **Tone.js** - Web Audio API wrapper profissional  
- **PolySynth** - Síntese polifônica para melodias
- **Effects Chain** - Reverb → Delay → Master Output
- **Real-time Analysis** - FFT para visualização

### **PWA Infrastructure**
- **Manifest.json** - App metadata e shortcuts
- **Service Worker** - Cache strategy e offline support
- **Web Workers** - Background AI processing
- **IndexedDB** - Local storage para assets grandes

---

## 🚀 **Instalação e Execução**

### **Pré-requisitos**
- Node.js 18+ LTS
- npm ou yarn
- Navegador moderno (Chrome 90+, Firefox 88+, Safari 14+)

### **Setup Local**
```bash
# Clone o repositório
git clone https://github.com/TauanRibeiro/sitio-do-pica-pau-ia.git
cd sitio-do-pica-pau-ia

# Instale dependências
npm install

# Execute em modo desenvolvimento
npm run dev
# → Acesse http://localhost:5173

# Build para produção
npm run build

# Preview do build
npm run preview

# Deploy para GitHub Pages
npm run deploy
```

### **Configuração do Deploy**
```javascript
// vite.config.js
export default {
  base: '/sitio-do-pica-pau-ia/', // Nome do seu repositório
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'audio-vendor': ['tone'],
          'ai-vendor': ['@tensorflow/tfjs', '@tensorflow-models/mobilenet']
        }
      }
    }
  }
}
```

---

## 📂 **Estrutura do Projeto**

```
sitio-do-pica-pau-ia/
├── public/
│   ├── characters/          # PNGs dos personagens
│   ├── samples/             # Amostras de áudio (opcional)
│   ├── aiWorker.js          # Web Worker para TensorFlow.js
│   ├── sw.js                # Service Worker PWA
│   ├── manifest.json        # Configuração PWA
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── MemoryGame.jsx   # Jogo principal + gamificação
│   │   ├── memory.css       # Estilos do jogo
│   │   ├── Achievements.jsx # Sistema de conquistas
│   │   ├── achievements.css # Estilos das conquistas
│   │   ├── ThemeSelector.jsx# Seletor de temas
│   │   └── themes.css       # Sistema de temas
│   ├── utils/
│   │   └── achievements.js  # Lógica de stats e notificações
│   ├── App.jsx              # Componente raiz + navegação
│   ├── App.css              # Estilos globais
│   ├── index.css            # Reset CSS
│   └── main.jsx             # Entry point React
├── package.json             # Dependências e scripts
├── vite.config.js           # Configuração Vite
├── index.html               # Template HTML com PWA
└── README.md                # Esta documentação
```

---

## 🔧 **APIs e Integrações**

### **TensorFlow.js Integration**
```javascript
// Dynamic loading via CDN
const tf = await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest')
const mobilenet = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@latest')

// Embedding extraction
const embedding = model.infer(normalizedTensor, 'conv_preds')
const similarity = cosineSimilarity(embedding1, embedding2)
```

### **Web Audio API**
```javascript
// Real-time mic visualization  
const analyser = audioContext.createAnalyser()
analyser.fftSize = 512
const dataArray = new Uint8Array(analyser.frequencyBinCount)
analyser.getByteFrequencyData(dataArray)
```

### **Media Devices**
```javascript
// Camera access with fallbacks
const constraints = {
  video: { 
    facingMode: { ideal: 'environment' }, // Prefer back camera
    deviceId: selectedDevice ? { exact: selectedDevice } : undefined
  }
}
```

---

## 📈 **Performance e Otimizações**

### **Bundle Optimization**
- **Code Splitting**: Componentes lazy-loaded
- **Manual Chunks**: Vendors separados (React, Tone.js, TF.js)
- **Tree Shaking**: Dead code elimination automático
- **Asset Optimization**: Imagens otimizadas e lazy loading

### **Runtime Performance**
- **Web Workers**: AI processing em background thread
- **Throttling**: Inferência limitada a 350ms intervals
- **Tensor Cleanup**: Garbage collection manual de GPU memory
- **Canvas Optimization**: Offscreen rendering para preprocessamento

### **Memory Management**
```javascript
// Exemplo de cleanup
useEffect(() => {
  return () => {
    if (aiWorkerRef.current) {
      aiWorkerRef.current.terminate()
      aiWorkerRef.current = null
    }
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
    }
  }
}, [])
```

---

## 🔒 **Privacidade e Segurança**

### **Data Privacy**
- ✅ **100% Client-Side**: Nenhum dado enviado para servidores
- ✅ **Local Storage**: Apenas localStorage para preferências
- ✅ **No Tracking**: Sem analytics ou cookies de terceiros
- ✅ **Camera Permissions**: Solicitadas apenas quando necessário
- ✅ **Offline Capable**: Funciona sem conexão após cache inicial

### **Security Features**
- **HTTPS Only**: GitHub Pages com SSL automático
- **CSP Ready**: Content Security Policy compatível
- **No Eval**: Código estático sem execução dinâmica
- **Safe APIs**: Apenas Web APIs padrão do navegador

---

## 🧪 **Testes e Validação**

### **Checklist de Funcionalidades**
- [ ] Jogo completo nas 3 dificuldades
- [ ] Sistema de conquistas notificando corretamente
- [ ] Temas aplicando em tempo real
- [ ] Câmera ligando/desligando sem erros
- [ ] IA reconhecendo templates capturados
- [ ] PWA instalando via browser prompt
- [ ] Audio tocando em dispositivos móveis
- [ ] Responsividade em diferentes screen sizes

### **Browser Compatibility**
| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ⚠️ Limited WebRTC |
| Edge | 90+ | ✅ Full |
| Mobile Chrome | 90+ | ✅ Full |
| Mobile Safari | 14+ | ⚠️ Audio context issues |

---

## 🗺️ **Roadmap Futuro**

### **Version 2.0 - Community Features**
- [ ] 🌐 **Multiplayer Local**: WebRTC peer-to-peer games
- [ ] 🎖️ **Advanced Achievements**: Categories, progress bars
- [ ] 📊 **Analytics Dashboard**: Detailed game statistics
- [ ] 🎵 **Custom Audio**: Upload your own sound packs
- [ ] 🖼️ **Card Creator**: Design custom character sets

### **Version 2.1 - AI Enhancements**
- [ ] 🧠 **Custom Models**: Train on your own card sets
- [ ] 📱 **AR Integration**: WebXR for augmented reality
- [ ] 🎯 **Smart Difficulty**: AI-adjusted challenge levels
- [ ] 🔍 **Object Detection**: YOLO.js for real-time recognition

### **Version 2.2 - Accessibility++**
- [ ] 🎙️ **Voice Commands**: Speech recognition controls
- [ ] 👁️ **Screen Reader**: Full ARIA compliance
- [ ] 🖱️ **Alternative Input**: Keyboard-only gameplay
- [ ] 🌍 **i18n Support**: Multi-language interface

---

## 📚 **Recursos Educacionais**

### **Para Professores**
- **Interdisciplinar**: Combina programação, matemática, artes
- **STEAM Integration**: Science, Technology, Engineering, Arts, Math
- **Código Aberto**: Students podem estudar implementação
- **Performance Metrics**: Tracking de progresso estudantil

### **Para Estudantes**
- **Computer Vision**: Concepts de ML aplicados
- **Web Audio**: Digital signal processing basics  
- **React Patterns**: Modern frontend architecture
- **PWA Development**: Mobile-first progressive enhancement

### **Feira de Ciências**
Este projeto demonstra:
1. **AI Acessível**: TensorFlow.js rodando no browser
2. **Performance Web**: Web Workers e otimizações avançadas
3. **UX Design**: Gamificação e sistemas de feedback
4. **Cultural Preservation**: Personagens do folclore brasileiro

---

## 🤝 **Contribuição e Licença**

### **Como Contribuir**
1. Fork o repositório
2. Crie branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push para branch (`git push origin feature/AmazingFeature`)
5. Abra Pull Request

### **Guidelines**
- Mantenha código limpo e comentado
- Adicione testes para novas features
- Respeite a estrutura de pastas existente
- Documente mudanças no README

### **Licença**
MIT License - veja [LICENSE](LICENSE) para detalhes.

**Uso Educacional Livre** ✅  
**Modificação Permitida** ✅  
**Distribuição Comercial** ⚠️ *Verifique direitos dos personagens*

---

## 📞 **Créditos e Contato**

### **Desenvolvedores**
- 👩‍💻 **Malie** - Frontend & Design
- 👨‍💻 **Tauan** - Backend & AI Integration  
- 👩‍🏫 **Carla** - UX Research & Testing
- 👵 **Vovó Jane** - Creative Direction & Stories

### **Tecnologias**
- [React](https://reactjs.org/) - UI Library
- [Vite](https://vitejs.dev/) - Build Tool  
- [TensorFlow.js](https://tensorflow.org/js) - Machine Learning
- [Tone.js](https://tonejs.github.io/) - Web Audio
- [DiceBear](https://dicebear.com/) - Avatar Generation

### **Instituição**
**🏫 Projeto Feira de Ciências**  
Meta - Sobradinho DF  
*Unindo tecnologia, educação e cultura brasileira*

---

**⭐ Se este projeto te ajudou, deixe uma estrela no GitHub!**  
**🔗 Compartilhe com educadores e desenvolvedores!**

> *"A tecnologia é melhor quando aproxima as pessoas"* - Monteiro Lobato (adaptado) 🏡✨

