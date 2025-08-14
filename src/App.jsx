import React, { useState, useRef, useEffect, Suspense, lazy } from 'react'
import './App.css'
import * as Tone from 'tone'

const MemoryGame = lazy(() => import('./components/MemoryGame'))

function App() {
  // state
  const [cameraActive, setCameraActive] = useState(false)
  const [microphoneActive, setMicrophoneActive] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [videoStream, setVideoStream] = useState(null)
  const [view, setView] = useState('game')
  const [videoDevices, setVideoDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [useAI, setUseAI] = useState(true)

  // refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const templatesRef = useRef([])
  const [vizData, setVizData] = useState(new Array(12).fill(4))
  const [flipCamera, setFlipCamera] = useState(false)
  const [detectedCards, setDetectedCards] = useState([])

  // AI refs
  const modelRef = useRef(null)
  const tfRef = useRef(null)
  const offscreenCanvasRef = useRef(null)

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
          alert('Erro ao acessar a câmera: ' + (err?.message || e2?.message))
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
  }, [cameraActive, selectedDeviceId])

  // flip
  useEffect(() => {
    if (videoRef.current) videoRef.current.style.transform = flipCamera ? 'scaleX(-1)' : 'none'
  }, [flipCamera])

  // turn off camera/mic when leaving vision tab
  useEffect(() => {
    if (view !== 'vision') {
      if (cameraActive) setCameraActive(false)
      if (microphoneActive) setMicrophoneActive(false)
    }
  }, [view])

  // lazy-load TFJS/MobileNet
  useEffect(() => {
    let canceled = false
    async function loadModel() {
      if (!useAI || modelRef.current) return
      const tf = await import('@tensorflow/tfjs')
      const mobilenet = await import('@tensorflow-models/mobilenet')
      if (canceled) return
      tfRef.current = tf
      modelRef.current = await mobilenet.load()
    }
    loadModel()
    return () => { canceled = true }
  }, [useAI])

  // mic visualizer
  useEffect(() => {
    let micStream = null
    let rafId = null
    async function startMic() {
      try {
        await Tone.start()
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStream = stream
        const src = Tone.context.createMediaStreamSource(stream)
        const analyser = Tone.context.createAnalyser()
        analyser.fftSize = 512
        src.connect(analyser)
        analyserRef.current = analyser
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const update = () => {
          analyser.getByteFrequencyData(dataArray)
          const step = Math.floor(dataArray.length / 12)
          const bars = new Array(12).fill(0).map((_, i) => Math.max(4, Math.min(40, Math.round(dataArray[i*step]/6))))
          setVizData(bars)
          rafId = requestAnimationFrame(update)
        }
        update()
      } catch (err) {
        alert('Erro ao acessar microfone: ' + err.message)
      }
    }
    if (microphoneActive) startMic()
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (analyserRef.current) analyserRef.current.disconnect()
      if (micStream) micStream.getTracks().forEach(t => t.stop())
      analyserRef.current = null
    }
  }, [microphoneActive])

  // render loop
  useEffect(() => {
    let raf = null
    const ctx = canvasRef.current?.getContext('2d')
    let lastEmbedding = 0
    function step(ts) {
      if (videoRef.current && canvasRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const img = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
        const found = []
        if (templatesRef.current.length > 0) {
          templatesRef.current.forEach((tpl, idx) => {
            let diff = 0
            const w = Math.min(tpl.width, canvasRef.current.width)
            const h = Math.min(tpl.height, canvasRef.current.height)
            for (let y = 0; y < h; y += 8) {
              for (let x = 0; x < w; x += 8) {
                const i = ((y * canvasRef.current.width) + x) * 4
                const r = img.data[i], g = img.data[i+1], b = img.data[i+2]
                const tr = tpl.data[(y * tpl.width + x) * 4]
                const tg = tpl.data[(y * tpl.width + x) * 4 + 1]
                const tb = tpl.data[(y * tpl.width + x) * 4 + 2]
                diff += Math.abs(r - tr) + Math.abs(g - tg) + Math.abs(b - tb)
              }
            }
            const avg = diff / ((w/8)*(h/8)*3)
            if (avg < 60) found.push(idx)
          })
        }
        // embeddings
        const now = ts || performance.now()
        if (useAI && modelRef.current && now - lastEmbedding > 350) {
          lastEmbedding = now
          try {
            const w = 128, h = 128
            const sx = Math.floor((canvasRef.current.width - w) / 2)
            const sy = Math.floor((canvasRef.current.height - h) / 2)
            if (!offscreenCanvasRef.current) {
              offscreenCanvasRef.current = document.createElement('canvas')
              offscreenCanvasRef.current.width = w
              offscreenCanvasRef.current.height = h
            }
            const octx = offscreenCanvasRef.current.getContext('2d')
            octx.drawImage(canvasRef.current, sx, sy, w, h, 0, 0, w, h)
            const tf = tfRef.current
            const image = tf.browser.fromPixels(offscreenCanvasRef.current)
            const resized = tf.image.resizeBilinear(image, [224, 224])
            const norm = resized.toFloat().div(127).sub(1)
            const embTensor = modelRef.current.infer(norm, 'conv_preds')
            embTensor.data().then(vec => {
              const matches = []
              templatesRef.current.forEach((tpl, idx) => {
                if (!tpl.embedding || !tpl.embeddingNorm) return
                let dot = 0, norm2 = 0
                for (let i = 0; i < vec.length; i++) {
                  dot += vec[i] * tpl.embedding[i]
                  norm2 += vec[i] * vec[i]
                }
                const sim = dot / (Math.sqrt(norm2) * tpl.embeddingNorm)
                if (sim > 0.92) matches.push(idx)
              })
              if (matches.length) setDetectedCards(matches)
              tf.dispose([image, resized, norm, embTensor])
            }).catch(() => {})
          } catch {}
        }
        setDetectedCards(found)
      }
      raf = requestAnimationFrame(step)
    }
    if (cameraActive) raf = requestAnimationFrame(step)
    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [cameraActive, useAI])

  // music toggle
  useEffect(() => {
    let synth = null
    if (musicPlaying) {
      Tone.start().then(() => {
        synth = new Tone.Synth({ oscillator: { type: 'sine' } }).toDestination()
        const now = Tone.now()
        synth.triggerAttackRelease('C4', '8n', now)
        synth.triggerAttackRelease('E4', '8n', now + 0.25)
        synth.triggerAttackRelease('G4', '8n', now + 0.5)
        synth.triggerAttackRelease('C5', '4n', now + 0.75)
      }).catch(() => {})
    }
    return () => { if (synth) synth.dispose() }
  }, [musicPlaying])

  // capture template
  function captureTemplate() {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const w = 80, h = 80
    const x = Math.floor((canvasRef.current.width - w)/2)
    const y = Math.floor((canvasRef.current.height - h)/2)
    const data = ctx.getImageData(x, y, w, h)
    const tpl = { data: data.data, width: w, height: h }
    try {
      if (useAI && modelRef.current) {
        if (!offscreenCanvasRef.current) offscreenCanvasRef.current = document.createElement('canvas')
        offscreenCanvasRef.current.width = w
        offscreenCanvasRef.current.height = h
        const octx = offscreenCanvasRef.current.getContext('2d')
        octx.putImageData(new ImageData(data.data, w, h), 0, 0)
        const tf = tfRef.current
        const image = tf.browser.fromPixels(offscreenCanvasRef.current)
        const resized = tf.image.resizeBilinear(image, [224, 224])
        const norm = resized.toFloat().div(127).sub(1)
        const embTensor = modelRef.current.infer(norm, 'conv_preds')
        const vec = embTensor.dataSync()
        let normv = 0
        for (let i = 0; i < vec.length; i++) normv += vec[i] * vec[i]
        tpl.embedding = Array.from(vec)
        tpl.embeddingNorm = Math.sqrt(normv)
        tf.dispose([image, resized, norm, embTensor])
      }
    } catch {}
    templatesRef.current.push(tpl)
    alert('Template capturado! Agora a detecção usa esse padrão.')
  }

  return (
    <>
      <div className="app-container">
      <div className="orbs">
        <div className="orb one"></div>
        <div className="orb two"></div>
        <div className="orb three"></div>
      </div>
      <div>
        {/* Optional logos kept smaller for focus on title */}
      </div>
      <header className="app-header">
        <div className="header-card">
          <h1 className="title">🎵 Sítio do Pica-Pau IA</h1>
          <p className="subtitle">Um jogo de memória divertido com música e visão computacional. Aponte a câmera, ative o microfone e explore!</p>
          <span className="chip">Beta interativo</span>
        </div>
        <nav style={{ marginTop: '0.5rem' }}>
          <button className="small-btn" onClick={() => setView('game')}>Jogo Virtual</button>
          <button className="small-btn" onClick={() => setView('vision')}>Reconhecimento (Câmera)</button>
        </nav>
      </header>
      <div className="controls">
        <button className="music-btn" onClick={() => setMusicPlaying(!musicPlaying)}>
          {musicPlaying ? 'Parar Música' : 'Tocar Música'}
        </button>
        {view === 'vision' && (
          <>
            <button className="camera-btn" onClick={() => setCameraActive(!cameraActive)}>
              {cameraActive ? 'Desligar Câmera' : 'Ligar Câmera'}
            </button>
            <button className="small-btn" onClick={() => setFlipCamera(f => !f)}>{flipCamera ? 'Desespelhar' : 'Espelhar'}</button>
            <button className="small-btn" disabled={!cameraActive || videoDevices.length < 2}
              onClick={() => {
                if (videoDevices.length === 0) return
                const currentIndex = videoDevices.findIndex(d => d.deviceId === selectedDeviceId)
                const nextIndex = (currentIndex + 1) % videoDevices.length
                setSelectedDeviceId(videoDevices[nextIndex].deviceId)
              }}>
              Trocar Câmera {videoDevices.length > 0 ? `(${(videoDevices.findIndex(d => d.deviceId === selectedDeviceId))+1}/${videoDevices.length})` : ''}
            </button>
            <button className="mic-btn" onClick={() => setMicrophoneActive(!microphoneActive)}>
              {microphoneActive ? 'Desligar Microfone' : 'Ligar Microfone'}
            </button>
            <button className="small-btn" onClick={() => setUseAI(v => !v)}>{useAI ? 'Desativar IA' : 'Ativar IA'}</button>
            <div className="viz">
              {vizData.map((h, i) => (<div key={i} className="bar" style={{ height: `${h}px` }} />))}
            </div>
          </>
        )}
      </div>
      <div className="game-area">
        {view === 'game' && (
          <div className="memory-game">
            <Suspense fallback={<p>Carregando jogo...</p>}>
              <MemoryGame />
            </Suspense>
          </div>
        )}
        {view === 'vision' && (
          cameraActive ? (
            <div className="camera-view">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                width={480}
                height={360}
                style={{ borderRadius: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', marginBottom: '0.5rem' }}
              />
              <canvas ref={canvasRef} width={480} height={360} style={{ display: 'block', margin: '0.5rem auto', borderRadius: '0.5rem' }} />
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
                <button onClick={captureTemplate} className="small-btn">Capturar Template</button>
                <button onClick={() => { templatesRef.current = []; alert('Templates limpos') }} className="small-btn">Limpar Templates</button>
              </div>
              <p style={{ fontWeight: 700, textShadow: '0 2px 6px rgba(0,0,0,.35)' }}>Cartas detectadas: {detectedCards.length > 0 ? detectedCards.join(', ') : 'Nenhuma'}</p>
            </div>
          ) : (
            <div className="camera-placeholder">
              <p style={{ fontWeight: 700, textShadow: '0 2px 6px rgba(0,0,0,.35)' }}>Clique em "Ligar Câmera" para começar!</p>
            </div>
          )
        )}
      </div>
  <footer className="app-footer">
    <p className="footer-badge">Feito por Malie, Tauan, Carla e vovó Jane — Projeto para a feira de ciências (Meta - Sobradinho DF)</p>
  </footer>
  </div>
    </>
  )
}

export default App
