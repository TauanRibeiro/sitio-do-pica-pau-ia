// Adiciona estrelas animadas e efeitos interativos
document.addEventListener('DOMContentLoaded', () => {
  // Criar container para as estrelas
  const starsContainer = document.createElement('div');
  starsContainer.className = 'stars';
  document.body.appendChild(starsContainer);

  // Adicionar 50 estrelas
  for (let i = 0; i < 50; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.setProperty('--duration', `${3 + Math.random() * 4}s`);
    star.style.setProperty('--delay', `${Math.random() * 5}s`);
    starsContainer.appendChild(star);
  }

  // Adicionar efeito de sparkles nos botões
  const buttons = document.querySelectorAll('button, .button');
  buttons.forEach(button => {
    button.addEventListener('mousemove', (e) => {
      const x = e.pageX - button.offsetLeft;
      const y = e.pageY - button.offsetTop;
      
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      
      button.appendChild(sparkle);
      
      setTimeout(() => {
        button.removeChild(sparkle);
      }, 1000);
    });
  });

  // Adicionar efeito de pulsação em elementos importantes
  setInterval(() => {
    const importantElements = document.querySelectorAll('h1, h2, .logo');
    importantElements.forEach(el => {
      el.style.transform = 'scale(1.05)';
      setTimeout(() => {
        el.style.transform = 'scale(1)';
      }, 200);
    });
  }, 5000);
});