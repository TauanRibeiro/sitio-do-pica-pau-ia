import React, { useState, useEffect, useMemo, useCallback } from 'react'
import './memory.css'
import './themes.css'
import ThemeSelector from './ThemeSelectorClean'
import Leaderboard from './Leaderboard'

class MobileAudioEngine {
  constructor() {
    this.isInitialized = false
    this.touchStarted = false
    this.musicEnabled = true
    this.sfxVolume = 0.8 // volume dos efeitos sonoros
    this.hapticEnabled = true // feedback tátil
    this.dynamicMusicEnabled = true // mudanças musicais reativas
    this.audioContext = null
    this.isPlayingBackground = false
    this.backgroundInterval = null
    this.setupAudioUnlock()
  }

  setupAudioUnlock() {
    const unlockAudio = async () => {
      if (!this.touchStarted) {
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
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      this.isInitialized = true
    } catch (error) {
      this.isInitialized = false
    }
  }

  async playTone(frequency, duration, volume = 0.1) {
    if (!this.musicEnabled || !this.isInitialized || !this.audioContext) return
    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
    } catch (error) {}
  }

  playSweep(startFreq, endFreq, duration = 0.18, volume = 0.08, type = 'sine') {
    if (!this.musicEnabled || !this.isInitialized || !this.audioContext) return
    try {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(startFreq, this.audioContext.currentTime)
      osc.frequency.linearRampToValueAtTime(endFreq, this.audioContext.currentTime + duration)
      gain.gain.setValueAtTime(0.0001, this.audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration)
      osc.connect(gain)
      gain.connect(this.audioContext.destination)
      osc.start()
      osc.stop(this.audioContext.currentTime + duration)
    } catch {}
  }

  // Feedback háptico para mobile
  vibrate(pattern = [50]) {
    if (this.hapticEnabled && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }

  onCardFlip() { 
    this.playTone(800, 0.1)
    this.vibrate([30]) // vibração leve
  }
  onCardMatch() { 
    // quick arpeggio
    [900, 1200, 1500].forEach((f, i) => setTimeout(() => this.playTone(f, 0.12, 0.12), i * 90))
    this.vibrate([50, 30, 50]) // padrão de sucesso
  }
  onCardMiss() { 
    // short descending sweep
    this.playSweep(900, 280, 0.2, 0.08, 'triangle')
    this.vibrate([100]) // vibração mais longa para erro
  }
  onGameComplete() { 
    [800, 1000, 1200, 1400, 1600].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2), i * 150)
    })
    this.vibrate([200, 100, 200, 100, 300]) // celebração
  }

  playSitioMelody() {
    [523, 659, 784, 1047, 880, 698, 784, 659].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.4), i * 500)
    })
  }

  onStreakMilestone(level) {
    const base = level >= 8 ? 520 : level >= 5 ? 440 : 360
    const steps = level >= 8 ? [0, 4, 7, 12, 16] : level >= 5 ? [0, 4, 7, 12] : [0, 3, 7]
    steps.forEach((st, i) => setTimeout(() => this.playTone(base * Math.pow(2, st / 12), 0.14, 0.12), i * 110))
    this.vibrate([40, 20, 60, 20, 80]) // padrão crescente
  }

  onComboBreak() {
    this.playSweep(1000, 220, 0.18, 0.09, 'sawtooth')
    this.vibrate([150, 50, 100]) // padrão decrescente
  }

  onNearWin() {
    this.playSweep(420, 980, 0.25, 0.1, 'sine')
    this.vibrate([30, 30, 30]) // tensão
  }

  startBackgroundMusic() {
    if (this.isPlayingBackground) return
    this.isPlayingBackground = true
    this.backgroundInterval = setInterval(() => {
      if (this.isPlayingBackground && Math.random() > 0.8) {
        const notes = [523, 587, 659, 698, 784, 880, 988]
        this.playTone(notes[Math.floor(Math.random() * notes.length)], 0.1, 0.05)
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

export default function MemoryGame({ musicPlaying, setMusicPlaying }) {
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem('memoryDifficulty') || 'easy')
  const [moves, setMoves] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showAudioSettings, setShowAudioSettings] = useState(false)
  const [streak, setStreak] = useState(0)
  const [currentTheme, setCurrentTheme] = useState('sitio')
  const [audioEngine] = useState(() => new MobileAudioEngine())
  const [isPlaying, setIsPlaying] = useState(!!musicPlaying)
  const [controlsLocked, setControlsLocked] = useState(false) // liberado antes do início; bloqueia após primeiro clique
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [paused, setPaused] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  useEffect(() => { setIsPlaying(!!musicPlaying) }, [musicPlaying])

  const pairCount = useMemo(() => {
    switch(difficulty) {
      case 'easy': return 3
      case 'medium': return 6
      case 'hard': return 12
      default: return 3
    }
  }, [difficulty])

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
  setShowOnboarding(true)
  setPaused(false)
    
    // Reset musical para exploração com contexto de dificuldade
    if (window.sitioMusicEngine && (musicPlaying || isPlaying) && audioEngine.dynamicMusicEnabled) {
      try { 
        window.sitioMusicEngine.start('reset', { difficulty })
      } catch {}
    }
  }, [pairCount, difficulty, musicPlaying, isPlaying, audioEngine])

  useEffect(() => {
    // ensure theme is applied on mount
    const savedTheme = localStorage.getItem('sitioTheme') || 'sitio'
    document.documentElement.style.setProperty('--theme-primary', '') // no-op ensures CSSVars exist
    setCurrentTheme(savedTheme)
    initializeGame()
    
    // Configuração inicial da música com base na dificuldade
    if (window.sitioMusicEngine && (musicPlaying || isPlaying)) {
      try { 
        window.sitioMusicEngine.start('exploration', { difficulty }) 
      } catch {}
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
    } catch {}
  }, [ttsEnabled])

  const handleCardClick = useCallback((cardIndex) => {
  if (paused || flipped.length >= 2 || flipped.includes(cardIndex) || matched.includes(cardIndex) || finished) {
      return
    }
    // Primeiro clique de uma rodada: bloqueia controles (exceto música)
    if (!controlsLocked) setControlsLocked(true)

    audioEngine?.onCardFlip()
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
          audioEngine?.onCardMatch()
          speak(`Par! ${firstCard.name}`)
          const newMatched = [...matched, firstIndex, secondIndex]
          setMatched(newMatched)
          setScore(prev => prev + 50)
          setStreak(s => {
            const next = s + 1
            if (next === 3 || next === 5 || next === 8) {
              audioEngine?.onStreakMilestone(next)
              if (window.sitioMusicEngine && (musicPlaying || isPlaying) && audioEngine.dynamicMusicEnabled) {
                try { 
                  window.sitioMusicEngine.start('action', { difficulty, streak: next }) 
                } catch {}
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
            audioEngine?.onGameComplete()
            setControlsLocked(false)
            speak('Você venceu!')
            
            // Música especial de vitória
            if (window.sitioMusicEngine && (musicPlaying || isPlaying) && audioEngine.dynamicMusicEnabled) {
              try { 
                window.sitioMusicEngine.start('victory', { difficulty, moves, streak })
                window.sitioMusicEngine.playVictoryMelody()
              } catch {}
            }
            
            setTimeout(() => setShowCelebration(false), 1000)
            setTimeout(() => setShowLeaderboard(true), 350)
          } else {
            // Tensão no último par
            if (cards.length - newMatched.length === 2) {
              audioEngine?.onNearWin()
              if (window.sitioMusicEngine && (musicPlaying || isPlaying) && audioEngine.dynamicMusicEnabled) {
                try { 
                  window.sitioMusicEngine.start('tension', { difficulty }) 
                } catch {}
              }
            }
          }
        } else {
          audioEngine?.onCardMiss()
          speak('Tente novamente')
          setScore(prev => Math.max(0, prev - 10))
          if (streak > 0) audioEngine?.onComboBreak()
          setStreak(0)
          if (window.sitioMusicEngine && (musicPlaying || isPlaying) && audioEngine.dynamicMusicEnabled) {
            try { 
              window.sitioMusicEngine.start('puzzle', { difficulty }) 
            } catch {}
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
  }, [flipped, matched, finished, cards, moves, score, audioEngine])

  const containerClass = `memory-container difficulty-${difficulty}`

  return (
    <div className={containerClass}>
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
      
      <header className="game-header">
        <h1 className="game-title">SÍTIO DO PICA-PAU IA</h1>
      </header>

      <div className="memory-layout">
        <div className="grid">
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

        <aside className="side-panel">
          <h3>Painel de Controle</h3>
          
          <h4>Navegação</h4>
          <div className="navigation-controls">
            <button 
              className="control-btn primary-btn" 
              onClick={() => window.dispatchEvent(new CustomEvent('sitio:navigate', { detail: 'game' }))}
            >
              🎮 Jogar Agora
            </button>
            <button 
              className="control-btn secondary-btn" 
              onClick={() => window.dispatchEvent(new CustomEvent('sitio:navigate', { detail: 'vision' }))}
            >
              📷 Modo Câmera
            </button>
            <button 
              className={`control-btn music-btn ${isPlaying ? 'playing' : ''}`} 
              onClick={() => {
                audioEngine?.vibrate([30]);
                setMusicPlaying(p => !p);
              }}
            >
              {isPlaying ? '❚❚ Pausar Música' : '▶️ Tocar Música'}
            </button>
          </div>
          
          <h4>Estatísticas</h4>
          <div className="game-stats">
            <div className="stat-item"><span>💰 Pontos:</span> <span className="stat-value">{score}</span></div>
            <div className="stat-item"><span>👟 Jogadas:</span> <span className="stat-value">{moves}</span></div>
            <div className="stat-item"><span>🔥 Sequência:</span> <span className="stat-value">{streak}</span></div>
          </div>

          <h4>Dificuldade</h4>
          <div className="difficulty-selector">
            {['easy', 'medium', 'hard'].map(d => (
              <button 
                key={d} 
                className={`difficulty-btn ${difficulty === d ? 'active' : ''}`} 
                onClick={() => {
                  if (controlsLocked) return;
                  localStorage.setItem('memoryDifficulty', d);
                  setDifficulty(d);
                }}
                disabled={controlsLocked}
              >
                {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Médio' : 'Difícil'}
              </button>
            ))}
          </div>

          <h4>Ações</h4>
          <div className="game-controls">
            <button className="control-btn" onClick={initializeGame} disabled={controlsLocked}>🔄 Reiniciar</button>
            <button className="control-btn leaderboard-btn" onClick={() => setShowLeaderboard(true)} disabled={controlsLocked}>🏆 Ranking</button>
            <button className="control-btn" onClick={() => setShowAudioSettings(true)} disabled={controlsLocked}>🔊 Áudio</button>
          </div>
          
          <div className="game-footer">
            <ThemeSelector onThemeChange={setCurrentTheme} currentTheme={currentTheme} disabled={controlsLocked} />
          </div>
        </aside>
      </div>

      {showLeaderboard && <Leaderboard score={score} moves={moves} difficulty={difficulty} onClose={() => setShowLeaderboard(false)} />}
      
      {showAudioSettings && (
        <div className="audio-settings-overlay" onClick={() => setShowAudioSettings(false)}>
          <div className="audio-settings-modal" onClick={e => e.stopPropagation()}>
            <h3>Configurações de Áudio</h3>
            <label><input type="checkbox" checked={audioEngine.musicEnabled} onChange={() => audioEngine.musicEnabled = !audioEngine.musicEnabled} /> Música de Fundo</label>
            <label><input type="checkbox" checked={audioEngine.dynamicMusicEnabled} onChange={() => audioEngine.dynamicMusicEnabled = !audioEngine.dynamicMusicEnabled} /> Música Dinâmica</label>
            <label><input type="checkbox" checked={audioEngine.hapticEnabled} onChange={() => audioEngine.hapticEnabled = !audioEngine.hapticEnabled} /> Feedback Tátil (Vibração)</label>
            <label><input type="checkbox" checked={ttsEnabled} onChange={() => setTtsEnabled(p => !p)} /> Leitor de Tela (TTS)</label>
            <label>Volume Efeitos: <input type="range" min="0" max="1" step="0.1" defaultValue={audioEngine.sfxVolume} onChange={e => audioEngine.sfxVolume = parseFloat(e.target.value)} /></label>
            <button onClick={() => setShowAudioSettings(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
