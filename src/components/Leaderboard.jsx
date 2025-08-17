import React, { useState, useEffect } from 'react'
import './leaderboard.css'

function Leaderboard({ onClose, newScore = null, difficulty = 'easy', moves = 0, streak = 0, timeSeconds = null }) {
  const [playerName, setPlayerName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    loadLeaderboard()
    if (newScore !== null && newScore > 0) setShowNameInput(true)
  }, [newScore])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const loadLeaderboard = () => {
  const saved = localStorage.getItem('gameLeaderboard')
  const data = saved ? JSON.parse(saved) : []
  setLeaderboard(data.sort((a, b) => b.score - a.score).slice(0, 20))
  }

  const saveScore = () => {
    if (!playerName.trim()) return
    
    const newEntry = {
      name: playerName.trim(),
      score: newScore,
      difficulty,
      moves,
      streak,
      time: timeSeconds,
      date: new Date().toLocaleDateString('pt-BR'),
      timestamp: Date.now()
    }

    const saved = localStorage.getItem('gameLeaderboard')
    const existing = saved ? JSON.parse(saved) : []
    existing.push(newEntry)
    
    // Manter apenas os 50 melhores scores
    const sorted = existing.sort((a, b) => b.score - a.score).slice(0, 50)
    localStorage.setItem('gameLeaderboard', JSON.stringify(sorted))
    
    setLeaderboard(sorted.slice(0, 10))
    setShowNameInput(false)
    setPlayerName('')
    
    // Update achievements
    if (window.updateStats) {
      window.updateStats('leaderboardEntries', 1)
    }
  }

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'easy': return '#4ade80'
      case 'medium': return '#fbbf24' 
      case 'hard': return '#f87171'
      default: return '#60a5fa'
    }
  }

  const getDifficultyLabel = (diff) => {
    switch(diff) {
      case 'easy': return 'Fácil'
      case 'medium': return 'Médio'
      case 'hard': return 'Difícil'
      default: return diff
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('leaderboard-overlay')) onClose?.()
  }

  return (
    <div className="leaderboard-overlay" onClick={handleOverlayClick}>
      <div className="leaderboard-modal" role="dialog" aria-modal="true">
        <div className="leaderboard-header">
          <h2>🏆 Ranking dos Melhores</h2>
          <button onClick={onClose} className="close-btn">✖</button>
        </div>

        {showNameInput && (
          <div className="name-input-section">
            <h3>🎉 Novo Record! Digite seu nome:</h3>
            <div className="score-preview">
              <span>Pontuação: {newScore}</span>
              <span>Movimentos: {moves}</span>
              <span>Streak: {streak}x</span>
              {timeSeconds !== null && <span>Tempo: {timeSeconds}s</span>}
            </div>
            <div className="name-input-group">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Seu nome aqui..."
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && saveScore()}
                autoFocus
              />
              <button onClick={saveScore} disabled={!playerName.trim()}>
                Salvar
              </button>
            </div>
          </div>
        )}

        <div className="leaderboard-list">
          {leaderboard.length === 0 ? (
            <div className="empty-leaderboard">
              <p>🎮 Seja o primeiro a entrar no ranking!</p>
              <p>Complete um jogo para aparecer aqui!</p>
            </div>
          ) : (
      leaderboard.map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`} className={`leaderboard-entry ${index < 3 ? 'podium' : ''}`}>
                <div className="position">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                <div className="player-info">
                  <div className="player-name">{entry.name}</div>
                  <div className="player-details">
                    <span style={{color: getDifficultyColor(entry.difficulty)}}>
                      {getDifficultyLabel(entry.difficulty)}
                    </span>
                    <span>•</span>
                    <span>{entry.date}</span>
                  </div>
                </div>
                <div className="player-stats">
                  <div className="score">{entry.score}pt</div>
                  <div className="sub-stats">
                    <span>{entry.moves}mov</span>
        <span>{entry.streak}x</span>
        {entry.time ? <span>{entry.time}s</span> : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="leaderboard-footer">
          <p>🎯 Complete jogos para entrar no ranking!</p>
          <p>📊 Pontuação considera tempo, movimentos e dificuldade</p>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
