import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import './memory.css'
import './themes.css'
import Leaderboard from './Leaderboard'

class MobileAudioEngine {
  constructor() {
    this.isInitialized = false
    this.touchStarted = false
    this.audioContext = null
    this.isPlayingBackground = false
    this.backgroundInterval = null
    this.onInitialized = null // callback for when audio is ready
    this.setupAudioUnlock()
  }

  // Backwards-compatible initializer used by the React component
  async initialize() {
    return this.initAudio()
  }

  setupAudioUnlock() {
    const unlockAudio = async () => {
      if (!this.touchStarted) {
        console.log('🎵 Audio unlock triggered by user interaction')
        this.touchStarted = true
        await this.initAudio()
        document.removeEventListener('touchstart', unlockAudio)
        document.removeEventListener('click', unlockAudio)
      }
    }
    document.addEventListener('touchstart', unlockAudio, { passive: true })
    document.addEventListener('click', unlockAudio)
  }

  async initAudio() {
    try {
      console.log('🎵 Initializing audio context...')
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
        console.log('🎵 Audio context resumed')
      }
      this.isInitialized = true
      console.log('✅ Audio engine initialized successfully')
      if (this.onInitialized) this.onInitialized(true)
    } catch (error) {
      console.error('❌ Audio initialization failed:', error)
      this.isInitialized = false
      if (this.onInitialized) this.onInitialized(false)
    }
  }

  async playTone(frequency, duration, volume = 0.1, musicEnabled = true, sfxVolume = 0.8) {
    if (!musicEnabled || !this.isInitialized || !this.audioContext) {
      console.log('🔇 Audio disabled or not initialized')
      return
    }
    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume * sfxVolume, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
      console.log(`🎵 Playing tone: ${frequency}Hz`)
    } catch (error) {
      console.warn('🔇 Tone playback failed:', error)
    }
  }

  playSweep(startFreq, endFreq, duration = 0.18, volume = 0.08, type = 'sine', musicEnabled = true, sfxVolume = 0.8) {
    if (!musicEnabled || !this.isInitialized || !this.audioContext) return
    try {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(startFreq, this.audioContext.currentTime)
      osc.frequency.linearRampToValueAtTime(endFreq, this.audioContext.currentTime + duration)
      gain.gain.setValueAtTime(0.0001, this.audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(volume * sfxVolume, this.audioContext.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration)
      osc.connect(gain)
      gain.connect(this.audioContext.destination)
      osc.start()
      osc.stop(this.audioContext.currentTime + duration)
    } catch (error) {
      console.warn('🔇 Sweep playback failed:', error)
    }
  }

  // Feedback háptico para mobile
  vibrate(pattern = [50], hapticEnabled = true) {
    if (hapticEnabled && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }

  onCardFlip(musicEnabled, sfxVolume, hapticEnabled) { 
    this.playTone(800, 0.1, 0.1, musicEnabled, sfxVolume)
    this.vibrate([30], hapticEnabled)
  }
  onCardMatch(musicEnabled, sfxVolume, hapticEnabled) { 
    // quick arpeggio
    [900, 1200, 1500].forEach((f, i) => setTimeout(() => this.playTone(f, 0.12, 0.12, musicEnabled, sfxVolume), i * 90))
    this.vibrate([50, 30, 50], hapticEnabled)
  }
  onCardMiss(musicEnabled, sfxVolume, hapticEnabled) { 
    // short descending sweep
    this.playSweep(900, 280, 0.2, 0.08, 'triangle', musicEnabled, sfxVolume)
    this.vibrate([100], hapticEnabled)
  }
  onGameComplete(musicEnabled, sfxVolume, hapticEnabled) { 
    [800, 1000, 1200, 1400, 1600].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 0.15, musicEnabled, sfxVolume), i * 150)
    })
    this.vibrate([200, 100, 200, 100, 300], hapticEnabled)
  }

  playSitioMelody(musicEnabled, sfxVolume) {
    [523, 659, 784, 1047, 880, 698, 784, 659].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.4, 0.12, musicEnabled, sfxVolume), i * 500)
    })
  }

  onStreakMilestone(level, musicEnabled, sfxVolume, hapticEnabled) {
    const base = level >= 8 ? 520 : level >= 5 ? 440 : 360
    const steps = level >= 8 ? [0, 4, 7, 12, 16] : level >= 5 ? [0, 4, 7, 12] : [0, 3, 7]
    steps.forEach((st, i) => setTimeout(() => this.playTone(base * Math.pow(2, st / 12), 0.14, 0.12, musicEnabled, sfxVolume), i * 110))
    this.vibrate([40, 20, 60, 20, 80], hapticEnabled)
  }

  onComboBreak(musicEnabled, sfxVolume, hapticEnabled) {
    this.playSweep(1000, 220, 0.18, 0.09, 'sawtooth', musicEnabled, sfxVolume)
    this.vibrate([150, 50, 100], hapticEnabled)
  }

  onNearWin(musicEnabled, sfxVolume, hapticEnabled) {
    this.playSweep(420, 980, 0.25, 0.1, 'sine', musicEnabled, sfxVolume)
    this.vibrate([30, 30, 30], hapticEnabled)
  }

  startBackgroundMusic(musicEnabled, sfxVolume) {
    if (this.isPlayingBackground || !musicEnabled) return
    this.isPlayingBackground = true
    this.backgroundInterval = setInterval(() => {
      if (this.isPlayingBackground && Math.random() > 0.8) {
        const notes = [523, 587, 659, 698, 784, 880, 988]
        this.playTone(notes[Math.floor(Math.random() * notes.length)], 0.1, 0.05, musicEnabled, sfxVolume)
      }
    }, 3000)
  }

  stopBackgroundMusic() {
    this.isPlayingBackground = false
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval)
      this.backgroundInterval = null
    }
  }
}

const ALL_CHARACTERS = [
  { name:'Emília', img: './characters/emilia.png' },
  { name:'Narizinho', img: './characters/narizinho.png' },
  { name:'Pedrinho', img: './characters/pedrinho.png' },
  { name:'Visconde', img: './characters/visconde.png' },
  { name:'Dona Benta', img: './characters/dona_benta.png' },
  { name:'Tia Nastácia', img: './characters/tia_nastacia.png' },
  { name:'Saci', img: './characters/saci.png' },
  { name:'Cuca', img: './characters/cuca.png' },
  { name:'Rabicó', img: './characters/rabico.png' },
  { name:'Tio Barnabé', img: './characters/barnabe.png' },
  { name:'Quindim', img: './characters/quindim.png' },
  { name:'Conselheiro', img: './characters/conselheiro.png' }
]

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function MemoryGame({ musicPlaying }) {
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [difficulty] = useState(() => localStorage.getItem('memoryDifficulty') || 'easy')
  const [moves, setMoves] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showAudioSettings, setShowAudioSettings] = useState(false)
  const [streak, setStreak] = useState(0)
  const [audioEngine] = useState(() => new MobileAudioEngine())
  const [isPlaying, setIsPlaying] = useState(!!musicPlaying)
  const [controlsLocked, setControlsLocked] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [paused, setPaused] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [sfxVolume, setSfxVolume] = useState(0.8)
  const [hapticEnabled, setHapticEnabled] = useState(true)
  const [dynamicMusicEnabled, setDynamicMusicEnabled] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const timerRef = useRef(null)
  const [finalScore, setFinalScore] = useState(null)
  const [gridCols, setGridCols] = useState(3)
  const [cardPx, setCardPx] = useState(120)
  // Setup audio initialization callback
  useEffect(() => {
    console.log('🎵 Setting up audio engine initialization callback...')
    if (audioEngine) {
      audioEngine.onInitialized = (success) => {
        console.log(`🎵 Audio engine initialization: ${success ? 'SUCCESS' : 'FAILED'}`)
        setAudioInitialized(success)
        if (success) {
          console.log('✅ Audio engine ready for game sounds')
          // Test audio with a brief tone
          setTimeout(() => {
            console.log('🔊 Testing audio with brief tone...')
            audioEngine.playTone(440, 0.1, 0.05, musicEnabled, sfxVolume).catch(err => 
              console.warn('Test tone failed:', err)
            )
          }, 500)
        } else {
          console.error('❌ Audio engine failed to initialize - sounds will not work')
        }
      }
      // Trigger initialization immediately
      console.log('🎵 Triggering audio engine initialization...')
      audioEngine.initialize()
    } else {
      console.error('❌ Audio engine instance not available')
    }
  }, [audioEngine, musicEnabled, sfxVolume])

  useEffect(() => { setIsPlaying(!!musicPlaying) }, [musicPlaying])

  const pairCount = useMemo(() => {
    switch(difficulty) {
      case 'easy': return 3
      case 'medium': return 6
      case 'hard': return 12
      default: return 3
    }
  }, [difficulty])

  // initializeGame doesn't use `score` in its closure; keep deps minimal to avoid unnecessary re-renders
  const initializeGame = useCallback(() => {
    const selectedChars = shuffle(ALL_CHARACTERS).slice(0, pairCount)
    const gameCards = shuffle([...selectedChars, ...selectedChars]).map((char, index) => ({
      ...char,
      id: char.name + index,
      uniqueId: index
    }))
    
    setCards(gameCards)
    setFlipped([])
    setMatched([])
    setScore(1000)
    setMoves(0)
    setFinished(false)
    setShowCelebration(false)
    setStreak(0)
  setControlsLocked(false)
  setShowOnboarding(false)
    setPaused(false)
    setGameStarted(false)
    setElapsedMs(0)
    setFinalScore(null)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // Reset musical para exploração com contexto de dificuldade
    if (window.sitioMusicEngine && (musicPlaying || isPlaying) && dynamicMusicEnabled) {
      try { 
        window.sitioMusicEngine.start('reset', { difficulty })
      } catch { /* noop */ }
    }
  }, [pairCount, difficulty, musicPlaying, isPlaying, audioEngine, dynamicMusicEnabled])

  useEffect(() => {
    // ensure theme is applied on mount
  document.documentElement.style.setProperty('--theme-primary', '') // ensure CSSVars exist
    initializeGame()
    
    // Configuração inicial da música com base na dificuldade
    if (window.sitioMusicEngine && (musicPlaying || isPlaying)) {
      try { 
        window.sitioMusicEngine.start('exploration', { difficulty }) 
      } catch { /* noop */ }
    }
  }, [initializeGame, difficulty, musicPlaying, isPlaying])

  // Esconde onboarding após 2 jogadas
  useEffect(() => {
    if (moves >= 2 && showOnboarding) setShowOnboarding(false)
  }, [moves, showOnboarding])

  // Atalho de pausa com tecla "P"
  useEffect(() => {
    const onKey = (e) => {
      if (e.key && e.key.toLowerCase() === 'p') {
        setPaused(p => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const speak = useCallback((text) => {
  try {
      if (!ttsEnabled) return
      if (!('speechSynthesis' in window)) return
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'pt-BR'
      utter.rate = 1
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
  } catch { /* noop */ }
  }, [ttsEnabled])

  const handleCardClick = useCallback((cardIndex) => {
  if (paused || flipped.length >= 2 || flipped.includes(cardIndex) || matched.includes(cardIndex) || finished) {
      return
    }
    // Primeiro clique de uma rodada: bloqueia controles (exceto música)
    if (!controlsLocked) setControlsLocked(true)
    // Inicia timer no primeiro clique do jogo
    if (!gameStarted) {
      setGameStarted(true)
      const start = performance.now()
      const tick = () => {
        setElapsedMs(Math.max(0, Math.floor(performance.now() - start)))
      }
      timerRef.current = setInterval(tick, 1000)
    }

    audioEngine?.onCardFlip(musicEnabled, sfxVolume, hapticEnabled)
  const card = cards[cardIndex]
  if (card?.name) speak(card.name)
    const newFlipped = [...flipped, cardIndex]
    setFlipped(newFlipped)
    setMoves(prev => prev + 1)

    if (newFlipped.length === 2) {
      const [firstIndex, secondIndex] = newFlipped
      const firstCard = cards[firstIndex]
      const secondCard = cards[secondIndex]

      setTimeout(() => {
        if (firstCard.name === secondCard.name) {
          audioEngine?.onCardMatch(musicEnabled, sfxVolume, hapticEnabled)
          speak(`Par! ${firstCard.name}`)
          const newMatched = [...matched, firstIndex, secondIndex]
          setMatched(newMatched)
          setScore(prev => prev + 50)
          setStreak(s => {
            const next = s + 1
            if (next === 3 || next === 5 || next === 8) {
              audioEngine?.onStreakMilestone(next, musicEnabled, sfxVolume, hapticEnabled)
              if (window.sitioMusicEngine && (musicPlaying || isPlaying) && dynamicMusicEnabled) {
                try { 
                  window.sitioMusicEngine.start('action', { difficulty, streak: next }) 
                } catch { /* music engine unavailable */ }
              }
            }
            return next
          })
          // sparkle glow via class toggle
          setTimeout(() => {
            const nodes = document.querySelectorAll('.card')
            nodes[firstIndex]?.classList.add('matched')
            nodes[secondIndex]?.classList.add('matched')
            setTimeout(() => {
              nodes[firstIndex]?.classList.remove('matched')
              nodes[secondIndex]?.classList.remove('matched')
            }, 600)
          }, 0)
          
          if (newMatched.length === cards.length) {
            setFinished(true)
            setShowCelebration(true)
            audioEngine?.onGameComplete(musicEnabled, sfxVolume, hapticEnabled)
            setControlsLocked(false)
            speak('Você venceu!')
            // Para timer e calcula score final baseado em tempo/movimentos/dificuldade
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            const elapsedSeconds = Math.max(1, Math.round(elapsedMs / 1000))
            const pairs = Math.floor(cards.length / 2)
            const difficultyMult = difficulty === 'hard' ? 2.0 : difficulty === 'medium' ? 1.5 : 1.0
            const timeScore = Math.max(0, 10000 - elapsedSeconds * 25) // penaliza 25 por segundo
            const movePenalty = Math.max(0, (moves - (pairs * 2))) * 10 // cada flip extra custa 10
            const raw = Math.max(0, timeScore - movePenalty) 
            const computed = Math.round(raw * difficultyMult + streak * 50)
            setFinalScore(computed)
            
            // Música especial de vitória
            if (window.sitioMusicEngine && (musicPlaying || isPlaying) && dynamicMusicEnabled) {
              try { 
                window.sitioMusicEngine.start('victory', { difficulty, moves, streak })
                window.sitioMusicEngine.playVictoryMelody()
              } catch { /* noop */ }
            }
            
            setTimeout(() => setShowCelebration(false), 1000)
            setTimeout(() => setShowLeaderboard(true), 350)
          } else {
            // Tensão no último par
            if (cards.length - newMatched.length === 2) {
              audioEngine?.onNearWin(musicEnabled, sfxVolume, hapticEnabled)
              if (window.sitioMusicEngine && (musicPlaying || isPlaying) && dynamicMusicEnabled) {
                try { 
                  window.sitioMusicEngine.start('tension', { difficulty }) 
                } catch { /* noop */ }
              }
            }
          }
        } else {
          audioEngine?.onCardMiss(musicEnabled, sfxVolume, hapticEnabled)
          speak('Tente novamente')
          setScore(prev => Math.max(0, prev - 10))
          if (streak > 0) audioEngine?.onComboBreak(musicEnabled, sfxVolume, hapticEnabled)
          setStreak(0)
          if (window.sitioMusicEngine && (musicPlaying || isPlaying) && dynamicMusicEnabled) {
            try { 
              window.sitioMusicEngine.start('puzzle', { difficulty }) 
            } catch { /* noop */ }
          }
          // shake on miss
          setTimeout(() => {
            const nodes = document.querySelectorAll('.card')
            nodes[firstIndex]?.classList.add('miss')
            nodes[secondIndex]?.classList.add('miss')
            setTimeout(() => {
              nodes[firstIndex]?.classList.remove('miss')
              nodes[secondIndex]?.classList.remove('miss')
            }, 350)
          }, 0)
        }
        
        setFlipped([])
      }, 800)
    }
  }, [flipped, matched, finished, cards, moves, audioEngine, gameStarted, difficulty, elapsedMs, isPlaying, musicPlaying, speak, streak, controlsLocked, paused])

  // Calcula melhor grid e tamanho de carta para ocupar a tela inteira com foco nas cartas
  const recalcGrid = useCallback(() => {
    const total = cards.length || pairCount * 2
    if (!total) return
    const vw = Math.max(320, window.innerWidth)
    const vh = Math.max(400, window.innerHeight)
    const gap = 12 // px
    const padX = 24, padY = 24 // padding interno
    let best = { size: 0, cols: 2, rows: Math.ceil(total / 2) }
    for (let cols = 2; cols <= Math.min(total, 8); cols++) {
      const rows = Math.ceil(total / cols)
      const cardW = Math.floor((vw - padX * 2 - gap * (cols - 1)) / cols)
      const cardH = Math.floor((vh - padY * 2 - gap * (rows - 1)) / rows)
      const size = Math.max(48, Math.min(cardW, cardH))
      if (size > best.size) best = { size, cols, rows }
    }
    setGridCols(best.cols)
    setCardPx(best.size)
  }, [cards.length, pairCount])

  useEffect(() => { recalcGrid() }, [recalcGrid, difficulty])
  useEffect(() => {
    const onResize = () => recalcGrid()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [recalcGrid])

  const containerClass = `memory-container difficulty-${difficulty} immersive`

  return (
    <div className={containerClass} style={{ ['--cols']: gridCols, ['--card-size']: `${cardPx}px` }}>
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-text">
            🎉 Parabéns! Você encontrou todos os personagens do Sítio! 🏆
          </div>
        </div>
      )}
      {showOnboarding && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => { setShowOnboarding(false); speak('Toque nas cartas para começar. A música cresce a cada acerto.'); }}>
          <div style={{ background:'#fff', color:'#000', border:'4px solid #000', borderRadius:16, padding:'1rem 1.25rem', maxWidth:420, textAlign:'center', fontWeight:800 }}>
            <div style={{ fontSize:'1.25rem', marginBottom:'0.5rem' }}>👉 Toque nas cartas para começar!</div>
            <div style={{ fontSize:'0.95rem' }}>A música do Sítio vai crescendo com seus acertos. Clique para continuar.</div>
          </div>
        </div>
      )}
      {paused && (
        <div className="pause-overlay" onClick={() => setPaused(false)}>
          <div className="pause-box">PAUSADO</div>
        </div>
      )}
      {/* Botão de sair (apenas opção além das cartas) */}
      <button
        className="exit-btn"
        onClick={() => {
          if (confirm('Deseja sair do jogo atual? Seu progresso será perdido.')) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            window.dispatchEvent(new CustomEvent('sitio:navigate', { detail: 'vision' }))
          }
        }}
        aria-label="Sair do jogo"
      >
        ← Sair
      </button>
      
      {/* Botão de configurações de áudio */}
      <button
        className="settings-btn"
        onClick={() => setShowAudioSettings(true)}
        aria-label="Configurações de áudio"
        title={audioInitialized ? 'Audio funcionando - Clique para configurações' : 'Audio com problemas - Clique para verificar'}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: audioInitialized ? 'rgba(0,150,0,0.9)' : 'rgba(200,50,0,0.9)',
          color: 'white',
          border: audioInitialized ? '2px solid rgba(0,200,0,0.5)' : '2px solid rgba(255,100,0,0.5)',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          fontSize: '1.2rem',
          cursor: 'pointer',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
      >
        {audioInitialized ? '🔊' : '🔇'}
      </button>

      <div className="memory-layout only-grid">
        <div className="grid" style={{ ['--cols']: gridCols, ['--card-size']: `${cardPx}px` }}>
          {cards.map((card, index) => (
            <div
              key={card.uniqueId}
              className={`card ${flipped.includes(index) || matched.includes(index) ? 'flipped' : ''}`}
              onClick={() => handleCardClick(index)}
            >
              <div className="front">
                <img src={card.img} alt={card.name} />
                <span className="name">{card.name}</span>
              </div>
              <div className="back">
                <div className="sitio-logo">
                  <span className="casa-icon">🏡</span>
                  <span className="sitio-text">Sítio</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showLeaderboard && (
        <Leaderboard 
          newScore={finalScore ?? score} 
          moves={moves} 
          difficulty={difficulty} 
          timeSeconds={Math.max(1, Math.round(elapsedMs/1000))}
          onClose={() => setShowLeaderboard(false)} 
        />
      )}
      
      {showAudioSettings && (
        <div className="audio-settings-overlay" onClick={() => setShowAudioSettings(false)}>
          <div className="audio-settings-modal" onClick={e => e.stopPropagation()}>
            <h3>Configurações de Áudio</h3>
            <div style={{ 
              padding: '0.5rem', 
              margin: '0.5rem 0', 
              background: audioInitialized ? '#d4edda' : '#f8d7da',
              border: `1px solid ${audioInitialized ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              Status: {audioInitialized ? '✅ Áudio Funcionando' : '❌ Áudio com Problemas'}
            </div>
            <label><input type="checkbox" checked={musicEnabled} onChange={() => setMusicEnabled(!musicEnabled)} /> Música de Fundo</label>
            <label><input type="checkbox" checked={dynamicMusicEnabled} onChange={() => setDynamicMusicEnabled(!dynamicMusicEnabled)} /> Música Dinâmica</label>
            <label><input type="checkbox" checked={hapticEnabled} onChange={() => setHapticEnabled(!hapticEnabled)} /> Feedback Tátil (Vibração)</label>
            <label><input type="checkbox" checked={ttsEnabled} onChange={() => setTtsEnabled(!ttsEnabled)} /> Leitor de Tela (TTS)</label>
            <label>Volume Efeitos: <input type="range" min="0" max="1" step="0.1" value={sfxVolume} onChange={e => setSfxVolume(parseFloat(e.target.value))} /></label>
            <button onClick={() => setShowAudioSettings(false)}>Fechar</button>
            {!audioInitialized && (
              <button 
                onClick={() => {
                  console.log('🔄 Manual audio re-initialization requested')
                  audioEngine?.initialize()
                }}
                style={{ marginLeft: '0.5rem', background: '#007bff', color: 'white' }}
              >
                Tentar Novamente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
