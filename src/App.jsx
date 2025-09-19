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
  const musicEngineRef = useRef(null)

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
  // mouse parallax for hero right panel
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const tiltX = useTransform(my, [0, 1], [-4, 4])
  const tiltY = useTransform(mx, [0, 1], [4, -4])

  // camera lifecycle
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
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } } })
          setVideoStream(stream)
          if (videoRef.current) videoRef.current.srcObject = stream
          const devices = await navigator.mediaDevices.enumerateDevices()
          const vids = devices.filter(d => d.kind === 'videoinput')
          setVideoDevices(vids)
          if (!selectedDeviceId && vids.length > 0) setSelectedDeviceId(vids[0].deviceId)
        } catch (e2) {
          alert({ title: 'Permissão da câmera', message: 'Erro ao acessar a câmera: ' + (err?.message || e2?.message), icon: '📷' })
        }
      }
    }
    if (cameraActive) startCamera()
    else {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
        setVideoStream(null)
      }
    }
    return () => { if (videoStream) videoStream.getTracks().forEach(track => track.stop()) }
  }, [cameraActive, selectedDeviceId, flipCamera, videoStream])

  // apply theme and listen system
  useEffect(() => {
    applyTheme(theme)
    const off = () => {}
    return off
  }, [theme])

  // flip
  useEffect(() => {
    if (videoRef.current) videoRef.current.style.transform = flipCamera ? 'scaleX(-1)' : 'none'
  }, [flipCamera])

  // Scroll progress indicator
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      const prog = total > 0 ? (doc.scrollTop / total) : 0
      setScrollProgress(Math.max(0, Math.min(1, prog)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // turn off camera/mic when leaving vision tab
  useEffect(() => {
    if (view !== 'vision') {
      if (cameraActive) setCameraActive(false)
      if (microphoneActive) setMicrophoneActive(false)
    }
  }, [view, cameraActive, microphoneActive])

  // Show difficulty modal on first visit
  useEffect(() => {
    const seen = localStorage.getItem('seenDifficultyModal')
    if (!seen) setShowDifficultyModal(true)
  }, [])

  // Close modals with Escape for better accessibility
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showDifficultyModal) { setShowDifficultyModal(false); localStorage.setItem('seenDifficultyModal','1') }
        if (showAboutModal) setShowAboutModal(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showDifficultyModal, showAboutModal])

  // Navegação via evento do jogo
  useEffect(() => {
    const handler = (e) => {
      const next = e?.detail
      if (next === 'vision') setView('vision')
      if (next === 'game') setView('game')
    }
    window.addEventListener('sitio:navigate', handler)
    return () => window.removeEventListener('sitio:navigate', handler)
  }, [])

  // AI via Web Worker (init and messages)
  const aiWorkerRef = useRef(null)
  const [aiReady, setAiReady] = useState(false)
  const [lowLight, setLowLight] = useState(false)
  const lowLightRef = useRef(0)
  useEffect(() => {
  if (!useAI || aiReady) return
    // Ensure the worker path works in production (GitHub Pages subpath)
    const workerUrl = `${import.meta.env.BASE_URL || '/'}aiWorker.js`
    aiWorkerRef.current = new Worker(workerUrl)
    aiWorkerRef.current.onmessage = (e) => {
      const { type, embedding, norm, templateIndex, matches } = e.data
      switch (type) {
        case 'AI_READY':
          setAiReady(true)
          break
        case 'EMBEDDING_READY':
          if (templateIndex !== undefined && templatesRef.current[templateIndex]) {
            templatesRef.current[templateIndex].embedding = embedding
            templatesRef.current[templateIndex].embeddingNorm = norm
          }
          break
        case 'SIMILARITY_READY':
          if (matches && matches.length > 0) {
            const detectedIndices = matches.map(m => m.index)
            setDetectedCards(detectedIndices)
          } else {
            setDetectedCards([])
          }
          break
        default:
          break
      }
    }
  // Dispara inicialização da IA
  try { aiWorkerRef.current.postMessage({ type: 'INIT_AI' }) } catch { /* noop */ }
  }, [cameraActive, useAI, aiReady])

  // Draw video to canvas and periodically ask AI worker to compare similarity
  useEffect(() => {
    if (!cameraActive) return
    let rafId = null
    let lastEmbedding = 0
  let lowLightCounter = lowLightRef.current || 0
    const step = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas) {
        const ctx = canvas.getContext('2d')
        const { videoWidth, videoHeight } = video
        if (videoWidth && videoHeight) {
          canvas.width = 480
          canvas.height = Math.round((videoHeight / videoWidth) * 480)
          // Mirror if needed
          ctx.save()
          if (flipCamera) { ctx.scale(-1, 1); ctx.translate(-canvas.width, 0) }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          ctx.restore()
          // Dica de baixa iluminação
          try {
            const s = 16
            const img = ctx.getImageData(Math.max(0, Math.floor(canvas.width/2 - s/2)), Math.max(0, Math.floor(canvas.height/2 - s/2)), s, s)
            let sum = 0
            for (let i=0;i<img.data.length;i+=4) sum += img.data[i] + img.data[i+1] + img.data[i+2]
            const avg = sum / (img.data.length/4) / 3
            if (avg < 40) lowLightCounter = Math.min(lowLightCounter+1, 60)
            else lowLightCounter = Math.max(lowLightCounter-1, 0)
            if (lowLightCounter > 12 && !lowLight) setLowLight(true)
            if (lowLightCounter < 6 && lowLight) setLowLight(false)
            lowLightRef.current = lowLightCounter
          } catch { /* ignore low-light sampling errors */ }
          // Periodically run AI similarity on center crop
          const now = performance.now()
          if (useAI && aiWorkerRef.current && aiReady && now - lastEmbedding > 350) {
            lastEmbedding = now
            try {
              const w = 128, h = 128
              const sx = Math.floor((canvas.width - w) / 2)
              const sy = Math.floor((canvas.height - h) / 2)
              const cropData = ctx.getImageData(sx, sy, w, h)
              if (templatesRef.current.length > 0) {
                aiWorkerRef.current.postMessage({
                  type: 'COMPARE_SIMILARITY',
                  imageData: cropData,
                  templates: templatesRef.current.filter(t => t.embedding && t.embeddingNorm)
                })
              }
            } catch {
              // AI processing error ignored to keep UI responsive
            }
          }
        }
      }
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => { if (rafId) cancelAnimationFrame(rafId) }
  }, [cameraActive, useAI, aiReady, flipCamera, lowLight])

  // Procedural music engine
  useEffect(() => {
  const ENGINE = {
    ctxStarted: false,
  Tone: null,
  Soundfont: null,
    parts: {},
      tempo: 85, // andamento mais suave e rural
      key: 'G',
      scale: ['G','A','B','C','D','E','F#'], // sol maior, tom caipira
      state: 'exploration',
      loop: null,
      melodyPart: null,
      percussionPart: null,
      victoryPart: null,
    sf: { viola: null, flauta: null, harmonica: null },
    isPlaying: false,
    isReady: false,
      
      setup: async () => {
        if (!ENGINE.Tone) {
          ENGINE.Tone = await import('tone')
        }
        if (!ENGINE.Soundfont) {
          try {
            const mod = await import('soundfont-player')
            ENGINE.Soundfont = mod.default
          } catch { /* noop */ }
        }
        // Do not auto-start context here; defer to a user gesture via ensureStart/start
        try { ENGINE.ctxStarted = ENGINE.Tone.getContext().state === 'running' } catch { ENGINE.ctxStarted = false }
        
        // === EQUALIZAÇÃO PARA SONORIDADE RURAL BRASILEIRA ===
        // Filtro passa-baixas para suavizar e dar caráter orgânico
  const warmFilter = new ENGINE.Tone.Filter({
          frequency: 3000,
          type: "lowpass",
          rolloff: -12
        }).toDestination()
        
        // EQ de 3 bandas com boost nos graves e médios
  const ruralEQ = new ENGINE.Tone.EQ3({
          low: 4,      // realça o calor dos graves
          mid: 3,      // presença dos instrumentos melódicos  
          high: -1     // suaviza agudos para soar orgânico
        }).connect(warmFilter)
        
        // Compressor sutil para coesão dinâmica
  const gentleComp = new ENGINE.Tone.Compressor({
          threshold: -18,
          ratio: 3,
          attack: 0.1,
          release: 0.8
        }).connect(ruralEQ)
        
        // === INSTRUMENTOS TÍPICOS DO SÍTIO ===
        
        // VIOLA CAIPIRA (timbre de cordas dedilhadas)
  ENGINE.parts.viola = new ENGINE.Tone.PolySynth(ENGINE.Tone.Synth, {
          oscillator: { 
            type: 'triangle',
            modulationType: 'sine',
            modulationFrequency: 0.2 // vibrato sutil
          },
          envelope: { attack: 0.02, decay: 0.4, sustain: 0.6, release: 1.5 },
          filter: { frequency: 1500, rolloff: -12 }
        }).connect(gentleComp)
        ENGINE.parts.viola.volume.value = -10
        
        // BAIXO ACÚSTICO (contrabaixo rural)
  ENGINE.parts.baixo = new ENGINE.Tone.MonoSynth({
          oscillator: { type: 'triangle' },
          filter: { Q: 2, type: 'lowpass', rolloff: -24, frequency: 250 },
          envelope: { attack: 0.08, decay: 0.6, sustain: 0.4, release: 2.0 }
        }).connect(gentleComp)
        ENGINE.parts.baixo.volume.value = -8
        
        // PANDEIRO (percussão brasileira suave)
  ENGINE.parts.pandeiro = new ENGINE.Tone.NoiseSynth({
          noise: { type: 'pink' },
          envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.03 },
          filter: { frequency: 600, rolloff: -12 }
        }).connect(gentleComp)
        ENGINE.parts.pandeiro.volume.value = -20
        
        // TRIÂNGULO (brilho metálico sutil)
  ENGINE.parts.triangulo = new ENGINE.Tone.MetalSynth({
          frequency: 400,
          envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.4 },
          harmonicity: 8,
          modulationIndex: 12,
          resonance: 1200
        }).connect(gentleComp)
        ENGINE.parts.triangulo.volume.value = -24
        
        // FLAUTA DOCE (melodias pastorais)
  ENGINE.parts.flauta = new ENGINE.Tone.Synth({
          oscillator: { 
            type: 'sine',
            modulationType: 'sine', 
            modulationFrequency: 0.5 // vibrato suave
          },
          envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 1.2 },
          filter: { frequency: 2200, rolloff: -6 }
        }).connect(gentleComp)
        ENGINE.parts.flauta.volume.value = -12
        
        // === TIMBRES ORGÂNICOS VIA SOUNDFONT ===
        try {
          const ac = ENGINE.Tone.getContext().rawContext
          if (ENGINE.Soundfont) {
            // Instrumentos típicos do interior brasileiro
            ENGINE.sf.viola = await ENGINE.Soundfont.instrument(ac, 'acoustic_guitar_nylon')
            ENGINE.sf.flauta = await ENGINE.Soundfont.instrument(ac, 'flute')
            ENGINE.sf.harmonica = await ENGINE.Soundfont.instrument(ac, 'harmonica')
            ENGINE.sf.accordion = await ENGINE.Soundfont.instrument(ac, 'accordion')
            ENGINE.sf.violao = await ENGINE.Soundfont.instrument(ac, 'acoustic_guitar_steel')
          }
  } catch {
          console.log('🎵 Timbres do Sítio: usando sintetizadores como fallback')
        }
        
        // === EFEITOS AMBIENTAIS DO SÍTIO ===
        // Reverb suave simulando ambiente aberto do sítio
  const sitioReverb = new ENGINE.Tone.Reverb({
          roomSize: 0.6,
          dampening: 3000,
          wet: 0.15 // reverb sutil
        }).connect(gentleComp)
        
        // Delay sutil para simular eco natural
  const rusticDelay = new ENGINE.Tone.FeedbackDelay({
          delayTime: "8n",
          feedback: 0.2,
          wet: 0.08
        }).connect(sitioReverb)
        
        // Conecta instrumentos principais ao ambiente
        ENGINE.parts.flauta.connect(rusticDelay)
        ENGINE.parts.viola.connect(sitioReverb)
        
  ENGINE.Tone.Transport.bpm.value = ENGINE.tempo
      },
      
      pickState: (next, context = {}) => {
        const states = {
          // EXPLORAÇÃO: Toada suave do sítio (violão e baixo)
          exploration: { 
            tempo: [80, 88], 
            layers: ['viola', 'baixo'], 
            progression: ['I', 'vi', 'IV', 'V'], // progressão caipira clássica
            feel: 'toada',
            swing: 0.1 // leve balanço brasileiro
          },
          
          // CONCENTRAÇÃO: Moda de viola contemplativa (+ flauta melódica)  
          puzzle: { 
            tempo: [75, 82], 
            layers: ['viola', 'baixo', 'flauta'], 
            progression: ['I', 'V/vi', 'vi', 'IV'], // cadência modal brasileira
            feel: 'moda',
            swing: 0.05 // mais linear para concentração
          },
          
          // AÇÃO: Baião animado do interior (full band)
          action: { 
            tempo: [88, 96], 
            layers: ['viola', 'baixo', 'pandeiro', 'triangulo'], 
            progression: ['I', 'bVII', 'IV', 'I'], // progressão nordestina
            feel: 'baiao',
            swing: 0.15 // balanço característico do baião
          },

          // VITÓRIA: Celebração rural brasileira completa
          victory: {
            tempo: [95, 105],
            layers: ['viola', 'baixo', 'pandeiro', 'triangulo', 'flauta'],
            progression: ['I', 'V', 'vi', 'IV', 'I', 'V', 'I'], // progressão triunfal expandida
            feel: 'festa',
            swing: 0.2 // máximo balanço celebrativo
          },

          // TENSÃO: Para o último par (minimalista e suspense)
          tension: {
            tempo: [70, 75],
            layers: ['viola'], // apenas viola, bem sutil
            progression: ['vi', 'V/vi', 'vi'], // progressão modal suspensiva
            feel: 'suspense',
            swing: 0.02
          },

          // RESET: Tema de início/renovação
          reset: {
            tempo: [78, 85],
            layers: ['flauta', 'baixo'], // combinação suave e acolhedora
            progression: ['I', 'vi', 'IV', 'V'], 
            feel: 'renovacao',
            swing: 0.08
          }
        }
        
        // Ajuste dinâmico baseado na dificuldade e contexto
        const s = states[next] || states.exploration
        if (context.difficulty) {
          switch (context.difficulty) {
            case 'hard':
              s.tempo = [s.tempo[0] + 8, s.tempo[1] + 12] // mais rápido
              if (s.layers.length < 4) s.layers.push('triangulo')
              break
            case 'medium':
              s.tempo = [s.tempo[0] + 3, s.tempo[1] + 5] // ligeiramente mais rápido
              break
            // easy mantém o tempo base
          }
        }
        
        // Ajuste dinâmico baseado no streak
        if (context.streak) {
          const streakBonus = Math.min(context.streak * 2, 15) // máximo +15 BPM
          s.tempo = [s.tempo[0] + streakBonus, s.tempo[1] + streakBonus]
        }

        ENGINE.state = next
        ENGINE.tempo = Math.round((s.tempo[0] + s.tempo[1]) / 2)
  ENGINE.Tone.Transport.bpm.rampTo(ENGINE.tempo, next === 'victory' ? 2.0 : 1.0)
  ENGINE.Tone.Transport.swing = s.swing
        return s
      },
      
      note: (deg, octave=3) => {
        const scale = ENGINE.scale
        const map = {1:0,2:1,3:2,4:3,5:4,6:5,7:6}
        const idx = map[deg] ?? 0
        const n = scale[idx]
        return `${n}${octave}`
      },
      
      chord: (roman, octave=4) => {
        const degMap = { 
          I:[1,3,5], vi:[6,1,3], IV:[4,6,1], V:[5,7,2],
          'V/vi':[2,4,6], bVII:[7,2,4], // acordes modais brasileiros
          II7:[2,4,6,1], V7:[5,7,2,4], VI7:[6,1,3,5] 
        }
        const degrees = degMap[roman] || [1,3,5]
        return degrees.map((d)=>ENGINE.note(((d-1)%7)+1, octave))
      },
      
      ensureStart: async () => {
        if (!ENGINE.Tone) ENGINE.Tone = await import('tone')
        try {
          if (ENGINE.Tone.getContext().state === 'suspended') {
            await ENGINE.Tone.start()
          }
          ENGINE.ctxStarted = true
          ENGINE.isReady = true
        } catch { /* failed to unlock */ }
      },
      start: async (which='exploration', context = {}) => {
        await ENGINE.setup()
        // Ensure context started (ideally after a click)
        try { if (ENGINE.Tone.getContext().state === 'suspended') { await ENGINE.Tone.start(); ENGINE.ctxStarted = true } } catch { /* noop */ }
        const s = ENGINE.pickState(which, context)
        if (ENGINE.loop) { ENGINE.loop.dispose(); ENGINE.loop = null }
        if (ENGINE.percussionPart) { ENGINE.percussionPart.dispose(); ENGINE.percussionPart = null }
        if (ENGINE.victoryPart) { ENGINE.victoryPart.dispose(); ENGINE.victoryPart = null }
        
        let bar = 0
        
        // === LOOP PRINCIPAL COM PADRÕES BRASILEIROS ===
  ENGINE.loop = new ENGINE.Tone.Loop((time) => {
          const progStep = bar % s.progression.length
          const chord = ENGINE.chord(s.progression[progStep], 4)
          const bassNote = chord[0].replace(/\d+$/, '2') // baixo uma oitava abaixo
          
          // VIOLA CAIPIRA - Padrão dedilhado brasileiro
          if (s.layers.includes('viola')) {
            const violaPattern = s.feel === 'baiao' 
              ? [0, 0.75, 1.5, 2, 2.75, 3.5]           // padrão nordestino
              : [0, 0.5, 1.0, 1.5, 2.5, 3.0, 3.5]     // toada/moda caipira
              
            violaPattern.forEach((beat, i) => {
              const when = time + beat
              const noteIndex = Math.floor(beat / 2) % chord.length // alterna entre notas do acorde
              const note = chord[noteIndex]
              
              // Técnica de "batida" característica do violão brasileiro
              const isDownstroke = i % 2 === 0
              const velocity = isDownstroke ? 0.5 : 0.3
              const strum = isDownstroke ? 0 : 0.02 // ligeiro atraso no upstroke
              
              // Ajuste dinâmico de volume para diferentes estados
              let dynamicVelocity = velocity
              if (s.feel === 'festa') dynamicVelocity *= 1.3 // vitória mais forte
              if (s.feel === 'suspense') dynamicVelocity *= 0.4 // tensão mais suave
              
              if (ENGINE.sf.viola) {
                ENGINE.sf.viola.play(note, ENGINE.Tone.now() + beat + strum, { 
                  duration: s.feel === 'moda' ? 0.4 : 0.25, 
                  gain: dynamicVelocity + Math.sin(bar * 0.5) * 0.05 // respiração musical
                })
              } else {
                ENGINE.parts.viola.triggerAttackRelease(note, '8n', when + strum)
              }
            })
          }
          
          // BAIXO ACÚSTICO - Linha de baixo estilo brasileiro
          if (s.layers.includes('baixo')) {
            let bassPattern
            switch(s.feel) {
              case 'baiao':
              case 'festa': // vitória usa padrão de baião intensificado
                bassPattern = [
                  { beat: 0, note: bassNote, duration: '4n' },
                  { beat: 1, note: chord[2].replace(/\d+$/, '2'), duration: '8n' }, // terça no baixo
                  { beat: 2.5, note: bassNote, duration: '8n' },
                  { beat: 3.5, note: chord[1].replace(/\d+$/, '2'), duration: '8n' }  // quinta
                ]
                if (s.feel === 'festa') {
                  // Adiciona mais subdivisões para celebração
                  bassPattern.push({ beat: 1.5, note: chord[1].replace(/\d+$/, '2'), duration: '16n' })
                }
                break
              case 'moda':
                bassPattern = [
                  { beat: 0, note: bassNote, duration: '2n' },                        // fundamental longa
                  { beat: 2, note: chord[2].replace(/\d+$/, '2'), duration: '4n' }    // terça
                ]
                break
              case 'suspense':
                // Padrão bem minimalista para tensão
                bassPattern = [
                  { beat: 0, note: bassNote, duration: '1n' } // uma nota por compasso
                ]
                break
              case 'renovacao':
                // Padrão suave para reset
                bassPattern = [
                  { beat: 0, note: bassNote, duration: '2n.' },
                  { beat: 3, note: chord[2].replace(/\d+$/, '2'), duration: '4n' }
                ]
                break
              default: // toada
                bassPattern = [
                  { beat: 0, note: bassNote, duration: '4n' },
                  { beat: 2, note: bassNote, duration: '4n' }
                ]
            }
            
            bassPattern.forEach(({ beat, note, duration }) => {
              // Micro swing brasileiro no baixo
              const swingOffset = (beat % 1 !== 0) ? 0.03 : 0
              ENGINE.parts.baixo.triggerAttackRelease(note, duration, time + beat + swingOffset)
            })
          }
          
          // PANDEIRO - Ritmo brasileiro característico  
          if (s.layers.includes('pandeiro')) {
            let pandeiroHits = [0, 0.75, 1.25, 2, 2.75, 3.5] // ritmo de pandeiro base
            
            // Intensifica para vitória
            if (s.feel === 'festa') {
              pandeiroHits = [0, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75]
            }
            
            pandeiroHits.forEach(beat => {
              const accent = beat % 2 === 0 ? 0.6 : 0.3 // acentos fortes e fracos
              const finalAccent = s.feel === 'festa' ? accent * 1.4 : accent
              ENGINE.parts.pandeiro.triggerAttackRelease('16n', time + beat)
              ENGINE.parts.pandeiro.volume.rampTo(-20 + (finalAccent * 4), 0.01)
            })
          }
          
          // TRIÂNGULO - Brilho metálico nas subdivisões
          if (s.layers.includes('triangulo')) {
            let trianguloHits = [0.5, 1.5, 2.5, 3.5] // contratempos base
            
            // Mais ativo na vitória
            if (s.feel === 'festa') {
              trianguloHits = [0.25, 0.5, 0.75, 1.25, 1.5, 1.75, 2.25, 2.5, 2.75, 3.25, 3.5, 3.75]
            }
            
            trianguloHits.forEach(beat => {
              const pitch = s.feel === 'festa' ? ['C6', 'D6', 'E6'][Math.floor(Math.random() * 3)] : 'C6'
              ENGINE.parts.triangulo.triggerAttackRelease(pitch, '32n', time + beat)
            })
          }
          
          // FLAUTA - Harmonia suave para concentração
          if (s.layers.includes('flauta')) {
            let fluteCondition = bar % 2 === 0 // toca a cada dois compassos por padrão
            
            // Comportamentos especiais por estado
            if (s.feel === 'festa') fluteCondition = true // sempre toca na vitória
            if (s.feel === 'suspense') fluteCondition = bar % 4 === 0 // bem espaçado na tensão
            if (s.feel === 'renovacao') fluteCondition = bar % 3 === 0 // padrão ternário suave
            
            if (fluteCondition) {
              const fluteMelody = chord.slice(0, 3) // tríade
              fluteMelody.forEach((note, i) => {
                const when = time + i * 0.5
                let noteHigh = note.replace(/\d+$/, '5') // oitava aguda
                
                // Variações melódicas por estado
                if (s.feel === 'festa' && Math.random() > 0.5) {
                  noteHigh = note.replace(/\d+$/, '6') // ainda mais agudo na festa
                }
                if (s.feel === 'suspense') {
                  noteHigh = note.replace(/\d+$/, '4') // mais grave na tensão
                }
                
                const gain = s.feel === 'festa' ? 0.5 : s.feel === 'suspense' ? 0.2 : 0.35
                
                if (ENGINE.sf.flauta) {
                  ENGINE.sf.flauta.play(noteHigh, ENGINE.Tone.now() + i * 0.5, { 
                    duration: 0.8, 
                    gain 
                  })
                } else {
                  ENGINE.parts.flauta.triggerAttackRelease(noteHigh, '2n', when)
                }
              })
            }
          }
          
          bar++
  }, '1m') // compasso de 4/4
        
    ENGINE.loop.start(0)
  try { if (ENGINE.Tone.getContext().state === 'running') ENGINE.Tone.Transport.start() } catch { /* noop */ }
    ENGINE.isPlaying = true
      },

      // Melodia especial de vitória
      playVictoryMelody: () => {
  if (ENGINE.victoryPart) { ENGINE.victoryPart.dispose(); ENGINE.victoryPart = null }
        
        // Melodia triunfal inspirada em "Parabéns pra Você" e festa junina
        const victoryMotif = [
          1, 1, 2, 1, 4, 3,  // "Parabéns pra você"
          1, 1, 2, 1, 5, 4,  // "Nesta data querida"  
          1, 1, 8, 6, 4, 3, 2, // "Muitas felicidades"
          7, 7, 6, 4, 5, 4     // "Muitos anos de vida"
        ]
        
        ENGINE.victoryPart = new ENGINE.Tone.Part((time, note) => {
          const noteStr = ENGINE.note(note.deg, 5) // oitava celebrativa
          
          // Harmonização com acordes
          const harmNotes = [
            ENGINE.note(note.deg, 4),           // fundamental
            ENGINE.note(((note.deg + 1) % 7) + 1, 4), // segunda
            ENGINE.note(((note.deg + 3) % 7) + 1, 4)  // terça harmônica
          ]
          
          if (ENGINE.sf.flauta) {
            ENGINE.sf.flauta.play(noteStr, time, { duration: 0.6, gain: 0.6 })
          } else {
            ENGINE.parts.flauta.triggerAttackRelease(noteStr, '4n', time)
          }
          
          // Harmonia na viola
          if (ENGINE.sf.viola) {
            harmNotes.forEach((harmNote, i) => {
              ENGINE.sf.viola.play(harmNote, time + i * 0.02, { duration: 0.4, gain: 0.3 })
            })
          }
          
        }, victoryMotif.map((deg, i) => ({ 
          time: `0:${Math.floor(i * 0.75)}:${(i % 2) * 2}`, 
          deg 
        })))
        
        ENGINE.victoryPart.start('+0.5m')
        ENGINE.victoryPart.stop('+8m')
      },
      playMelodyMotif: () => {
        // === MELODIA INSPIRADA NO SÍTIO DO PICA-PAU AMARELO ===
        // Motivo melódico com caráter caipira/infantil brasileiro
        const sitioMotif = [
          1, 3, 5, 6,    // "Sítio do Pica-Pau" (ascendente alegre)
          5, 3, 2, 1,    // "Amarelo" (descendente suave) 
          4, 5, 6, 5,    // "Onde a imaginação" (ondulante)
          3, 2, 1        // "Vai brincar" (resolução)
        ]
        
        // Ritmo brasileiro com síncope característica
        const sitioRhythm = [
          '4n', '8n', '4n', '8n',     // início marcado
          '4n', '8n', '8n', '4n',     // balanço
          '8n', '8n', '4n', '8n',     // síncope  
          '4n', '8n', '2n'            // resolução longa
        ]
        
        if (ENGINE.melodyPart) { ENGINE.melodyPart.dispose(); ENGINE.melodyPart = null }
        
        let phraseIndex = 0
        const melodyVariations = [
          { transpose: 0, octave: 5, instrument: 'flauta' },    // frase original na flauta
          { transpose: 2, octave: 4, instrument: 'viola' },     // variação na viola  
          { transpose: 5, octave: 5, instrument: 'harmonica' }, // harmônica mais aguda
          { transpose: 0, octave: 6, instrument: 'flauta' }     // flauta oitava acima
        ]
        
  ENGINE.melodyPart = new ENGINE.Tone.Part((time, step) => {
          const { deg, dur, off, beatIndex } = step
          const variation = melodyVariations[phraseIndex % melodyVariations.length]
          
          // Aplica transposição modal brasileira
          const transposedDeg = ((deg + variation.transpose - 1) % 7) + 1
          const note = ENGINE.note(transposedDeg, variation.octave)
          const when = time + (off || 0)
          
          // Expressividade brasileira: acentos e ornamentos
          const accent = beatIndex % 4 === 0 ? 1.2 : (beatIndex % 2 === 1 ? 0.8 : 1.0)
          const swing = ENGINE.state === 'action' ? 0.05 : 0.02 // micro timing brasileiro
          
          // Escolhe instrumento baseado na variação
          if (variation.instrument === 'flauta' && ENGINE.sf.flauta) {
            ENGINE.sf.flauta.play(note, ENGINE.Tone.now() + (off || 0) + swing, { 
              duration: dur === '2n' ? 1.5 : (dur === '4n' ? 0.6 : 0.3), 
              gain: 0.5 * accent 
            })
          } else if (variation.instrument === 'harmonica' && ENGINE.sf.harmonica) {
            ENGINE.sf.harmonica.play(note, ENGINE.Tone.now() + (off || 0) + swing, { 
              duration: dur === '2n' ? 1.2 : (dur === '4n' ? 0.5 : 0.25), 
              gain: 0.4 * accent 
            })
          } else if (variation.instrument === 'viola' && ENGINE.sf.viola) {
            ENGINE.sf.viola.play(note, ENGINE.Tone.now() + (off || 0) + swing, { 
              duration: dur === '2n' ? 0.8 : (dur === '4n' ? 0.4 : 0.2), 
              gain: 0.45 * accent 
            })
          } else {
            // Fallback para sintetizadores
            ENGINE.parts.flauta.triggerAttackRelease(note, dur, when + swing)
          }
          
        }, sitioMotif.map((deg, i) => ({ 
          time: `0:${Math.floor(i * 0.5)}:${(i % 2) * 2}`, // timing com balanço brasileiro
          deg, 
          dur: sitioRhythm[i] || '8n', 
          off: 0,
          beatIndex: i
        })))
        
        ENGINE.melodyPart.loop = true
        ENGINE.melodyPart.loopEnd = '8m' // frases mais longas
        ENGINE.melodyPart.start('+1m') // entra após estabelecer o ritmo
        
        // Variação de frases a cada ciclo
        const phraseChanger = new ENGINE.Tone.Loop(() => { 
          phraseIndex++
          // A cada 4 frases, muda o estado musical sutilmente  
          if (phraseIndex % 4 === 0) {
            const currentTempo = ENGINE.Tone.Transport.bpm.value
            const tempoVariation = 2 + Math.sin(phraseIndex * 0.3) * 3
            ENGINE.Tone.Transport.bpm.rampTo(currentTempo + tempoVariation, 2)
          }
        }, '8m')
        phraseChanger.start('+1m')
      },
      
      stop: () => {
        if (ENGINE.loop) { ENGINE.loop.stop(); ENGINE.loop.dispose(); ENGINE.loop = null }
        if (ENGINE.melodyPart) { ENGINE.melodyPart.stop(); ENGINE.melodyPart.dispose(); ENGINE.melodyPart = null }
        if (ENGINE.percussionPart) { ENGINE.percussionPart.stop(); ENGINE.percussionPart.dispose(); ENGINE.percussionPart = null }
        if (ENGINE.victoryPart) { ENGINE.victoryPart.stop(); ENGINE.victoryPart.dispose(); ENGINE.victoryPart = null }
        if (ENGINE.Tone) {
          ENGINE.Tone.Transport.swing = 0
          try { ENGINE.Tone.Transport.stop() } catch { /* noop */ }
        }
        ENGINE.isPlaying = false
      }
    }
    musicEngineRef.current = ENGINE
    window.sitioMusicEngine = ENGINE
  return () => { ENGINE.stop() }
  }, [])

  useEffect(() => {
    const engine = musicEngineRef.current
    if (!engine) return
    if (musicPlaying) { 
      (async () => { 
        await engine.start('exploration')
        engine.playMelodyMotif() 
      })()
    }
    else engine.stop()
  }, [musicPlaying])

  // capture template
  function captureTemplate() {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const w = 80, h = 80
    const x = Math.floor((canvasRef.current.width - w)/2)
    const y = Math.floor((canvasRef.current.height - h)/2)
    const data = ctx.getImageData(x, y, w, h)
    const tpl = { data: data.data, width: w, height: h, timestamp: Date.now() }
    if (useAI && aiWorkerRef.current && aiReady) {
      aiWorkerRef.current.postMessage({ type: 'EXTRACT_EMBEDDING', imageData: data, templateIndex: templatesRef.current.length })
    }
    templatesRef.current.push(tpl)
    if (window.updateStats) { window.updateStats('templatesCaptured', 1); window.updateStats('usedAI', true, 'flag') }
  alert({ title: 'Template capturado', message: 'Agora a detecção usa esse padrão.', icon: '✨' })
  }

  // take snapshot
  function takeSnapshot() {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (flipCamera) { ctx.scale(-1, 1); ctx.translate(-canvas.width, 0) }
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    if (useAI && aiWorkerRef.current && aiReady) {
      aiWorkerRef.current.postMessage({ type: 'EXTRACT_EMBEDDING', imageData })
    }
    const snapshot = { image: canvas.toDataURL(), timestamp: Date.now() }
    setSnapshots(prev => [snapshot, ...prev].slice(0, 5))
    if (window.updateStats) { window.updateStats('photosTaken', 1); window.updateStats('usedCamera', true, 'flag') }
  }

  // UI
  return (
  <div className="min-h-screen bg-[var(--bg-solid)] font-sans antialiased relative overflow-hidden">
  {/* Scroll progress bar */}
  <div aria-hidden className="fixed top-0 left-0 h-1.5 z-[60]" style={{ width: `${Math.round(scrollProgress*100)}%`, background: 'linear-gradient(90deg, var(--sitio-yellow), var(--sitio-orange))', boxShadow: '0 4px 10px rgba(0,0,0,.25)' }} />
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, var(--sitio-yellow) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, var(--sitio-green) 0%, transparent 50%),
            radial-gradient(circle at 40% 70%, var(--sitio-orange) 0%, transparent 40%)
          `,
          filter: 'blur(100px)',
          opacity: 0.6
        }}></div>
      </div>
      
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Cg opacity=%220.03%22%3E%3Cpath d=%22M10 10h80v80H10z%22 fill=%22none%22 stroke=%22%23FFD700%22 stroke-width=%220.5%22/%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%225%22 fill=%22%23228B22%22/%3E%3C/g%3E%3C/svg%3E')] pointer-events-none opacity-20" />
      
  {/* Header simplificado para um visual mais limpo */}
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
        {/* Botão de câmera rápido, ícone redondo em todos tamanhos */}
        <button
          onClick={() => { setView('vision'); setCameraActive(true) }}
          className="grid place-items-center w-12 h-12 rounded-full glass hover:glass-elevated text-[var(--fg)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 shadow-md hover:scale-105"
          aria-label="Abrir câmera"
          title="Abrir câmera"
        >
          <span className="text-lg">📷</span>
        </button>
        <button 
          onClick={() => setShowAboutModal(true)}
          className="px-3 py-2 sm:px-4 sm:py-2 rounded-xl glass hover:glass-elevated text-[var(--fg)] font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 text-xs sm:text-sm"
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

      {/* Home immersive landing with scroll snapping and carousel */}
  {view === 'home' && (
    <main className="snap-y relative z-10" aria-label="Início">
      {/* HERO */}
  <section className="snap-start min-h-[95vh] flex items-center justify-center relative" aria-labelledby="hero-title">
        {/* Elementos decorativos infantis */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            className="absolute top-20 left-10 text-4xl"
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🌟
          </motion.div>
          <motion.div 
            className="absolute top-32 right-20 text-3xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🌈
          </motion.div>
          <motion.div 
            className="absolute bottom-40 left-20 text-2xl"
            animate={{ rotate: -360, scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            🎈
          </motion.div>
          <motion.div 
            className="absolute bottom-32 right-10 text-3xl"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🦋
          </motion.div>
        </div>
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
              
              {/* Botão principal destacado e piscante */}
              <div className="mt-8 flex flex-col items-center gap-4">
                <motion.button 
                  className="group relative px-12 py-6 rounded-3xl bg-gradient-to-r from-[var(--sitio-green)] via-[#32CD32] to-[var(--sitio-green)] text-white font-black text-2xl hover:shadow-2xl hover:scale-110 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400 animate-pulse shadow-lg" 
                  onClick={() => { if (!localStorage.getItem('memoryDifficulty')) { setShowDifficultyModal(true) } else { setView('game') } }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.98 }}
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(50, 205, 50, 0.5)",
                      "0 0 40px rgba(50, 205, 50, 0.8)", 
                      "0 0 20px rgba(50, 205, 50, 0.5)"
                    ]
                  }}
                  transition={{ 
                    boxShadow: { duration: 2, repeat: Infinity },
                    default: { type: 'spring', stiffness: 260, damping: 18 }
                  }}
                >
                  <span className="flex items-center gap-3">
                    🎮 <span>JOGAR AGORA</span>
                    <span className="group-hover:translate-x-2 transition-transform text-3xl">🚀</span>
                  </span>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
                
                {/* Botões secundários removidos para um design mais limpo e focado */}
              </div>
              
              {/* Badges decorativos centralizados */}
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
                  >
                    {b.icon} {b.label}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFFICULTY PICKER */}
      {false && (
      <section className="snap-start py-16" aria-label="Escolher dificuldade">
        <div className="mx-auto max-w-4xl px-4">
          <div className="glass-elevated rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--sitio-green)]/5 via-transparent to-[var(--sitio-yellow)]/5 pointer-events-none"></div>
            <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-4xl font-black bg-gradient-to-r from-[var(--sitio-blue)] to-[var(--sitio-green)] bg-clip-text text-transparent mb-4">Escolha sua Aventura</h3>
              <p className="text-[var(--fg-muted)] max-w-md mx-auto text-lg">Selecione o nível de desafio para começar</p>
            </div>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                role="radiogroup"
                aria-label="Dificuldade"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { staggerChildren: 0.08, ease: [0.22, 1, 0.36, 1], duration: 0.5 }
                  }
                }}
              >
                {[
                  { key: 'easy', label: 'Fácil', hint: '3 pares • grade 3×2', icon: '🌱', desc: 'Perfeito para iniciantes' },
                  { key: 'medium', label: 'Médio', hint: '6 pares • mais desafiador', icon: '🌿', desc: 'Para aventureiros experientes' },
                  { key: 'hard', label: 'Difícil', hint: '12 pares • máximo desafio', icon: '🌳', desc: 'Para mestres da memória' }
                ].map(opt => (
                  <motion.label
                    key={opt.key}
                    variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                    whileHover={{ scale: 1.04, rotate: 0.5 }}
                    whileTap={{ scale: 0.98 }}
                    className={`glass-elevated rounded-2xl p-6 cursor-pointer border-2 transition-all duration-300 group ${
                    pendingDifficulty===opt.key
                      ? 'border-[var(--accent)] bg-gradient-to-br from-[var(--accent)]/10 to-transparent shadow-xl' 
                      : 'border-transparent hover:border-[var(--accent)]/50'
                  }`}
                  >
                    <input type="radio" className="sr-only" name="difficulty" value={opt.key}
                      checked={pendingDifficulty===opt.key}
                      onChange={() => { setPendingDifficulty(opt.key); localStorage.setItem('memoryDifficulty', opt.key) }}
                      aria-checked={pendingDifficulty===opt.key}
                    />
                    <div className="text-center">
                      <motion.div className="text-4xl mb-3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }}>{opt.icon}</motion.div>
                      <div className="font-black text-xl text-[var(--fg)] mb-2">{opt.label}</div>
                      <div className="text-[var(--fg-muted)] text-sm mb-3">{opt.hint}</div>
                      <div className="text-xs text-[var(--fg-muted)] italic">{opt.desc}</div>
                      {pendingDifficulty===opt.key && (
                        <motion.div className="mt-3 flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="inline-flex px-3 py-1 rounded-full bg-[var(--accent)] text-[var(--sitio-brown)] text-xs font-bold">
                            ✓ Selecionado
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.label>
                ))}
              </motion.div>
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <button className="px-6 py-3 rounded-xl glass hover:glass-elevated transition-all duration-300" 
                  onClick={() => setView('vision')}>
                  📷 Testar Câmera
                </button>
                <button className="group px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--sitio-green)] to-[var(--sitio-yellow)] text-[var(--sitio-brown)] font-bold hover:shadow-xl hover:scale-105 transition-all duration-300" 
                  onClick={() => setView('game')}>
                  <span className="flex items-center gap-2">
                    🚀 <span>Começar Aventura</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
      </main>
    )}
  {/* Vision controls */}
  {view === 'vision' && (
  <div className="relative z-10 container px-4 py-4">
          <div className="glass rounded-2xl p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <button className={`px-4 py-2.5 rounded-xl font-semibold transition-all ${
                cameraActive
                  ? 'bg-[var(--danger)] text-white shadow-lg'
                  : 'bg-[var(--accent)] text-[var(--sitio-brown)] hover:brightness-110'
              } focus:outline-none focus-visible:ring-2 ring-[var(--accent)]/50`} 
                onClick={() => setCameraActive(!cameraActive)}>
                {cameraActive ? '📷 Desligar Câmera' : '📷 Ligar Câmera'}
              </button>
              <button className="glass rounded-xl px-4 py-2.5 text-[var(--fg)] font-semibold hover:glass-elevated border border-[var(--border)] transition-all focus:outline-none focus-visible:ring-2 ring-[var(--accent)]/50" 
                onClick={() => setFlipCamera(f => !f)}>
                {flipCamera ? '🔄 Desespelhar' : '🔄 Espelhar'}
              </button>
              <button className="glass rounded-xl px-4 py-2.5 text-[var(--fg)] font-semibold hover:glass-elevated disabled:opacity-40 border border-[var(--border)] transition-all focus:outline-none focus-visible:ring-2 ring-[var(--accent)]/50" 
                disabled={!cameraActive || videoDevices.length < 2}
                onClick={() => {
                  if (videoDevices.length === 0) return
                  const currentIndex = videoDevices.findIndex(d => d.deviceId === selectedDeviceId)
                  const nextIndex = (currentIndex + 1) % videoDevices.length
                  setSelectedDeviceId(videoDevices[nextIndex].deviceId)
                }}>
                📹 Trocar Câmera {videoDevices.length > 0 ? `(${(videoDevices.findIndex(d => d.deviceId === selectedDeviceId))+1}/${videoDevices.length})` : ''}
              </button>
              <button className={`px-4 py-2.5 rounded-xl font-semibold transition-all ${
                microphoneActive
                  ? 'bg-[var(--danger)] text-white shadow-lg animate-pulse'
                  : 'bg-[var(--secondary)] text-white hover:brightness-110'
              } focus:outline-none focus-visible:ring-2 ring-[var(--accent)]/50`} 
                onClick={() => setMicrophoneActive(!microphoneActive)}>
                {microphoneActive ? '🎤 Desligar Microfone' : '🎤 Ligar Microfone'}
              </button>
              <button className="glass rounded-xl px-4 py-2.5 text-[var(--fg)] font-semibold hover:glass-elevated border border-[var(--border)] transition-all focus:outline-none focus-visible:ring-2 ring-[var(--accent)]/50" 
                onClick={() => setUseAI(v => !v)}>
                {useAI ? '🤖 Desativar IA' : '🤖 Ativar IA'}
              </button>
              <div className="flex items-end gap-1 ml-auto glass rounded-lg px-3 py-2">
                {vizData.map((h, i) => (
                  <div key={i} className="w-1.5 bg-gradient-to-t from-[var(--accent)] to-[var(--sitio-orange)] rounded-t shadow-sm" style={{ height: `${h}px` }} />
                ))}
              </div>
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
                {/* Moldura fantasma para orientar centralização */}
                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width: 220, height: 160, border:'3px dashed rgba(255,215,0,0.7)', borderRadius:'12px', pointerEvents:'none' }} />
              </div>
              <canvas ref={canvasRef} width={480} height={360} style={{ display: 'block', margin: '0.5rem auto', borderRadius: '0.5rem' }} />
              {/* Aviso de pouca luz */}
              <div id="lowLightHint" style={{ display:'none' }} />
              {lowLight && (
                <div style={{
                  background:'#FFD700', color:'#000', border:'3px solid #000', borderRadius:'10px',
                  padding:'0.5rem 0.75rem', fontWeight:900, textAlign:'center', margin:'0.5rem auto'
                }}>
                  💡 Está um pouco escuro. Aproxime a carta e use um ambiente mais iluminado.
                </div>
              )}
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={captureTemplate} className="small-btn">Capturar Template</button>
                <button onClick={takeSnapshot} className="small-btn">Tirar Foto</button>
                <button onClick={() => { templatesRef.current = []; setSnapshots([]); alert({ title: 'Limpo!', message: 'Templates e fotos foram apagados.', icon: '🧹' }) }} className="small-btn">Limpar Tudo</button>
                <a href={`${import.meta.env.BASE_URL || '/'}printable-cards.html`} target="_blank" rel="noopener" className="small-btn">📄 Cartas imprimíveis</a>
              </div>
              <p style={{ fontWeight: 700, textShadow: '0 2px 6px rgba(0,0,0,.35)' }}>
                Cartas detectadas: {detectedCards.length > 0 ? detectedCards.join(', ') : 'Nenhuma'} | AI: {aiReady ? 'Pronto ✅' : 'Carregando ⏳'}
              </p>
              {/* lowLight controlado por estado React */}
              {snapshots.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontWeight: 700, textShadow: '0 2px 6px rgba(0,0,0,.35)' }}>Últimas Fotos:</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {snapshots.map((snap, i) => (
                      <img key={snap.timestamp} src={snap.image} alt={`Snapshot ${i+1}`} style={{ width: '80px', height: '60px', borderRadius: '0.5rem', objectFit: 'cover' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="camera-placeholder stage-center text-center mx-auto max-w-3xl bg-white/30 backdrop-blur-md border border-[var(--theme-primary,#FFD700)]/30 rounded-2xl p-10 shadow-xl">
              <p className="font-extrabold text-[var(--theme-text,#2F4F2F)]">Clique em "Ligar Câmera" para começar!</p>
            </div>
          )
        )}
      </div>
      
      {/* Difficulty Modal */}
      <AnimatePresence>
        {showDifficultyModal && (
          <motion.div
            className="fixed inset-0 z-[70] grid place-items-center p-4"
            role="dialog" aria-modal="true" aria-labelledby="difficulty-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => { setShowDifficultyModal(false); localStorage.setItem('seenDifficultyModal','1') }} />
            <motion.div
              className="relative glass-elevated rounded-3xl max-w-lg w-full p-6"
              initial={{ y: 30, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              <h3 id="difficulty-title" className="text-2xl font-black text-[var(--fg)] mb-2">Escolha sua aventura</h3>
              <p className="text-[var(--fg-muted)] mb-4">Selecione o nível de desafio para começar a jogar.</p>
              <div role="radiogroup" aria-label="Dificuldade" className="grid gap-3">
                {[
                  { key: 'easy', label: 'Fácil', hint: '3 pares • 3×2', icon: '🌱' },
                  { key: 'medium', label: 'Médio', hint: '6 pares', icon: '🌿' },
                  { key: 'hard', label: 'Difícil', hint: '12 pares', icon: '🌳' }
                ].map(opt => (
                  <label key={opt.key} className={`glass rounded-xl p-4 cursor-pointer border-2 ${pendingDifficulty===opt.key ? 'border-[var(--accent)]' : 'border-transparent hover:border-[var(--accent)]/50'}`}>
                    <input type="radio" className="sr-only" name="difficulty-modal" value={opt.key}
                      checked={pendingDifficulty===opt.key}
                      onChange={() => { setPendingDifficulty(opt.key); localStorage.setItem('memoryDifficulty', opt.key) }}
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.icon}</span>
                      <div>
                        <div className="font-extrabold text-[var(--fg)]">{opt.label}</div>
                        <div className="text-[var(--fg-muted)] text-sm">{opt.hint}</div>
                      </div>
                      {pendingDifficulty===opt.key && (
                        <span className="ml-auto inline-flex px-2 py-1 rounded-full bg-[var(--accent)] text-[var(--sitio-brown)] text-xs font-bold">✓</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-5 flex gap-3 justify-end">
                <button className="px-4 py-2 rounded-xl glass" onClick={() => { setShowDifficultyModal(false); localStorage.setItem('seenDifficultyModal','1') }}>Cancelar</button>
                <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-[var(--sitio-yellow)] to-[var(--sitio-orange)] text-[var(--sitio-brown)] font-bold" onClick={() => { setShowDifficultyModal(false); localStorage.setItem('seenDifficultyModal','1'); setView('game') }}>Começar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About / Quem somos Modal */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { title: '🎵 Música dinâmica', desc: 'Trilha que evolui com seus acertos' },
                  { title: '🤖 IA opcional', desc: 'Câmera com reconhecimento inteligente' },
                  { title: '♿ Acessível', desc: 'Teclado, TTS e alto contraste' },
                  { title: '📱 Mobile-first', desc: 'Rápido e responsivo' }
                ].map((f,i) => (
                  <div key={i} className="glass rounded-xl p-3">
                    <div className="font-extrabold">{f.title}</div>
                    <div className="text-[var(--fg-muted)] text-sm">{f.desc}</div>
                  </div>
                ))}
              </div>
              <div className="mb-2 font-bold">Tecnologias</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['React','Vite','Framer Motion','Web Audio','MediaDevices','ARIA'].map((t, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--sitio-yellow)] to-[var(--sitio-orange)] text-[var(--sitio-brown)]">{t}</span>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <a href="https://github.com/TauanRibeiro/sitio-do-pica-pau-ia" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl glass">Repositório</a>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--sitio-green)] to-[var(--sitio-blue)] text-white font-bold" onClick={() => setShowAboutModal(false)}>Fechar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Seção de controles adicionais antes do footer */}
      {false && view !== 'game' && (
        <section className="relative mt-8 mb-8">
          <div className="mx-auto max-w-6xl px-4">
            <div className="bg-gradient-to-br from-[var(--theme-primary,#FFD700)]/10 to-[var(--theme-secondary,#8B4513)]/10 backdrop-blur-md rounded-3xl border border-[var(--theme-primary,#FFD700)]/20 p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-[var(--theme-text,#2F4F2F)] text-center mb-4">🎛️ Controles Avançados</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <button 
                  className="px-4 py-2 rounded-xl bg-[var(--theme-primary,#FFD700)] text-[var(--theme-text,#2F4F2F)] font-semibold hover:bg-[var(--theme-accent,#FF4500)] transition-all"
                  onClick={() => setMusicPlaying(p => !p)}
                >
                  {musicPlaying ? '🔇 Parar Música' : '🎵 Iniciar Música'}
                </button>
                <button 
                  className="px-4 py-2 rounded-xl bg-[var(--theme-secondary,#8B4513)] text-white font-semibold hover:bg-[var(--theme-accent,#FF4500)] transition-all"
                  onClick={() => setUseAI(p => !p)}
                >
                  {useAI ? '🤖 IA Ativada' : '🔧 IA Desativada'}
                </button>
                <button 
                  className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-[var(--theme-text,#2F4F2F)] font-semibold hover:bg-white/30 border border-[var(--theme-primary,#FFD700)]/30 transition-all"
                  onClick={() => alert({ title: 'Em breve', message: 'Funcionalidades em desenvolvimento!', icon: '🚧' })}
                >
                  ⚙️ Configurações
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {view !== 'game' && (
      <footer className="relative mt-6 border-t border-[var(--theme-primary,#FFD700)]/30">
        <div className="mx-auto max-w-6xl px-4 py-6 text-[var(--theme-text,#2F4F2F)] text-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-extrabold text-[var(--theme-text,#2F4F2F)] text-with-bg">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--theme-primary,#FFD700)] shadow-sm" />
            👩‍🎨 Malie • ⚡ Tauan • 🧙‍♀️ Carla • 👵 Vovó Jane
          </div>
          <div className="flex items-center gap-3">
            <a className="glass px-3 py-1.5 rounded-lg" href="https://github.com/TauanRibeiro/sitio-do-pica-pau-ia" target="_blank" rel="noreferrer">🌐 Repositório</a>
            <a className="glass px-3 py-1.5 rounded-lg" href="#acessibilidade">♿ Acessibilidade</a>
            <button className="glass px-3 py-1.5 rounded-lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>⬆️ Topo</button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-6 text-center font-extrabold text-with-bg">🏫 Projeto para Feira de Ciências - Colégio Meta, Sobradinho-DF</div>
      </footer>
      )}
    </div>
  )
}

export default App
