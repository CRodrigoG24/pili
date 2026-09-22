/* ===================================================
   TQM PILI - INTERACCIÓN DE TEATRO, AUDIO Y BOTONES 3D
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const btnApretame = document.getElementById('btn-apretame');
  const btnReplay = document.getElementById('btn-replay');
  const curtainsLayer = document.getElementById('curtains-layer');
  const introOverlay = document.getElementById('intro-overlay');
  const endingOverlay = document.getElementById('ending-overlay');
  const video = document.getElementById('flower-video');
  const spotlight = document.getElementById('spotlight');
  const heartsContainer = document.getElementById('hearts-container');

  // Controles de video auxiliares
  const ctrlPlayPause = document.getElementById('ctrl-play-pause');
  const ctrlPlayIcon = document.getElementById('ctrl-play-icon');
  const ctrlProgressBar = document.getElementById('ctrl-progress-bar');
  const ctrlProgressFill = document.getElementById('ctrl-progress-fill');
  const ctrlMute = document.getElementById('ctrl-mute');
  const ctrlMuteIcon = document.getElementById('ctrl-mute-icon');
  const videoControls = document.getElementById('video-controls');

  // Inicializar volumen explícitamente a la mitad (0.5)
  video.volume = 0.5;

  // ===================================================
  // SÍNTESIS DE AUDIO PARA BOTÓN TÁCTIL FÍSICO
  // Web Audio API: crea un "clic/pop" mecánico sin archivos externos
  // ===================================================
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playButtonSound(type = 'push') {
    initAudio();
    if (!audioCtx) return;

    try {
      const now = audioCtx.currentTime;

      if (type === 'push') {
        // Sonido de pulsación profunda y satisfactoria
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.09);

        // Segundo toque de agudo para simular el click de plástico
        const clickOsc = audioCtx.createOscillator();
        const clickGain = audioCtx.createGain();
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(850, now);
        clickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

        clickGain.gain.setValueAtTime(0.18, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        clickOsc.connect(clickGain);
        clickGain.connect(audioCtx.destination);

        clickOsc.start(now);
        clickOsc.stop(now + 0.04);
      } else if (type === 'sparkle') {
        // Sonido mágico cute
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + (index * 0.05));

          gain.gain.setValueAtTime(0, now + (index * 0.05));
          gain.gain.linearRampToValueAtTime(0.15, now + (index * 0.05) + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (index * 0.05) + 0.25);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(now + (index * 0.05));
          osc.stop(now + (index * 0.05) + 0.26);
        });
      }
    } catch (e) {
      console.warn('Audio feedback fallback:', e);
    }

    // Vibración háptica en móviles si está soportado
    if (navigator.vibrate) {
      navigator.vibrate(type === 'push' ? [20] : [15, 30, 15]);
    }
  }

  // ===================================================
  // ABRIR TELÓN Y EMPEZAR VIDEO
  // ===================================================
  btnApretame.addEventListener('click', () => {
    // Feedback visual y sonoro del botón físico
    btnApretame.classList.add('pressed');
    playButtonSound('push');

    setTimeout(() => {
      btnApretame.classList.remove('pressed');
    }, 120);

    // Ocultar capa del botón inicial
    introOverlay.classList.add('hidden');

    // Iluminar escenario
    spotlight.classList.add('lit');

    // Abrir telón hacia los costados
    curtainsLayer.classList.add('open');

    // Reproducir video con volumen al 50%
    video.volume = 0.5;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        ctrlPlayIcon.textContent = '⏸️';
      }).catch(err => {
        console.log('Autoplay handled:', err);
        // Si el navegador requiriera interacción adicional, los controles permiten reproducir
        videoControls.classList.add('visible');
      });
    }
  });

  // ===================================================
  // FIN DEL VIDEO: MOSTRAR "TQM PILI 💖"
  // ===================================================
  video.addEventListener('ended', () => {
    // Sonido dulce de celebración
    playButtonSound('sparkle');

    // Mostrar modal final
    endingOverlay.classList.add('show');

    // Lanzar lluvia de corazones y flores amarillas
    startCelebrationHearts();
  });

  // ===================================================
  // BOTÓN REPETIR: CERRAR TELÓN Y REINICIAR
  // ===================================================
  btnReplay.addEventListener('click', () => {
    btnReplay.classList.add('pressed');
    playButtonSound('push');

    setTimeout(() => {
      btnReplay.classList.remove('pressed');
    }, 120);

    // Ocultar modal final y limpiar partículas
    endingOverlay.classList.remove('show');
    stopCelebrationHearts();

    // Detener y rebobinar el video
    video.pause();
    video.currentTime = 0;
    ctrlPlayIcon.textContent = '▶️';
    ctrlProgressFill.style.width = '0%';

    // Cerrar el telón hacia el centro
    curtainsLayer.classList.remove('open');
    spotlight.classList.remove('lit');

    // Esperar a que el telón cierre para volver a mostrar el botón "Aprétame"
    setTimeout(() => {
      introOverlay.classList.remove('hidden');
    }, 900);
  });

  // ===================================================
  // CONTROLES DE REPRODUCCIÓN AUXILIARES
  // ===================================================
  ctrlPlayPause.addEventListener('click', (e) => {
    e.stopPropagation();
    playButtonSound('push');
    if (video.paused) {
      video.play();
      ctrlPlayIcon.textContent = '⏸️';
    } else {
      video.pause();
      ctrlPlayIcon.textContent = '▶️';
    }
  });

  ctrlMute.addEventListener('click', (e) => {
    e.stopPropagation();
    video.muted = !video.muted;
    ctrlMuteIcon.textContent = video.muted ? '🔇' : '🔊';
  });

  video.addEventListener('timeupdate', () => {
    if (video.duration) {
      const percentage = (video.currentTime / video.duration) * 100;
      ctrlProgressFill.style.width = `${percentage}%`;
    }
  });

  ctrlProgressBar.addEventListener('click', (e) => {
    const rect = ctrlProgressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercentage = clickX / rect.width;
    video.currentTime = newPercentage * video.duration;
  });

  // Click en el marco para pausar/reanudar rápidamente
  document.getElementById('video-frame').addEventListener('click', (e) => {
    if (e.target.closest('.video-overlay-controls')) return;
    if (video.paused) {
      video.play();
      ctrlPlayIcon.textContent = '⏸️';
    } else {
      video.pause();
      ctrlPlayIcon.textContent = '▶️';
    }
  });

  // ===================================================
  // LLUVIA DE CORAZONES Y FLORES AMARILLAS CELEBRACIÓN
  // ===================================================
  let heartsInterval = null;
  const cuteIcons = ['💖', '💛', '🌸', '✨', '🌼', '🥰', '💕', '🌷'];

  function startCelebrationHearts() {
    stopCelebrationHearts();

    // Crear oleada inicial
    for (let i = 0; i < 20; i++) {
      setTimeout(createSingleHeart, i * 80);
    }

    // Intervalo continuo mientras esté la pantalla final
    heartsInterval = setInterval(createSingleHeart, 250);
  }

  function stopCelebrationHearts() {
    if (heartsInterval) {
      clearInterval(heartsInterval);
      heartsInterval = null;
    }
    heartsContainer.innerHTML = '';
  }

  function createSingleHeart() {
    if (!heartsContainer) return;
    const heart = document.createElement('div');
    heart.className = 'floating-heart';

    const randomIcon = cuteIcons[Math.floor(Math.random() * cuteIcons.length)];
    heart.textContent = randomIcon;

    // Posición horizontal aleatoria dentro del contenedor
    heart.style.left = `${Math.random() * 90 + 5}%`;

    // Duración de subida variada
    const duration = Math.random() * 2.5 + 2.5;
    heart.style.animationDuration = `${duration}s`;

    // Tamaño variado
    const size = Math.random() * 16 + 20;
    heart.style.fontSize = `${size}px`;

    heartsContainer.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, duration * 1000);
  }
});
