// Achievement notification system
export function showAchievementNotification(achievement) {
  // Remove any existing notifications
  const existing = document.querySelector('.achievement-notification')
  if (existing) {
    existing.remove()
  }

  // Create notification element
  const notification = document.createElement('div')
  notification.className = 'achievement-notification'
  notification.innerHTML = `
    <div class="notification-title">🏆 Conquista Desbloqueada!</div>
    <div class="notification-title">${achievement.title}</div>
    <div class="notification-desc">${achievement.description}</div>
  `

  // Add to DOM
  document.body.appendChild(notification)

  // Remove after animation
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 4000)

  // Play achievement sound
  playAchievementSound()
}

// Achievement sound effect
async function playAchievementSound() {
  try {
    // Usar o AudioEngine se disponível
    const { getAudioEngine } = await import('./audioEngine')
    const audioEngine = getAudioEngine()
    audioEngine.playAchievementUnlock()
  } catch (err) {
    // Fallback para Tone.js direto
    try {
      const Tone = await import('tone')
      await Tone.start()
      
      const synth = new Tone.PolySynth().toDestination()
      const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).toDestination()
      synth.connect(reverb)
      
      const now = Tone.now()
      const melody = ['C5', 'E5', 'G5', 'C6']
      melody.forEach((note, i) => {
        synth.triggerAttackRelease(note, '8n', now + i * 0.1)
      })
      
      setTimeout(() => {
        synth.dispose()
        reverb.dispose()
      }, 1000)
    } catch (fallbackErr) {
      console.log('Could not play achievement sound:', fallbackErr)
    }
  }
}

// Stats tracking utilities
export function updateStats(statName, value = 1, operation = 'increment') {
  const stats = JSON.parse(localStorage.getItem('gameStats') || '{}')
  
  switch (operation) {
    case 'increment':
      stats[statName] = (stats[statName] || 0) + value
      break
    case 'set':
      stats[statName] = value
      break
    case 'max':
      stats[statName] = Math.max(stats[statName] || 0, value)
      break
    case 'min':
      stats[statName] = Math.min(stats[statName] || Infinity, value)
      break
    case 'flag':
      stats[statName] = true
      break
  }
  
  localStorage.setItem('gameStats', JSON.stringify(stats))
  return stats
}

export function getStats() {
  return JSON.parse(localStorage.getItem('gameStats') || '{}')
}

// Make functions globally available
window.showAchievementNotification = showAchievementNotification
window.updateStats = updateStats
window.getStats = getStats
window.playAchievementSound = playAchievementSound
