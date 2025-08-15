import React, { useState, useEffect, useMemo } from 'react'
import './memory.css'
import * as Tone from 'tone'

// Prefer local images found in public/characters; fallback to DiceBear avatars on error
const avatar = (seed) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&radius=50&size=96`
const ALL_CHARACTERS = [
  { name:'Visconde de Sabugosa', img: '/characters/visconde.png' },
  { name:'Emília', img: '/characters/emilia.png' },
  { name:'Dona Benta', img: '/characters/dona_benta.png' },
  { name:'Tia Nastácia', img: '/characters/tia_nastacia.png' },
  { name:'Pedrinho', img: '/characters/pedrinho.png' },
  { name:'Narizinho', img: '/characters/narizinho.png' },
  { name:'Saci', img: '/characters/saci.png' },
  { name:'Cuca', img: '/characters/cuca.png' },
  { name:'Rabicó', img: '/characters/rabico.png' },
  { name:'Tio Barnabé', img: '/characters/barnabe.png' },
  { name:'Quindim', img: '/characters/quindim.png' },
  { name:'Conselheiro', img: '/characters/conselheiro.png' }
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

  const uniqueCount = useMemo(() => (
    difficulty === 'easy' ? 6 : difficulty === 'medium' ? 9 : 12
  ), [difficulty])

  useEffect(() => {
    const selected = ALL_CHARACTERS.slice(0, uniqueCount)
    const pairs = shuffle([...selected, ...selected])
    setCards(pairs)
    setFlipped([]); setMatched([]); setScore(0); setFinished(false)
    setStreak(0); setMoves(0); setShowCelebration(false)
  }, [uniqueCount])

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
    await Tone.start()
    let instrument = null
    try {
      const sampler = new Tone.Sampler({
        urls: { C4: 'C4.mp3', E4: 'E4.mp3', G4:'G4.mp3', C5:'C5.mp3', B4:'B4.mp3' },
        baseUrl: '/samples/guitar/'
      }).toDestination()
      instrument = sampler
      await sampler.loaded
    } catch {
      instrument = new Tone.PolySynth(Tone.Synth, { oscillator: { type:'square' } }).toDestination()
    }
    const reverb = new Tone.Reverb({ decay:2.2, wet:.2 }).toDestination()
    instrument.connect(reverb)
    const now = Tone.now()
    const seq = ['C4','E4','G4','C5','B4','G4','E4','C4']
    seq.forEach((n,i)=> instrument.triggerAttackRelease(n, '8n', now + i*0.2))
    setTimeout(()=>{ instrument.dispose?.(); reverb.dispose?.() }, 3000)
  }

  function onClickCard(i) {
    if (flipped.includes(i) || matched.includes(i)) return
    const next = [...flipped, i]
    setFlipped(next)
    setMoves(m => m + 1)
    
    if (next.length === 2) {
      const [a, b] = next
      if (cards[a].name === cards[b].name) {
        setMatched(prev => [...prev, a, b])
        const streakBonus = streak * 2
        const basePoints = 10 + streakBonus
        setScore(s => s + basePoints)
        setStreak(s => s + 1)
        playTone(['C4','E4','G4'], '16n')
        
        if (streak >= 2) {
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 1000)
        }
        
        setTimeout(() => setFlipped([]), 400)
      } else {
        setScore(s => Math.max(0, s - 2))
        setStreak(0)
        playTone(['D4','A3'], '16n')
        setTimeout(() => setFlipped([]), 800)
      }
    }
  }

  useEffect(() => {
    if (cards.length > 0 && matched.length === cards.length && !finished) {
      setFinished(true)
      setShowCelebration(true)
      playSitioSnippet()
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }, [matched, cards, finished])

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
        <button className={`small-btn ${difficulty==='medium'?'active':''}`} onClick={()=>setDifficulty('medium')}>Médio (9)</button>
        <button className={`small-btn ${difficulty==='hard'?'active':''}`} onClick={()=>setDifficulty('hard')}>Difícil (12)</button>
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
                onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src=`${avatar(c.name)}`}}
              />
              <span className="name">{c.name}</span>
            </div>
            <div className="back">?</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:'1rem'}}>
        <button className="small-btn" onClick={playSitioSnippet}>Tocar Trechinho</button>
      </div>
    </div>
  )
}
