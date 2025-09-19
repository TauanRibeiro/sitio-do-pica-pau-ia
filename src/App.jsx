import React, { useState, useRef, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'
import './utils/achievements'
import { getInitialTheme, applyTheme, toggleTheme } from './utils/theme'
import { useDialog } from './ui/DialogContext'
import { getAudioEngine } from './utils/audioEngine'

const MemoryGame = lazy(() => import('./components/MemoryGame'))

// Theme Toggle component
function ThemeToggle({ theme, setTheme }) {
  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const isDay = theme === 'light'
  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      className={`circle-btn btn-theme ${isDay ? 'day' : 'night'}`}
      aria-label={`Mudar para tema ${nextTheme}`}
      aria-pressed={!isDay}
      title={isDay ? 'Tema claro (sol)' : 'Tema escuro (lua)'}
    >
      <span className="text-xl" aria-hidden>{isDay ? '☀️' : '🌙'}</span>
    </button>
  )
}

// Circular Music Toggle component
function MusicToggle({ isOn, onToggle, disabled = false, labelOn = 'Pausar música', labelOff = 'Tocar música' }) {
  return (
    <div className="relative flex items-center">
      <button
        type="button"
        aria-pressed={isOn}
        aria-label={isOn ? labelOn : labelOff}
        disabled={disabled}
        onClick={onToggle}
  className={`circle-btn btn-music ${isOn ? 'on' : 'off'} ${disabled ? 'is-disabled' : ''}`}
      >
        <span className="text-lg">{isOn ? '🔊' : '🎵'}</span>
        {isOn && (
          <span className="absolute inset-0 rounded-full animate-ping bg-[var(--secondary)]/25" aria-hidden />
        )}
      </button>
    </div>
  );
}

function App() {
  const { alert } = useDialog()
  
  // Core state
  const [view, setView] = useState('home')
  const [theme, setTheme] = useState(getInitialTheme())
  
  // Modals state
  const [showDifficultyModal, setShowDifficultyModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showAudioModal, setShowAudioModal] = useState(false)

  // Game and settings state
  const [pendingDifficulty, setPendingDifficulty] = useState(() => localStorage.getItem('memoryDifficulty') || 'easy')
  const [musicPlaying, setMusicPlaying] = useState(true)
  const [musicVolume, setMusicVolume] = useState(1)
  const [speechVolume, setSpeechVolume] = useState(1)
  const [sfxVolume, setSfxVolume] = useState(0.8)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  
  // AI and Camera state
  const [cameraActive, setCameraActive] = useState(false)
  const [videoStream, setVideoStream] = useState(null)
  const [videoDevices, setVideoDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [flipCamera, setFlipCamera] = useState(false)
  const [detectedCards, setDetectedCards] = useState([])
  const [snapshots, setSnapshots] = useState([])

  // Lightweight popover for feature info on home
  const [featureInfo, setFeatureInfo] = useState(null) // {icon, title, text}

  // Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const templatesRef = useRef([])
  
  // Scroll progress (for visual effect)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Camera functions
  const captureTemplate = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas && video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (flipCamera) { ctx.scale(-1, 1); ctx.translate(-canvas.width, 0) }
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const template = { imageData, id: templatesRef.current.length }
      templatesRef.current.push(template)
      alert({ title: 'Template capturado', message: `Template ${template.id + 1} salvo com sucesso!`, icon: '📷' })
    }
  }

  const takeSnapshot = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (flipCamera) { ctx.scale(-1, 1); ctx.translate(-canvas.width, 0) }
    ctx.drawImage(video, 0, 0)
    const snapshot = { image: canvas.toDataURL(), timestamp: Date.now() }
    setSnapshots(prev => [snapshot, ...prev].slice(0, 5))
  }

  // Camera lifecycle
  useEffect(() => {
    async function startCamera() {
      try {
        if (videoStream) videoStream.getTracks().forEach(t => t.stop())
        const constraints = selectedDeviceId
          ? { video: { deviceId: { exact: selectedDeviceId } } }
          : { video: { facingMode: { ideal: 'environment' } } }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        setVideoStream(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.style.transform = flipCamera ? 'scaleX(-1)' : 'none'
        }
        const devices = await navigator.mediaDevices.enumerateDevices()
        const vids = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(vids);
        if (!selectedDeviceId && vids.length > 0) {
            // Try to find a back camera first
            const backCamera = vids.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'));
            setSelectedDeviceId(backCamera ? backCamera.deviceId : vids[0].deviceId);
        }
      } catch (err) {
        alert({ title: 'Permissão da câmera', message: 'Erro ao acessar a câmera: ' + err?.message, icon: '📷' })
      }
    }
    if (cameraActive) startCamera()
    else {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
        setVideoStream(null)
      }
    }
  }, [cameraActive, selectedDeviceId, flipCamera])

  // Apply theme
  useEffect(() => applyTheme(theme), [theme])

  // Initialize music engine
  useEffect(() => {
    if (!window.sitioMusicEngine) {
      window.sitioMusicEngine = getAudioEngine();
      console.log('🎵 Initialized sitioMusicEngine');
    }
  }, [])

  // Sync app audio settings with engine
  useEffect(() => {
    const eng = window.sitioMusicEngine
    if (!eng) return
    try {
      eng.musicEnabled = !!musicPlaying
      if (eng.masterVolume && eng.masterVolume.volume) {
        // Map linear [0..1] to decibels [-30..0]
        const db = Math.max(-60, Math.min(0, (musicVolume * 30) - 30))
        eng.masterVolume.volume.value = db
      }
    } catch (e) {
      console.warn('Failed to sync audio engine volume/state', e)
    }
  }, [musicPlaying, musicVolume])

  // Handle scroll for progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(window.scrollY / totalHeight);
      } else {
        setScrollProgress(0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-solid)] font-sans antialiased relative overflow-hidden">
      {/* Ambient noise overlay below all content */}
      <div aria-hidden className="ambient-noise" />
      
      {/* Scroll progress bar */}
      <div 
        aria-hidden 
        className="fixed top-0 left-0 h-1.5 z-[60]" 
        style={{ 
          width: `${Math.round(scrollProgress*100)}%`, 
          background: 'linear-gradient(90deg, var(--sitio-yellow), var(--sitio-orange))', 
          boxShadow: '0 4px 10px rgba(0,0,0,.25)' 
        }} 
      />

      {/* Header */}
      {view !== 'game' && (
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 20, delay: 0.2 }}
          className="site-header glass"
        >
          <div className="brand">
            <motion.div 
              whileHover={{ rotate: -5, scale: 1.1 }}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[var(--sitio-yellow)] to-[var(--sitio-orange)] grid place-items-center text-2xl shadow-lg cursor-pointer"
              onClick={() => setView('home')}
              title="Ir para página inicial"
            >
              🏡
            </motion.div>
            <h1 className="text-lg sm:text-xl font-black text-with-bg show-desktop">Sítio IA</h1>
          </div>
          <div className="header-actions">
            <button
              onClick={() => { setView('vision'); setCameraActive(true) }}
              className="circle-btn btn-camera"
              aria-label="Abrir câmera"
            >
              <span className="text-lg">📷</span>
            </button>
            <MusicToggle isOn={musicPlaying} onToggle={() => setMusicPlaying(v => !v)} />
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button 
              onClick={() => setShowAudioModal(true)}
              className="circle-btn btn-settings"
              aria-label="Configurações"
            >
              <span className="text-lg">⚙️</span>
            </button>
            <button 
              onClick={() => setShowAboutModal(true)}
              className="tab-btn about-btn"
              aria-label="Sobre o projeto"
            >
              <span className="show-desktop">Quem Somos</span>
              <span className="show-mobile text-lg">ℹ️</span>
            </button>
          </div>
        </motion.header>
      )}
      {/* Spacer to offset fixed header height */}
      {view !== 'game' && <div className="header-spacer" aria-hidden></div>}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.main 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="home-main snap-y relative z-10" 
            aria-label="Início"
          >
            <section className="home-section snap-start flex items-center justify-center relative" aria-labelledby="hero-title">
              {/* Ambient orbs like loader */}
              <div className="bg-orbs" aria-hidden>
                <span className="orb o1"></span>
                <span className="orb o2"></span>
                <span className="orb o3"></span>
              </div>
              <div className="home-container py-8 w-full relative z-10">
                <div className="glass-elevated rounded-3xl p-8 sm:p-12 relative overflow-hidden text-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--sitio-yellow)]/10 via-[var(--sitio-green)]/5 to-[var(--sitio-blue)]/10 pointer-events-none"></div>
                  <div className="relative z-10">
                    <motion.div 
                      className="text-8xl mb-6"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      🏡
                    </motion.div>
                    <h2 id="hero-title" className="text-5xl sm:text-7xl font-black tracking-tight mb-6">
                      <span className="bg-gradient-to-r from-[var(--sitio-yellow)] via-[var(--sitio-orange)] to-[var(--sitio-red)] bg-clip-text text-transparent drop-shadow-lg">
                        Sítio do Pica-Pau IA
                      </span>
                    </h2>
                    <p className="text-xl text-[var(--fg-muted)] max-w-2xl mx-auto leading-relaxed mb-8 text-with-bg">
                      Uma aventura digital no mundo de <strong>Monteiro Lobato</strong>
                      <br />
                      <span className="text-lg opacity-80">Jogo de memória com música e IA • Acessível • Mobile-first</span>
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-4">
                      <div className="flex flex-wrap justify-center items-center gap-4 w-full max-w-4xl">
                        <motion.button 
                          className="group relative px-12 py-6 rounded-3xl bg-gradient-to-r from-[var(--sitio-green)] via-[#32CD32] to-[var(--sitio-green)] text-white font-black text-2xl hover:shadow-2xl hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400 animate-pulse shadow-lg btn-primary btn-main-action" 
                          onClick={() => setShowDifficultyModal(true)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.98 }}
                          aria-label="Jogar agora - Inicia o jogo da memória"
                        >
                          <span className="flex items-center gap-3">
                            🎮 <span>JOGAR AGORA</span>
                            <span className="group-hover:translate-x-2 transition-transform text-3xl">🚀</span>
                          </span>
                        </motion.button>
                        
                        {[ 
                          {
                            label: 'IA Visão Computacional',
                            grad: 'from-[var(--sitio-blue)] to-[var(--sitio-green)]',
                            icon: '🤖',
                            info: {
                              title: 'IA Visão Computacional',
                              text: 'Utiliza inteligência artificial para reconhecer cartas do jogo usando a câmera do dispositivo. Permite interação física e digital, tornando a experiência mais imersiva e divertida.'
                            },
                            action: () => { setView('vision'); setCameraActive(true); }
                          },
                          {
                            label: 'IA Trilha Procedural',
                            grad: 'from-[var(--sitio-yellow)] to-[var(--sitio-orange)]',
                            icon: '🎵',
                            info: {
                              title: 'IA Trilha Procedural',
                              text: 'A trilha sonora é gerada por algoritmos de IA, mudando conforme o progresso do jogo. Isso cria uma experiência musical única e personalizada para cada partida.'
                            },
                            action: () => { setShowAudioModal(true); }
                          },
                          {
                            label: 'Acessível',
                            grad: 'from-[var(--sitio-green)] to-[var(--sitio-yellow)]',
                            icon: '♿',
                            info: {
                              title: 'Acessibilidade',
                              text: 'Inclui navegação por teclado, alto contraste e leitura de tela (TTS), garantindo que pessoas com diferentes necessidades possam jogar sem barreiras.'
                            },
                            action: () => setFeatureInfo({ icon: '♿', title: 'Acessibilidade', text: 'Inclui navegação por teclado, alto contraste e leitura de tela (TTS), garantindo que pessoas com diferentes necessidades possam jogar sem barreiras.' })
                          }
                        ].map((b, i) => (
                          <motion.button
                            key={i}
                            type="button"
                            className={`btn-secondary px-4 py-3 rounded-full text-sm font-bold border border-white/30 bg-gradient-to-r ${b.grad} text-white shadow-lg focus:outline-none focus-visible:ring-2 ring-[var(--accent)]/50 min-w-[180px]`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.07 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setFeatureInfo({ icon: b.icon, title: b.info.title, text: b.info.text });
                              if (b.action) b.action();
                            }}
                            aria-label={b.label}
                          >
                            <span className="icon">{b.icon}</span> {b.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </motion.main>
        )}

        {view === 'game' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-20"
          >
            <Suspense fallback={<div className="stage-center text-xl">Carregando Jogo...</div>}>
              <MemoryGame 
                difficulty={pendingDifficulty}
                musicPlaying={musicPlaying}
                speechVolume={speechVolume}
                sfxVolume={sfxVolume}
                ttsEnabled={ttsEnabled}
                onFinish={() => {
                  alert({ title: 'Parabéns!', message: 'Você completou o jogo!', icon: '🎉' });
                  setView('home');
                }}
                onExit={() => setView('home')}
              />
            </Suspense>
          </motion.div>
        )}

        {view === 'vision' && cameraActive && (
          <motion.div 
            key="vision"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="camera-view stage-center mx-auto max-w-3xl bg-white/30 backdrop-blur-md border border-[var(--theme-primary,#FFD700)]/30 rounded-2xl p-4 shadow-xl"
          >
            <div style={{ position:'relative' }}>
              <video ref={videoRef} autoPlay playsInline width={480} height={360} style={{ borderRadius: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', marginBottom: '0.5rem' }} />
            </div>
            <canvas ref={canvasRef} width={480} height={360} style={{ display: 'block', margin: '0.5rem auto', borderRadius: '0.5rem' }} />
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={captureTemplate} className="small-btn">Capturar Template</button>
              <button onClick={takeSnapshot} className="small-btn">Tirar Foto</button>
              <a href={`${import.meta.env.BASE_URL || '/'}printable-cards.html`} target="_blank" rel="noopener" className="small-btn">📄 Cartas imprimíveis</a>
            </div>
            <p style={{ fontWeight: 700, textShadow: '0 2px 6px rgba(0,0,0,.35)' }}>
              Cartas detectadas: {detectedCards.length > 0 ? detectedCards.join(', ') : 'Nenhuma'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating popover for feature info (home) */}
      {featureInfo && view === 'home' && (
        <div style={{ position:'fixed', inset:0, zIndex: 2300, display:'grid', placeItems:'center', padding:'1rem' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.35)', backdropFilter:'blur(1.5px)' }} onClick={() => setFeatureInfo(null)} />
          <div className="glass-elevated" style={{ position:'relative', maxWidth:560, width:'min(92vw,560px)', borderRadius:'1.25rem', padding:'1.1rem 1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.6rem', marginBottom:'.35rem' }}>
              <span style={{ fontSize:'1.6rem' }}>{featureInfo.icon}</span>
              <h4 className="text-with-bg" style={{ margin:0, fontWeight:900 }}>{featureInfo.title}</h4>
            </div>
            <p style={{ margin:0, opacity:.95 }}>{featureInfo.text}</p>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'.8rem' }}>
              <button className="small-btn" onClick={() => setFeatureInfo(null)}>Entendi</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showDifficultyModal && (
          <motion.div style={{ position:'fixed', inset:0, zIndex: 2400, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(2px)' }} onClick={() => setShowDifficultyModal(false)} />
            <motion.div className="relative glass-elevated rounded-3xl max-w-md w-full p-6" initial={{ y: 30, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.98 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}>
              <h3 className="text-xl font-black mb-4">Escolha a Dificuldade</h3>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {['easy', 'medium', 'hard'].map(level => (
                  <button 
                    key={level}
                    onClick={() => setPendingDifficulty(level)}
                    className={`px-4 py-3 rounded-xl text-left font-bold transition-all ${pendingDifficulty === level ? 'bg-[var(--sitio-green)] text-white ring-2 ring-white/50' : 'glass hover:glass-elevated'}`}
                  >
                    {level === 'easy' && 'Fácil (4 pares)'}
                    {level === 'medium' && 'Médio (8 pares)'}
                    {level === 'hard' && 'Difícil (12 pares)'}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded-xl glass" onClick={() => setShowDifficultyModal(false)}>Cancelar</button>
                <button 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--sitio-green)] to-[var(--sitio-blue)] text-white font-bold" 
                  onClick={() => {
                    localStorage.setItem('memoryDifficulty', pendingDifficulty);
                    setShowDifficultyModal(false);
                    setView('game');
                  }}
                >
                  Iniciar Jogo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAudioModal && (
          <motion.div style={{ position:'fixed', inset:0, zIndex: 2400, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(2px)' }} onClick={() => setShowAudioModal(false)} />
            <motion.div className="relative glass-elevated rounded-3xl max-w-md w-full p-6" initial={{ y: 30, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.98 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}>
              <h3 className="text-xl font-black mb-2">Configurações de Áudio</h3>
              <div className="mb-4">
                <label className="block font-bold mb-1">Volume da trilha</label>
                <input type="range" min={0} max={1} step={0.01} value={musicVolume} onChange={e => setMusicVolume(Number(e.target.value))} className="w-full" />
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-1">Volume da fala (leitura de tela)</label>
                <input type="range" min={0} max={1} step={0.01} value={speechVolume} onChange={e => setSpeechVolume(Number(e.target.value))} className="w-full" />
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-1">Volume dos toques (SFX)</label>
                <input type="range" min={0} max={1} step={0.01} value={sfxVolume} onChange={e => setSfxVolume(Number(e.target.value))} className="w-full" />
              </div>
              <div className="mb-4">
                <label className="inline-flex items-center gap-2 font-bold">
                  <input type="checkbox" checked={ttsEnabled} onChange={e => setTtsEnabled(e.target.checked)} />
                  Ativar leitura de tela (TTS)
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--sitio-green)] to-[var(--sitio-blue)] text-white font-bold" onClick={() => setShowAudioModal(false)}>Fechar</button>
              </div>
            </motion.div>
          </motion.div>
        )}

      {showAboutModal && (
        <motion.div style={{ position:'fixed', inset:0, zIndex: 2400, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(2px)' }} onClick={() => setShowAboutModal(false)} />
        <motion.div className="relative glass-elevated rounded-3xl max-w-lg w-full p-6 text-center" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
                <h3 className="text-2xl font-black mb-4">Sobre o Projeto</h3>
                <p className="mb-4">Este é um projeto de demonstração para a Feira de Ciências, combinando o universo de Monteiro Lobato com tecnologias de Inteligência Artificial.</p>
                <p className="font-bold">Desenvolvido por: Malie, Tauan, Carla e Vovó Jane.</p>
                <button className="mt-6 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--sitio-green)] to-[var(--sitio-blue)] text-white font-bold" onClick={() => setShowAboutModal(false)}>Fechar</button>
            </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {view !== 'game' && (
        <footer className="site-footer">
          <div className="footer-row">
            <div className="footer-left text-with-bg">
              <span className="dot" />
              <span className="names">👩‍🎨 Malie • ⚡ Tauan • 🧙‍♀️ Carla • 👵 Vovó Jane</span>
            </div>
            <div className="footer-right">
              <a className="footer-link glass" href="https://github.com/TauanRibeiro/sitio-do-pica-pau-ia" target="_blank" rel="noreferrer">🌐 Repositório</a>
            </div>
          </div>
          <div className="footer-note text-with-bg">
            🏫 Projeto para Feira de Ciências - Colégio Meta, Sobradinho-DF
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;