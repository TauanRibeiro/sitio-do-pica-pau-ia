import React, { useState, useEffect } from 'react'
import './achievements.css'

const ACHIEVEMENTS = [
  {
    id: 'first_win',
    title: '🏆 Primeira Vitória',
    description: 'Complete seu primeiro jogo!',
    condition: (stats) => stats.gamesCompleted >= 1
  },
  {
    id: 'speed_master',
    title: '⚡ Mestre da Velocidade',
    description: 'Complete um jogo com menos de 20 movimentos',
    condition: (stats) => stats.bestMoves <= 20 && stats.bestMoves > 0
  },
  {
    id: 'streak_hero',
    title: '🔥 Herói do Streak',
    description: 'Alcance streak de 10!',
    condition: (stats) => stats.bestStreak >= 10
  },
  {
    id: 'perfectionist',
    title: '💎 Perfeccionista',
    description: 'Complete o nível difícil com streak perfeito',
    condition: (stats) => stats.perfectHardGames >= 1
  },
  {
    id: 'explorer',
    title: '🧭 Explorador',
    description: 'Use todas as funcionalidades: jogo, câmera e IA',
    condition: (stats) => stats.usedCamera && stats.usedAI && stats.gamesCompleted >= 1
  },
  {
    id: 'photographer',
    title: '📸 Fotógrafo',
    description: 'Tire 10 fotos com a câmera',
    condition: (stats) => stats.photosTaken >= 10
  },
  {
    id: 'ai_trainer',
    title: '🤖 Treinador de IA',
    description: 'Capture 5 templates para a IA',
    condition: (stats) => stats.templatesCaptured >= 5
  },
  {
    id: 'marathon',
    title: '🏃 Maratonista',
    description: 'Complete 20 jogos',
    condition: (stats) => stats.gamesCompleted >= 20
  }
]

function Achievements({ stats = {}, onClose }) {
  const [unlockedAchievements, setUnlockedAchievements] = useState([])
  const [newlyUnlocked, setNewlyUnlocked] = useState([])

  useEffect(() => {
    const previousUnlocked = JSON.parse(localStorage.getItem('achievements') || '[]')
    const currentUnlocked = ACHIEVEMENTS.filter(achievement => 
      achievement.condition(stats)
    ).map(a => a.id)

    // Find newly unlocked achievements
    const newUnlocked = currentUnlocked.filter(id => !previousUnlocked.includes(id))
    
    setUnlockedAchievements(currentUnlocked)
    setNewlyUnlocked(newUnlocked)
    
    // Save to localStorage
    localStorage.setItem('achievements', JSON.stringify(currentUnlocked))

    // Show notifications for new achievements
    if (newUnlocked.length > 0) {
      newUnlocked.forEach((id, index) => {
        const achievement = ACHIEVEMENTS.find(a => a.id === id)
        setTimeout(() => {
          if (window.showAchievementNotification) {
            window.showAchievementNotification(achievement)
          }
        }, index * 1000)
      })
    }
  }, [stats])

  return (
    <div className="achievements-overlay">
      <div className="achievements-modal">
        <div className="achievements-header">
          <h2>🏆 Conquistas</h2>
          <button onClick={onClose} className="close-btn">✖</button>
        </div>
        
        <div className="achievements-stats">
          <div className="stat-card">
            <div className="stat-number">{unlockedAchievements.length}</div>
            <div className="stat-label">Desbloqueadas</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{ACHIEVEMENTS.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}%</div>
            <div className="stat-label">Progresso</div>
          </div>
        </div>

        <div className="achievements-grid">
          {ACHIEVEMENTS.map(achievement => {
            const isUnlocked = unlockedAchievements.includes(achievement.id)
            const isNew = newlyUnlocked.includes(achievement.id)
            
            return (
              <div 
                key={achievement.id} 
                className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'} ${isNew ? 'new' : ''}`}
              >
                <div className="achievement-title">{achievement.title}</div>
                <div className="achievement-description">{achievement.description}</div>
                {isNew && <div className="new-badge">NOVO!</div>}
              </div>
            )
          })}
        </div>

        <div className="achievements-footer">
          <p>Continue jogando para desbloquear mais conquistas! 🎮</p>
        </div>
      </div>
    </div>
  )
}

export default Achievements
