import React, { useState, useEffect, useMemo } from 'react'
import './memory.css'
import './themes.css'
import './leaderboard.css'
import * as Tone from 'tone'
import Achievements from './Achievements'
import ThemeSelector from './ThemeSelector'
import Leaderboard from './Leaderboard'
import '../utils/achievements'

// Simplified iOS-compatible audio engine
class SimpleAudioEngine {
  constructor() {
    this.isInitialized = false
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    this.touchStarted = false
    this.musicEnabled = true
    this.audioContext = null
    this.isPlayingBackground = false
    
    console.log('🎵 Audio Engine - Mobile:', this.isMobile, 'iOS:', this.isIOS)
    
    // Simple sound effects without Tone.js dependencies
    this.sounds = {
      flip: () => this.playBeep(800, 0.1),
      match: () => this.playBeep(1200, 0.2),  
      miss: () => this.playBeep(400, 0.15),
      complete: () => this.playMelody([800, 1000, 1200, 1400], 0.1),
      achievement: () => this.playBeep(1600, 0.3)
    }
    
    // Setup audio initialization
    if (this.isIOS || this.isMobile) {
      this.setupMobileAudio()
    } else {
      this.initAudio()
    }
  }

  setupMobileAudio() {
    const initHandler = (e) => {
      if (!this.touchStarted) {
        console.log('🎵 Mobile audio unlocked by:', e.type)
        this.touchStarted = true
        this.initAudio()
        document.removeEventListener('touchstart', initHandler)
        document.removeEventListener('click', initHandler)
      }
    }
    document.addEventListener('touchstart', initHandler, { passive: true })
    document.addEventListener('click', initHandler)
  }

  async initAudio() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume()
        }
        this.isInitialized = true
        console.log('✅ Audio initialized successfully')
      }
    } catch (error) {
      console.warn('⚠️ Audio initialization failed:', error)
      this.isInitialized = false
    }
  }

  async playBeep(frequency, duration) {
    if (!this.musicEnabled || !this.isInitialized || !this.audioContext) {
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
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration)
      
      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  }

  async playMelody(frequencies, noteDuration) {
    if (!this.musicEnabled || !frequencies.length) return
    
    for (let i = 0; i < frequencies.length; i++) {
      setTimeout(() => this.playBeep(frequencies[i], noteDuration), i * noteDuration * 1000)
    }
  }

  // Simplified Sítio melody
  async playSitioMelody() {
    const melody = [523, 659, 784, 1047, 880, 698, 784, 659] // C4, E4, G4, C5, A4, F4, G4, E4
    await this.playMelody(melody, 0.4)
  }

  async startBackgroundMusic() {
    if (!this.musicEnabled || this.isPlayingBackground) return
    
    this.isPlayingBackground = true
    const playLoop = async () => {
      if (!this.isPlayingBackground) return
      await this.playSitioMelody()
      setTimeout(playLoop, 5000) // 5 second pause between loops
    }
    playLoop()
  }

  stopBackgroundMusic() {
    this.isPlayingBackground = false
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled
    if (!this.musicEnabled) {
      this.stopBackgroundMusic()
    }
    return this.musicEnabled
  }

  async play(soundName) {
    if (this.sounds[soundName]) {
      await this.sounds[soundName]()
    }
  }
}
        console.log('🎵 iOS audio initialization triggered by:', e.type)
        this.touchStarted = true
        events.forEach(event => document.removeEventListener(event, initHandler))
        await this.initializeIOSAudio()
      }
    }
    events.forEach(event => document.addEventListener(event, initHandler, { passive: true }))
  }

  createAudioElements() {
    const soundEffects = {
      flip: this.createTone(800, 0.1),
      match: this.createTone(1200, 0.2), 
      miss: this.createTone(400, 0.3),
      complete: this.createTone(1600, 0.5),
      achievement: this.createTone(2000, 0.4)
    }
    Object.entries(soundEffects).forEach(([key, audioData]) => {
      const audio = new Audio()
      audio.src = audioData
      audio.preload = 'auto'
      audio.volume = 0.3
      this.audioElements.set(key, audio)
    })
  }

  createTone(frequency, duration) {
    const sampleRate = 44100
    const samples = Math.floor(sampleRate * duration)
    const buffer = new ArrayBuffer(samples * 2)
    const view = new DataView(buffer)
    
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin((frequency * 2 * Math.PI * i) / sampleRate) * 0.3
      const intSample = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)))
      view.setInt16(i * 2, intSample, true)
    }
    
    const arrayBuffer = new ArrayBuffer(44 + buffer.byteLength)
    const view2 = new DataView(arrayBuffer)
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) view2.setUint8(offset + i, string.charCodeAt(i))
    }
    
    writeString(0, 'RIFF')
    view2.setUint32(4, 36 + buffer.byteLength, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view2.setUint32(16, 16, true)
    view2.setUint16(20, 1, true)
    view2.setUint16(22, 1, true)
    view2.setUint32(24, sampleRate, true)
    view2.setUint32(28, sampleRate * 2, true)
    view2.setUint16(32, 2, true)
    view2.setUint16(34, 16, true)
    writeString(36, 'data')
    view2.setUint32(40, buffer.byteLength, true)
    
    const audioData = new Uint8Array(buffer)
    const wavData = new Uint8Array(arrayBuffer, 44)
    wavData.set(audioData)
    
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' })
    return URL.createObjectURL(blob)
  }

  async initializeIOSAudio() {
    try {
      if (Tone.getContext().state === 'suspended') await Tone.start()
      this.masterVolume = new Tone.Volume(-6).toDestination()
      this.synth = new Tone.PolySynth(Tone.Synth).connect(this.masterVolume)
      this.bass = new Tone.MonoSynth().connect(this.masterVolume)
      this.isInitialized = true
      console.log('✅ iOS audio engine initialized')
    } catch (error) {
      console.warn('iOS audio init failed, using HTML5 audio:', error)
      this.isInitialized = true
    }
  }

  setupMobileInit() {
    const events = ['touchstart', 'click']
    const initHandler = async () => {
      if (!this.touchStarted) {
        this.touchStarted = true
        events.forEach(event => document.removeEventListener(event, initHandler))
        await this.init()
      }
    }
    events.forEach(event => document.addEventListener(event, initHandler, { passive: true }))
  }

  async init() {
    if (this.isInitialized) return
    try {
      if (Tone.getContext().state === 'suspended') await Tone.start()
      this.masterVolume = new Tone.Volume(-6).toDestination()
      this.synth = new Tone.PolySynth(Tone.Synth).connect(this.masterVolume)
      this.bass = new Tone.MonoSynth().connect(this.masterVolume)
      this.isInitialized = true
      console.log('✅ Audio engine initialized')
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      this.isInitialized = false
    }
  }

  async playSound(type, options = {}) {
    if (!this.musicEnabled) return
    try {
      if (this.isIOS && this.audioElements.has(type)) {
        const audio = this.audioElements.get(type)
        audio.currentTime = 0
        audio.volume = options.volume || 0.3
        await audio.play().catch(e => console.warn('HTML5 audio play failed:', e))
        return
      }
      
      if (!this.isInitialized || !this.synth) {
        console.warn('Audio not initialized, skipping sound:', type)
        return
      }
      
      const now = Tone.now()
      switch (type) {
        case 'flip':
          this.synth.triggerAttackRelease('C5', '16n', now)
          break
        case 'match':
          this.synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now)
          break
        case 'miss':
          this.bass.triggerAttackRelease('C3', '4n', now)
          break
        case 'complete':
          this.synth.triggerAttackRelease(['C5', 'E5', 'G5', 'C6'], '2n', now)
          break
        case 'achievement':
          this.synth.triggerAttackRelease(['F5', 'A5', 'C6'], '4n', now)
          break
      }
    } catch (error) {
      console.warn('Failed to play sound:', type, error)
    }
  }

  onCardFlip() { this.playSound('flip') }
  onCardMatch() { this.playSound('match') }
  onCardMiss() { this.playSound('miss') }
  onGameComplete() { this.playSound('complete') }
  onAchievementUnlocked() { this.playSound('achievement') }
  setMusicEnabled(enabled) { this.musicEnabled = enabled }

  // Tocar melodia temática do Sítio do Pica-Pau
  playSitioMelody() {
    if (!this.isInitialized || !this.synth) {
      console.warn('Audio not initialized for Sítio melody')
      return
    }

    console.log('🎵 Tocando melodia do Sítio do Pica-Pau!')
    
    // Parar música de fundo se estiver tocando
    if (this.backgroundMusic) {
      this.stopBackgroundMusic()
    }
    
    let currentTime = Tone.now()
    this.sitioMelody.forEach((noteData, index) => {
      this.synth.triggerAttackRelease(noteData.note, noteData.duration, currentTime)
      currentTime += Tone.Time(noteData.duration).toSeconds()
    })
  }

  // Música de fundo ambiente para o jogo
  startBackgroundMusic() {
    if (!this.isInitialized || !this.synth || this.isPlayingBackground) return
    
    try {
      this.isPlayingBackground = true
      const scale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
      
      this.backgroundMusic = new Tone.Loop((time) => {
        if (Math.random() > 0.8) {
          const note = scale[Math.floor(Math.random() * scale.length)]
          this.synth.triggerAttackRelease(note, '8n', time)
        }
      }, '2n')
      
      this.backgroundMusic.start()
      Tone.Transport.start()
      console.log('🎵 Música de fundo iniciada')
    } catch (error) {
      console.warn('Failed to start background music:', error)
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.stop()
        this.backgroundMusic.dispose()
        this.backgroundMusic = null
        this.isPlayingBackground = false
        Tone.Transport.stop()
        console.log('🛑 Música de fundo parada')
      } catch (error) {
        console.warn('Failed to stop background music:', error)
      }
    }
  }
}

// Prefer local images found in public/characters; NO fallback to avatars
const ALL_CHARACTERS = [
  { name:'Visconde de Sabugosa', img: './characters/visconde.png' },
  { name:'Emília', img: './characters/emilia.png' },
  { name:'Dona Benta', img: './characters/dona_benta.png' },
  { name:'Tia Nastácia', img: './characters/tia_nastacia.png' },
  { name:'Pedrinho', img: './characters/pedrinho.png' },
  { name:'Narizinho', img: './characters/narizinho.png' },
  { name:'Saci', img: './characters/saci.png' },
  { name:'Cuca', img: './characters/cuca.png' },
  { name:'Rabicó', img: './characters/rabico.png' },
  { name:'Tio Barnabé', img: './characters/barnabe.png' },
  { name:'Quindim', img: './characters/quindim.png' },
  { name:'Conselheiro', img: './characters/conselheiro.png' }
]

function shuffle(a) { return a.sort(() => Math.random() - 0.5) }

export default function MemoryGame() {
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem('memoryDifficulty') || 'easy')
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(() => parseInt(localStorage.getItem('bestStreak') || '0'))
  const [moves, setMoves] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showThemes, setShowThemes] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [gameStats, setGameStats] = useState(() => window.getStats ? window.getStats() : {})
  const [newScoreToSave, setNewScoreToSave] = useState(null)
  const [audioEngine, setAudioEngine] = useState(null)

  // Corrigir contagem de cartas por dificuldade
  const uniqueCount = useMemo(() => {
    switch(difficulty) {
      case 'easy': return 3    // 3 pares = 6 cartas
      case 'medium': return 6  // 6 pares = 12 cartas  
      case 'hard': return 12   // 12 pares = 24 cartas
      default: return 3
    }
  }, [difficulty])

  const restartGame = useCallback(() => {
    const selected = ALL_CHARACTERS.slice(0, uniqueCount)
    const pairs = shuffle([...selected, ...selected])
    setCards(pairs)
    setFlipped([])
    setMatched([])
    setScore(0)
    setFinished(false)
    setStreak(0)
    setMoves(0)
    setShowCelebration(false)
    setNewScoreToSave(null)
    console.log('🔄 Jogo reiniciado!')
  }, [uniqueCount])

  // Inicializar audio engine
  useEffect(() => {
    const engine = new SimpleAudioEngine()
    setAudioEngine(engine)
    engine.init()
    
    return () => {
      // Não dispose do engine pois é singleton
    }
  }, [])

  useEffect(() => {
    const selected = ALL_CHARACTERS.slice(0, uniqueCount)
    // Criar sempre pares duplicados para o jogo da memória
    const pairs = shuffle([...selected, ...selected]) // sempre pares
    setCards(pairs)
    setFlipped([]); setMatched([]); setScore(0); setFinished(false)
    setStreak(0); setMoves(0); setShowCelebration(false)
    setNewScoreToSave(null)
    
    // Atualizar música baseada na dificuldade
    if (audioEngine) {
      audioEngine.updateGameState({ difficulty, streak: 0, intensity: 0.3 })
    }
  }, [uniqueCount, difficulty, audioEngine])

  useEffect(() => {
    localStorage.setItem('memoryDifficulty', difficulty)
  }, [difficulty])

  useEffect(() => {
    if (streak > bestStreak) {
      setBestStreak(streak)
      localStorage.setItem('bestStreak', streak.toString())
    }
  }, [streak, bestStreak])

  async function playTone(note, duration='8n') {
    await Tone.start()
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.25 }
    }).toDestination()
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.2 }).toDestination()
    const delay = new Tone.FeedbackDelay('8n', 0.18).toDestination()
    synth.connect(reverb)
    synth.connect(delay)
    synth.triggerAttackRelease(note, duration)
    setTimeout(() => { synth.dispose(); reverb.dispose(); delay.dispose() }, 800)
  }

  async function playSitioSnippet() {
    if (audioEngine) {
      audioEngine.playSitioMelody()
    } else {
      console.warn('Audio engine not available')
    }
  }

  function onClickCard(i) {
    if (flipped.includes(i) || matched.includes(i)) return
    
    // Som de flip de carta
    if (audioEngine) {
      audioEngine.playCardFlip()
    }
    
    const next = [...flipped, i]
    setFlipped(next)
    setMoves(m => m + 1)
    
    if (next.length === 2) {
      const [a, b] = next
      
      // Para o modo hard (cartas únicas), não há matches
      const isMatch = difficulty === 'hard' ? false : cards[a].name === cards[b].name
      
      if (isMatch) {
        setMatched(prev => [...prev, a, b])
        const streakBonus = streak * 2
        const basePoints = 10 + streakBonus
        setScore(s => s + basePoints)
        setStreak(s => s + 1)
        
        // Som de match com intensidade baseada no streak
        if (audioEngine) {
          audioEngine.playMatch(streak + 1)
          audioEngine.updateGameState({ streak: streak + 1, intensity: Math.min((streak + 1) / 10, 1) })
        }
        
        if (streak >= 2) {
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 1000)
        }
        
        setTimeout(() => setFlipped([]), 400)
      } else {
        setScore(s => Math.max(0, s - 2))
        setStreak(0)
        
        // Som de erro
        if (audioEngine) {
          audioEngine.playMiss()
          audioEngine.updateGameState({ streak: 0, intensity: 0.2 })
        }
        
        setTimeout(() => setFlipped([]), 800)
      }
    }
  }

  useEffect(() => {
    // Total de cartas sempre será uniqueCount * 2 (pares)
    const totalCards = uniqueCount * 2
    
    if (cards.length > 0 && matched.length === totalCards && !finished) {
      setFinished(true)
      setShowCelebration(true)
      
      // Som épico de conclusão
      if (audioEngine) {
        audioEngine.playGameComplete(score, difficulty)
      }
      
      // Preparar para salvar score no leaderboard
      setNewScoreToSave(score)
      
      // Update achievements stats
      if (window.updateStats) {
        const stats = window.updateStats('gamesCompleted', 1)
        window.updateStats('bestMoves', moves, 'min')
        
        // Perfect game detection
        const perfectMoves = uniqueCount // Minimum possible moves
        if (moves === perfectMoves && difficulty === 'hard') {
          window.updateStats('perfectHardGames', 1)
        }
        
        // Update best streak
        if (streak > bestStreak) {
          setBestStreak(streak)
          localStorage.setItem('bestStreak', streak.toString())
          window.updateStats('bestStreak', streak, 'max')
        }
        
        setGameStats(stats)
      }
      
      setTimeout(() => {
        setShowCelebration(false)
        setShowLeaderboard(true) // Mostrar leaderboard automaticamente
      }, 3000)
    }
  }, [matched, cards, finished, moves, streak, bestStreak, difficulty, uniqueCount, score, audioEngine])

  return (
    <div className="memory-container">
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-text">
            {finished ? '🎉 Parabéns! Jogo concluído! 🎉' : `🔥 Combo ${streak}x! 🔥`}
          </div>
        </div>
      )}
      <h2 style={{color:'#f8fafc'}}>Jogo da Memória - Versão Virtual</h2>
      <div style={{display:'flex', gap:'.5rem', alignItems:'center', justifyContent:'center', marginBottom:'.5rem'}}>
        <span style={{color:'#e2e8f0', fontWeight:700}}>Dificuldade:</span>
        <button className={`small-btn ${difficulty==='easy'?'active':''}`} onClick={()=>setDifficulty('easy')}>Fácil (6)</button>
        <button className={`small-btn ${difficulty==='medium'?'active':''}`} onClick={()=>setDifficulty('medium')}>Médio (12)</button>
        <button className={`small-btn ${difficulty==='hard'?'active':''}`} onClick={()=>setDifficulty('hard')}>Difícil (24)</button>
      </div>
      
      <div style={{display:'flex', gap:'1rem', justifyContent:'center', marginBottom:'.75rem', flexWrap:'wrap'}}>
        <div style={{color:'#34d399', fontWeight:700}}>Pontuação: {score}</div>
        <div style={{color:'#fbbf24', fontWeight:700}}>Sequência: {streak}x</div>
        <div style={{color:'#a78bfa', fontWeight:700}}>Melhor: {bestStreak}x</div>
        <div style={{color:'#60a5fa', fontWeight:700}}>Movimentos: {moves}</div>
      </div>
      
      <div className="grid">
        {cards.map((c, i) => (
          <div key={i} className={`card ${flipped.includes(i) || matched.includes(i) ? 'flipped' : ''} ${matched.includes(i) ? 'matched' : ''}`} onClick={() => onClickCard(i)}>
            <div className="front">
              <img
                src={c.img}
                alt={c.name}
                loading="lazy"
                onError={(e)=>{
                  console.error('Erro ao carregar imagem:', c.img)
                  e.currentTarget.src = './characters/placeholder.svg'
                }}
              />
              <span className="name">{c.name}</span>
            </div>
            <div className="back">?</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:'1rem', display:'flex', gap:'0.5rem', justifyContent:'center', flexWrap:'wrap'}}>
        <button className="small-btn" onClick={restartGame}>🔄 Reiniciar</button>
        <button className="small-btn" onClick={playSitioSnippet}>🎵 Melodia</button>
        <button className="small-btn" onClick={() => {
          if (audioEngine) {
            if (audioEngine.isPlayingBackground) {
              audioEngine.stopBackgroundMusic()
            } else {
              audioEngine.startBackgroundMusic()
            }
          }
        }}>🎶 Música de Fundo</button>
        <button className="small-btn" onClick={() => setShowAchievements(true)}>🏆 Conquistas</button>
        <button className="small-btn" onClick={() => setShowThemes(true)}>🎨 Temas</button>
        <button className="small-btn" onClick={() => setShowLeaderboard(true)}>👑 Ranking</button>
      </div>
      
      {showAchievements && (
        <Achievements 
          stats={gameStats} 
          onClose={() => setShowAchievements(false)} 
        />
      )}
      
      {showThemes && (
        <ThemeSelector 
          onClose={() => setShowThemes(false)} 
        />
      )}
      
      {showLeaderboard && (
        <Leaderboard 
          onClose={() => {
            setShowLeaderboard(false)
            setNewScoreToSave(null)
          }}
          newScore={newScoreToSave}
          difficulty={difficulty}
          moves={moves}
          streak={streak}
        />
      )}
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        textAlign: 'center', 
        fontSize: '0.9rem', 
        color: 'var(--text-secondary)',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '2px dashed var(--primary)',
        animation: 'pulse 3s infinite'
      }}>
        🌟 <strong>Criado com muito amor e café por:</strong> 🌟<br/>
        👩‍💻 <em>Malie</em> (a feiticeira do código), 👨‍💻 <em>Tauan</em> (o domador de bugs), 
        👩‍🏫 <em>Carla</em> (a rainha dos testes) e 👵 <em>vovó Jane</em> (a guardiã das histórias)! 🎭<br/>
        <strong>🏫 Projeto para a Feira de Ciências do Colégio Meta - Sobradinho DF</strong><br/>
        <em>Onde a tecnologia encontra a magia do Sítio do Pica-Pau Amarelo! ✨🏡</em>
      </div>
    </div>
  )
}
