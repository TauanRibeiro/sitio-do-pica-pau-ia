import React, { useState, useEffect, useMemo, useCallback } from 'react'
import './memory.css'
import './themes.css'
import ThemeSelector from './ThemeSelector'
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

  const handleCardClick = useCallback((cardIndex) => {
    if (flipped.length >= 2 || flipped.includes(cardIndex) || matched.includes(cardIndex) || finished) {
      return
    }

    audioEngine?.onCardFlip()
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
      
      <header className="game-header">
        <h1 className="game-title text-with-bg" style={{
          fontSize: '1.8rem',
          fontWeight: '900',
          textAlign: 'center',
          padding: '1rem',
          color: 'var(--theme-text, #2F4F2F)',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          backgroundColor: 'rgba(255, 215, 0, 0.9)',
          borderRadius: '12px',
          border: '3px solid var(--theme-primary, #FFD700)',
          marginBottom: '1.5rem'
        }}>
          🏡 Sítio do Pica-Pau Amarelo - Jogo da Memória
        </h1>
        
        <div className="difficulty-selector" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.8rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {['easy', 'medium', 'hard'].map(level => (
            <button 
              key={level}
              onClick={() => {
                setDifficulty(level)
                localStorage.setItem('memoryDifficulty', level)
              }}
              className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
              aria-label={`Selecionar dificuldade ${level}`}
              style={{ 
                minHeight: '48px', 
                minWidth: '120px',
                fontSize: '1rem',
                fontWeight: '700',
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                border: '2px solid #000',
                backgroundColor: difficulty === level ? '#FFD700' : '#FFF',
                color: '#000',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textShadow: 'none'
              }}
            >
              {level === 'easy' ? '🌱 Fácil (6)' : level === 'medium' ? '🌳 Médio (12)' : '🌲 Difícil (24)'}
            </button>
          ))}
        </div>
        
        <div className="game-controls" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.8rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <button onClick={initializeGame} className="control-btn restart-btn" aria-label="Novo jogo" style={{ 
            minHeight: '48px', 
            minWidth: '120px',
            fontSize: '0.95rem',
            fontWeight: '700',
            padding: '0.8rem 1rem',
            borderRadius: '8px',
            border: '2px solid #000',
            backgroundColor: '#32CD32',
            color: '#000',
            cursor: 'pointer',
            textShadow: 'none'
          }}>
            🔄 Novo Jogo
          </button>
          
          <button onClick={() => audioEngine?.playSitioMelody()} className="control-btn melody-btn" aria-label="Tocar melodia do Sítio" style={{ 
            minHeight: '48px', 
            minWidth: '120px',
            fontSize: '0.95rem',
            fontWeight: '700',
            padding: '0.8rem 1rem',
            borderRadius: '8px',
            border: '2px solid #000',
            backgroundColor: '#FF69B4',
            color: '#000',
            cursor: 'pointer',
            textShadow: 'none'
          }}>
            🎵 Melodia
          </button>
          
          <button 
            onClick={() => {
              const next = !isPlaying
              setIsPlaying(next)
              if (typeof setMusicPlaying === 'function') setMusicPlaying(next)
            }} 
            className={`control-btn music-btn ${isPlaying ? 'playing' : ''}`}
            aria-label={isPlaying ? 'Pausar música' : 'Tocar música'}
            style={{ 
              minHeight: '48px', 
              minWidth: '120px',
              fontSize: '0.95rem',
              fontWeight: '700',
              padding: '0.8rem 1rem',
              borderRadius: '8px',
              border: '2px solid #000',
              backgroundColor: isPlaying ? '#FF6347' : '#87CEEB',
              color: '#000',
              cursor: 'pointer',
              textShadow: 'none'
            }}
          >
            {isPlaying ? '🔇 Pausar' : '🎵 Música'}
          </button>

          <button onClick={() => setShowAudioSettings(!showAudioSettings)} className="control-btn audio-settings-btn" aria-label="Configurações de áudio" style={{ 
            minHeight: '48px', 
            minWidth: '100px',
            fontSize: '0.95rem',
            fontWeight: '700',
            padding: '0.8rem 1rem',
            borderRadius: '8px',
            border: '2px solid #000',
            backgroundColor: '#DDA0DD',
            color: '#000',
            cursor: 'pointer',
            textShadow: 'none'
          }}>
            🔧 Config
          </button>
          
          <button onClick={() => setShowLeaderboard(true)} className="control-btn leaderboard-btn" aria-label="Abrir ranking" style={{ 
            minHeight: '48px', 
            minWidth: '100px',
            fontSize: '0.95rem',
            fontWeight: '700',
            padding: '0.8rem 1rem',
            borderRadius: '8px',
            border: '2px solid #000',
            backgroundColor: '#FFD700',
            color: '#000',
            cursor: 'pointer',
            textShadow: 'none'
          }}>
            🏆 Rank
          </button>
        </div>
        
        <div className="game-stats" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div className="stat-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.8rem 1.2rem',
            backgroundColor: '#FFF',
            border: '2px solid #000',
            borderRadius: '8px',
            fontWeight: '700',
            color: '#000',
            minWidth: '100px',
            justifyContent: 'center'
          }}>
            <span className="stat-icon" style={{fontSize: '1.2rem'}}>⭐</span>
            <span className="stat-label">Pontos:</span>
            <span className="stat-value" style={{fontWeight: '900', color: '#FF4500'}}>{score}</span>
          </div>
          <div className="stat-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.8rem 1.2rem',
            backgroundColor: '#FFF',
            border: '2px solid #000',
            borderRadius: '8px',
            fontWeight: '700',
            color: '#000',
            minWidth: '100px',
            justifyContent: 'center'
          }}>
            <span className="stat-icon" style={{fontSize: '1.2rem'}}>🎯</span>
            <span className="stat-label">Jogadas:</span>
            <span className="stat-value" style={{fontWeight: '900', color: '#FF4500'}}>{moves}</span>
          </div>
          <div className="stat-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.8rem 1.2rem',
            backgroundColor: '#FFF',
            border: '2px solid #000',
            borderRadius: '8px',
            fontWeight: '700',
            color: '#000',
            minWidth: '100px',
            justifyContent: 'center'
          }}>
            <span className="stat-icon" style={{fontSize: '1.2rem'}}>🔥</span>
            <span className="stat-label">Sequência:</span>
            <span className="stat-value" style={{fontWeight: '900', color: streak > 0 ? '#32CD32' : '#FF4500'}}>{streak}</span>
          </div>
        </div>
      </header>

      <div className="grid">
        {cards.map((card, index) => (
          <div 
            key={card.uniqueId}
            className={'card ' + (flipped.includes(index) || matched.includes(index) ? 'flipped' : '') + ' ' + (matched.includes(index) ? 'matched' : '')}
            onClick={() => handleCardClick(index)}
          >
            <div className="front">
              <img 
                src={card.img} 
                alt={card.name}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90"><rect width="90" height="90" fill="%23FFD700"/><text x="45" y="45" font-family="Arial" font-size="10" text-anchor="middle" dy=".3em" fill="%23000">' + card.name + '</text></svg>'
                }}
              />
              <div className="name">{card.name}</div>
            </div>
            <div className="back">
              <div className="sitio-logo">
                <div className="casa-icon">🏡</div>
                <div className="sitio-text">Sítio</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Painel de Configurações de Áudio com Alto Contraste */}
      {showAudioSettings && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', 
            padding: '2.5rem', borderRadius: '16px', maxWidth: '450px', width: '95%',
            border: '4px solid #000000',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
          }}>
            <h3 style={{
              color: '#000000', 
              marginBottom: '2rem', 
              textAlign: 'center', 
              fontSize: '1.5rem',
              fontWeight: '900',
              border: '2px solid #000000',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: '#FFD700'
            }}>
              🔧 Configurações de Áudio
            </h3>
            
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{
                display: 'block', 
                marginBottom: '0.8rem', 
                fontWeight: '800', 
                color: '#000000',
                fontSize: '1.1rem'
              }}>
                🔊 Volume dos Efeitos: <span style={{color: '#FF4500', fontWeight: '900'}}>{Math.round(audioEngine.sfxVolume * 100)}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={audioEngine.sfxVolume}
                onChange={(e) => audioEngine.sfxVolume = parseFloat(e.target.value)}
                style={{
                  width: '100%', 
                  height: '12px',
                  accentColor: '#FF4500',
                  border: '2px solid #000000',
                  borderRadius: '6px'
                }}
              />
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                fontWeight: '800', 
                color: '#000000', 
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '1rem',
                backgroundColor: audioEngine.musicEnabled ? '#90EE90' : '#FFB6C1',
                border: '2px solid #000000',
                borderRadius: '8px'
              }}>
                <input 
                  type="checkbox" 
                  checked={audioEngine.musicEnabled} 
                  onChange={(e) => audioEngine.musicEnabled = e.target.checked}
                  style={{
                    transform: 'scale(1.5)',
                    accentColor: '#FF4500'
                  }}
                />
                🎵 Ativar Efeitos Sonoros
              </label>
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                fontWeight: '800', 
                color: '#000000', 
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '1rem',
                backgroundColor: audioEngine.hapticEnabled ? '#90EE90' : '#FFB6C1',
                border: '2px solid #000000',
                borderRadius: '8px'
              }}>
                <input 
                  type="checkbox" 
                  checked={audioEngine.hapticEnabled} 
                  onChange={(e) => audioEngine.hapticEnabled = e.target.checked}
                  style={{
                    transform: 'scale(1.5)',
                    accentColor: '#FF4500'
                  }}
                />
                📳 Feedback Tátil (Vibração)
              </label>
            </div>
            
            <div style={{marginBottom: '2rem'}}>
              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                fontWeight: '800', 
                color: '#000000', 
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '1rem',
                backgroundColor: audioEngine.dynamicMusicEnabled ? '#90EE90' : '#FFB6C1',
                border: '2px solid #000000',
                borderRadius: '8px'
              }}>
                <input 
                  type="checkbox" 
                  checked={audioEngine.dynamicMusicEnabled} 
                  onChange={(e) => audioEngine.dynamicMusicEnabled = e.target.checked}
                  style={{
                    transform: 'scale(1.5)',
                    accentColor: '#FF4500'
                  }}
                />
                🎶 Música Reativa ao Jogo
              </label>
              <small style={{
                color: '#000000', 
                fontWeight: '600', 
                fontSize: '0.9rem', 
                marginLeft: '3rem', 
                display: 'block', 
                marginTop: '0.5rem',
                fontStyle: 'italic'
              }}>
                💡 A música muda conforme seu desempenho
              </small>
            </div>
            
            <div style={{textAlign: 'center'}}>
              <button 
                onClick={() => setShowAudioSettings(false)}
                style={{
                  padding: '1rem 2rem', 
                  backgroundColor: '#32CD32', 
                  color: '#000000', 
                  border: '3px solid #000000', 
                  borderRadius: '12px', 
                  fontWeight: '900',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  minHeight: '50px',
                  minWidth: '150px',
                  textShadow: 'none'
                }}
              >
                ✅ Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{margin: '1.5rem 0', display: 'flex', justifyContent: 'center'}}>
        <button 
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#FFD700',
            color: '#000000',
            border: '3px solid #000000',
            borderRadius: '12px',
            cursor: 'pointer',
            minHeight: '50px',
            fontWeight: '800',
            fontSize: '1.1rem',
            textShadow: 'none'
          }}
        >
          🏆 {showLeaderboard ? 'Ocultar' : 'Ver'} Ranking
        </button>
      </div>
      {showLeaderboard && (
        <Leaderboard 
          onClose={() => setShowLeaderboard(false)} 
          newScore={finished ? Math.max(0, score + streak * 2) : null}
          difficulty={difficulty}
          moves={moves}
          streak={streak}
        />
      )}
      <ThemeSelector currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
      
      <footer style={{
        textAlign: 'center', 
        margin: '2rem 0', 
        padding: '2rem 1rem',
        backgroundColor: '#FFFFFF',
        border: '3px solid #000000',
        borderRadius: '12px'
      }}>
        <div style={{
          color: '#000000',
          fontWeight: '900',
          fontSize: '1.1rem',
          margin: '1rem 0',
          textShadow: 'none'
        }}>
          ✨ Feito com ❤️ por uma equipe mágica do Sítio ✨
        </div>
        <div style={{
          lineHeight: '1.8',
          color: '#000000',
          fontWeight: '700',
          fontSize: '1rem'
        }}>
          👩‍🎨 Malie (Artista) • ⚡ Tauan (Mago) • 🧙‍♀️ Carla (Feiticeira) • 👵 Vovó Jane (Sábia)
        </div>
      </footer>
    </div>
  )
}
