import React, { useState, useRef, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  // ...existing code...
  const [cameraActive, setCameraActive] = useState(false)
  const [microphoneActive, setMicrophoneActive] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [videoStream, setVideoStream] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          setVideoStream(stream)
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch(err => {
          alert('Erro ao acessar a câmera: ' + err.message)
        })
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
        setVideoStream(null)
      }
    }
    // Limpeza ao desmontar
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraActive])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <header className="app-header">
        <h1>🎵 Sítio do Pica-Pau IA 🎵</h1>
        <p>Um jogo de memória divertido com música e visão computacional!</p>
      </header>
      <div className="controls">
        <button className="camera-btn" onClick={() => setCameraActive(!cameraActive)}>
          {cameraActive ? 'Desligar Câmera' : 'Ligar Câmera'}
        </button>
        <button className="mic-btn" onClick={() => setMicrophoneActive(!microphoneActive)}>
          {microphoneActive ? 'Desligar Microfone' : 'Ligar Microfone'}
        </button>
        <button className="music-btn" onClick={() => setMusicPlaying(!musicPlaying)}>
          {musicPlaying ? 'Parar Música' : 'Tocar Música'}
        </button>
      </div>
      <div className="game-area">
        {cameraActive ? (
          <div className="camera-view">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              width={320}
              height={240}
              style={{ borderRadius: '1rem', boxShadow: '0 2px 8px #ffb34788', marginBottom: '1rem' }}
            />
            <p>Visão da câmera ativada! (em breve: detecção de cartas)</p>
          </div>
        ) : (
          <div className="camera-placeholder">
            <p>Clique em "Ligar Câmera" para começar!</p>
          </div>
        )}
        <div className="memory-game">
          <p>Jogo de memória colorido e divertido!</p>
        </div>
      </div>
      <footer className="app-footer">
        <p>Feito com ❤️ e IA | 2025</p>
      </footer>
    </>
  )
}

export default App
