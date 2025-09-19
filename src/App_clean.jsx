import React, { useState, useRef, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import './App.css'
import './utils/achievements'
import { getInitialTheme, applyTheme, toggleTheme } from './utils/theme'
import { useDialog } from './ui/DialogContext'

const MemoryGame = lazy(() => import('./components/MemoryGame'))

// Theme Toggle component
function ThemeToggle({ theme, setTheme }) {
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      className="relative grid place-items-center w-12 h-12 rounded-full glass hover:glass-elevated transition-all focus:outline-none focus-visible:ring-2 ring-[var(--accent)]/50"
      aria-label={`Mudar para tema ${nextTheme}`}
    >
      <span className={`absolute transition-transform duration-500 ${theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`}>
        🌙
      </span>
      <span className={`absolute transition-transform duration-500 ${theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`}>
        ☀️
      </span>
    </button>
  );
}

// Circular Music Toggle component
function MusicToggle({ isOn, onToggle, disabled = false, labelOn = 'Pausar música', labelOff = 'Tocar música' }) {
  return (
    <button
      type="button"
      aria-pressed={isOn}
      aria-label={isOn ? labelOn : labelOff}
      disabled={disabled}
      onClick={onToggle}
      className={`relative grid place-items-center w-12 h-12 rounded-full transition-all focus:outline-none focus-visible:ring-2 ring-[var(--accent)]/50 shadow-md ${
        isOn ? 'bg-[var(--secondary)] text-white' : 'glass text-[var(--fg)] hover:glass-elevated'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
    >
      <span className="text-lg">{isOn ? '🔊' : '🎵'}</span>
      {isOn && (
        <span className="absolute inset-0 rounded-full animate-ping bg-[var(--secondary)]/25" aria-hidden />
      )}
    </button>
  )
}

function App() {
  const { alert } = useDialog()
  // core state
  const [cameraActive, setCameraActive] = useState(false)
  const [microphoneActive, setMicrophoneActive] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [videoStream, setVideoStream] = useState(null)
  const [view, setView] = useState('home')
  const [theme, setTheme] = useState(getInitialTheme())
  const [pendingDifficulty, setPendingDifficulty] = useState(() => localStorage.getItem('memoryDifficulty') || 'easy')
  const [videoDevices, setVideoDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [useAI, setUseAI] = useState(true)

  // refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const templatesRef = useRef([])
  const [vizData] = useState(new Array(12).fill(4))
  const [flipCamera, setFlipCamera] = useState(false)
  const [detectedCards, setDetectedCards] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showDifficultyModal, setShowDifficultyModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)

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
        const vids = devices.filter(d => d.kind === 'videoinput')
        setVideoDevices(vids)
        if (!selectedDeviceId && vids.length > 0) setSelectedDeviceId(vids[0].deviceId)
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
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 sm:p-4 glass"
        >
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: -5, scale: 1.1 }}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[var(--sitio-yellow)] to-[var(--sitio-orange)] grid place-items-center text-2xl shadow-lg"
            >
              🏡
            </motion.div>
            <h1 className="text-lg sm:text-xl font-black text-with-bg hidden sm:block">Sítio IA</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setView('vision'); setCameraActive(true) }}
              className="grid place-items-center w-12 h-12 rounded-full glass hover:glass-elevated text-[var(--fg)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 shadow-md hover:scale-105"
              aria-label="Abrir câmera"
            >
              <span className="text-lg">📷</span>
            </button>
            <button 
              onClick={() => setShowAboutModal(true)}
              className="tab-btn text-xs sm:text-sm"
              aria-label="Sobre o projeto"
            >
              <span className="hidden sm:inline">Quem Somos</span>
              <span className="sm:hidden text-lg">ℹ️</span>
            </button>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <MusicToggle isOn={musicPlaying} onToggle={() => setMusicPlaying(v => !v)} />
          </div>
        </motion.header>
      )}

      {/* Home page */}
      {view === 'home' && (
        <main className="snap-y relative z-10" aria-label="Início">
          <section className="snap-start min-h-[95vh] flex items-center justify-center relative" aria-labelledby="hero-title">
            <div className="container py-8 w-full">
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
                    <motion.button 
                      className="group relative px-12 py-6 rounded-3xl bg-gradient-to-r from-[var(--sitio-green)] via-[#32CD32] to-[var(--sitio-green)] text-white font-black text-2xl hover:shadow-2xl hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400 animate-pulse shadow-lg" 
                      onClick={() => setView('game')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center gap-3">
                        🎮 <span>JOGAR AGORA</span>
                        <span className="group-hover:translate-x-2 transition-transform text-3xl">🚀</span>
                      </span>
                    </motion.button>
                    
                    {/* Badges */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      {[
                        { label: 'IA opcional', grad: 'from-[var(--sitio-blue)] to-[var(--sitio-green)]', icon: '🤖' },
                        { label: 'Trilha dinâmica', grad: 'from-[var(--sitio-yellow)] to-[var(--sitio-orange)]', icon: '🎵' },
                        { label: 'Acessível', grad: 'from-[var(--sitio-green)] to-[var(--sitio-yellow)]', icon: '♿' }
                      ].map((b, i) => (
                        <motion.span 
                          key={i} 
                          className={`px-4 py-2 rounded-full text-sm font-bold border border-white/30 bg-gradient-to-r ${b.grad} text-white shadow-lg`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ scale: 1.07 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {b.icon} {b.label}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Vision controls */}
      {view === 'vision' && (
        <div className="relative z-10 container px-4 py-4">
          <div className="glass rounded-2xl p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <button 
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all ${
                  cameraActive
                    ? 'bg-[var(--danger)] text-white shadow-lg'
                    : 'bg-[var(--accent)] text-[var(--sitio-brown)] hover:brightness-110'
                } focus:outline-none focus-visible:ring-2 ring-[var(--accent)]/50`}
                onClick={() => setCameraActive(!cameraActive)}
              >
                {cameraActive ? '📷 Desligar Câmera' : '📷 Ligar Câmera'}
              </button>
              <button 
                className="glass rounded-xl px-4 py-2.5 text-[var(--fg)] font-semibold hover:glass-elevated border border-[var(--border)] transition-all focus:outline-none focus-visible:ring-2 ring-[var(--accent)]/50"
                onClick={() => setFlipCamera(f => !f)}
              >
                {flipCamera ? '🔄 Desespelhar' : '🔄 Espelhar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="container pb-12">
        {view === 'game' && (
          <div className="memory-game stage-center">
            <Suspense fallback={<p>Carregando jogo...</p>}>
              <MemoryGame musicPlaying={musicPlaying} setMusicPlaying={setMusicPlaying} />
            </Suspense>
          </div>
        )}
        {view === 'vision' && (
          cameraActive ? (
            <div className="camera-view stage-center mx-auto max-w-3xl bg-white/30 backdrop-blur-md border border-[var(--theme-primary,#FFD700)]/30 rounded-2xl p-4 shadow-xl">
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
            </div>
          ) : (
            <div className="camera-placeholder stage-center text-center mx-auto max-w-3xl bg-white/30 backdrop-blur-md border border-[var(--theme-primary,#FFD700)]/30 rounded-2xl p-10 shadow-xl">
              <p className="font-extrabold text-[var(--theme-text,#2F4F2F)]">Clique em "Ligar Câmera" para começar!</p>
            </div>
          )
        )}
      </div>

      {/* About Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <motion.div
            className="fixed inset-0 z-[75] grid place-items-center p-4"
            role="dialog" aria-modal="true" aria-labelledby="about-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAboutModal(false)} />
            <motion.div
              className="relative glass-elevated rounded-3xl max-w-2xl w-full p-6"
              initial={{ y: 30, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              <h3 id="about-title" className="text-2xl font-black mb-2">Quem somos</h3>
              <p className="text-[var(--fg-muted)] mb-4">Sítio do Pica-Pau IA é um jogo de memória com música procedural brasileira, visão computacional opcional e acessibilidade embutida.</p>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--sitio-green)] to-[var(--sitio-blue)] text-white font-bold" onClick={() => setShowAboutModal(false)}>
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {view !== 'game' && (
        <footer className="relative mt-6 border-t border-[var(--theme-primary,#FFD700)]/30">
          <div className="mx-auto max-w-6xl px-4 py-6 text-[var(--theme-text,#2F4F2F)] text-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-extrabold text-[var(--theme-text,#2F4F2F)] text-with-bg">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--theme-primary,#FFD700)] shadow-sm" />
              👩‍🎨 Malie • ⚡ Tauan • 🧙‍♀️ Carla • 👵 Vovó Jane
            </div>
            <div className="flex items-center gap-3">
              <a className="glass px-3 py-1.5 rounded-lg" href="https://github.com/TauanRibeiro/sitio-do-pica-pau-ia" target="_blank" rel="noreferrer">🌐 Repositório</a>
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-6 text-center font-extrabold text-with-bg">
            🏫 Projeto para Feira de Ciências - Colégio Meta, Sobradinho-DF
          </div>
        </footer>
      )}
    </div>
  )
}

export default App