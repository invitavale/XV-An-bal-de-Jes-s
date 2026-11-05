// Variables globales
let isPlaying = false;
let currentSlide = 0;
let totalSlides = 0;
let enableMusic = false;
let pausedByVisibility = false;

// ===================== MÚSICA (audio local, sin YouTube) =====================
// Clave para iOS Safari: audio.play() se llama de forma SÍNCRONA dentro del
// click del botón "Ingresar con música". Así Safari lo acepta como gesto del
// usuario y deja sonar el audio. Nada de setTimeout ni awaits antes del play().
function getAudio() {
    return document.getElementById('bgMusic');
}

function showMusicButton() {
    const musicPlayer = document.getElementById('musicPlayer');
    if (musicPlayer) musicPlayer.style.display = 'block';
}

function hideWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.style.display = 'none';
}

// La canción arranca en el segundo 11 (y al repetirse vuelve al segundo 11)
const MUSIC_START = 11;
let musicStartedOnce = false;

function playMusic() {
    const audio = getAudio();
    if (!audio) return;
    if (!musicStartedOnce) {
        musicStartedOnce = true;
        try { if (audio.currentTime < MUSIC_START) audio.currentTime = MUSIC_START; } catch (e) {}
    }
    audio.muted = false;
    audio.volume = 1;
    const p = audio.play();
    if (p && typeof p.then === 'function') {
        p.then(function () {
            isPlaying = true;
            updateMusicIcon();
        }).catch(function () {
            // Si el navegador lo bloqueó, queda el botón flotante para tocarlo.
            isPlaying = false;
            updateMusicIcon();
        });
    } else {
        isPlaying = true;
        updateMusicIcon();
    }
}

function pauseMusic() {
    const audio = getAudio();
    if (!audio) return;
    audio.pause();
    isPlaying = false;
    updateMusicIcon();
}

// Llamada desde intro.js dentro del toque que inicia el video
function startMusicFromGesture() {
    enableMusic = true;
    playMusic(); // síncrono dentro del gesto -> funciona en Safari/iPhone
}
window.startMusicFromGesture = startMusicFromGesture;

function enterWithMusicClick() {
    enableMusic = true;
    hideWelcomeModal();
    showMusicButton();
    playMusic(); // síncrono dentro del gesto -> funciona en Safari/iPhone
}

function enterWithoutMusicClick() {
    enableMusic = false;
    hideWelcomeModal();
    showMusicButton(); // por si luego quieren activarla
    isPlaying = false;
    updateMusicIcon();
}

function toggleMusic() {
    const audio = getAudio();
    if (!audio) return;
    if (audio.paused) {
        enableMusic = true;
        playMusic();
    } else {
        pauseMusic();
    }
}

function setupMusic() {
    const audio = getAudio();
    const btnWith = document.getElementById('enterWithMusic');
    const btnWithout = document.getElementById('enterWithoutMusic');
    const musicToggle = document.getElementById('musicToggle');

    if (btnWith && !btnWith.dataset.bound) {
        btnWith.dataset.bound = '1';
        btnWith.addEventListener('click', enterWithMusicClick);
    }
    if (btnWithout && !btnWithout.dataset.bound) {
        btnWithout.dataset.bound = '1';
        btnWithout.addEventListener('click', enterWithoutMusicClick);
    }
    if (musicToggle && !musicToggle.dataset.bound) {
        musicToggle.dataset.bound = '1';
        musicToggle.addEventListener('click', toggleMusic);
    }

    if (audio && !audio.dataset.bound) {
        audio.dataset.bound = '1';
        // Mantener el ícono sincronizado con el estado real del audio
        audio.addEventListener('playing', function () { isPlaying = true; updateMusicIcon(); });
        audio.addEventListener('pause', function () { isPlaying = false; updateMusicIcon(); });
        audio.addEventListener('error', function () {
            console.log('No se pudo cargar musica.mp3');
            isPlaying = false;
            updateMusicIcon();
        });
        audio.addEventListener('loadedmetadata', function () {
            try { if (audio.currentTime < MUSIC_START) audio.currentTime = MUSIC_START; } catch (e) {}
        });
        // Repetir desde el segundo 11
        audio.addEventListener('ended', function () {
            try { audio.currentTime = MUSIC_START; } catch (e) {}
            if (enableMusic) audio.play().catch(function () {});
        });
        // Empezar a descargar desde ya para que suene al instante al tocar
        try { audio.load(); } catch (e) {}
    }
}

// Pausar si cierran/cambian de pestaña o bloquean el teléfono, y retomar al volver
document.addEventListener('visibilitychange', function () {
    const audio = getAudio();
    if (!audio) return;
    if (document.hidden) {
        if (!audio.paused) {
            pausedByVisibility = true;
            audio.pause();
        }
    } else if (pausedByVisibility && enableMusic) {
        pausedByVisibility = false;
        playMusic();
    }
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeCountdown();
    initializeCarousel();
    setupMusic();

    // El intro en video (intro.js) reemplaza el modal de bienvenida
});

function updateMusicIcon() {
    const volumeIcon = document.getElementById('volumeIcon');
    
    if (volumeIcon) {
        if (isPlaying) {
            volumeIcon.innerHTML = `
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#0B1C3D" stroke="#fff" stroke-width="1"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08" stroke="#0B1C3D" stroke-width="2"></path>
                <circle cx="6.5" cy="12" r="1" fill="#FFE39A"/>
            `;
        } else {
            volumeIcon.innerHTML = `
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#0B1C3D" stroke="#fff" stroke-width="1"></polygon>
                <line x1="19" y1="9" x2="17" y2="11" stroke="#ff6b6b" stroke-width="2"></line>
                <line x1="17" y1="9" x2="19" y2="11" stroke="#ff6b6b" stroke-width="2"></line>
                <circle cx="6.5" cy="12" r="1" fill="#ff6b6b"/>
            `;
        }
    }
}

// Countdown
function initializeCountdown() {
    const targetDate = new Date('2026-12-29T18:00:00-04:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;
        
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        } else {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Carrusel
function initializeCarousel() {
    const track = document.getElementById('carouselTrack');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (!track) return;

    // calcular total dinámicamente
    const items = track.querySelectorAll('.carousel-item');
    totalSlides = items.length;
    const totalSlidesElement = document.getElementById('totalSlides');
    if (totalSlidesElement) totalSlidesElement.textContent = totalSlides;

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        });
    }

    // Ajuste inicial para asegurar cálculo correcto tras el render
    updateCarousel();
    requestAnimationFrame(updateCarousel);
    setTimeout(updateCarousel, 200);

    // Auto-play del carrusel
    setInterval(() => {
        nextSlide();
    }, 2500);
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    if (track) {
        const items = track.querySelectorAll('.carousel-item');
        if (!items.length) return;
        const container = track.parentElement;

        // Temporarily reset transform to measure actual positions
        const previousTransform = track.style.transform;
        track.style.transform = 'none';

        const firstRect = items[0].getBoundingClientRect();
        const secondRect = items[1] ? items[1].getBoundingClientRect() : null;
        const stepWidth = Math.max(1, secondRect ? Math.round(secondRect.left - firstRect.left) : Math.round(firstRect.width));

        const containerWidth = Math.round(container.getBoundingClientRect().width);
        const visibleCount = Math.max(1, Math.floor((containerWidth + 1) / stepWidth));
        const maxIndex = Math.max(0, totalSlides - visibleCount);

        // Detecta si hay que dar la vuelta (de la última foto a la 1, o viceversa)
        let wrapped = false;
        if (currentSlide > maxIndex) { currentSlide = 0; wrapped = true; }
        if (currentSlide < 0) { currentSlide = maxIndex; wrapped = true; }

        const trackRect = track.getBoundingClientRect();
        const baseLeft = Math.round(firstRect.left - trackRect.left);
        const translateXpx = -Math.round(baseLeft + (currentSlide * stepWidth));

        if (wrapped) {
            // Al dar la vuelta, salta directo a la foto 1 sin animar el regreso
            // (evita el efecto de "devolverse" deslizando hacia atrás por todas las fotos)
            const prevTransition = track.style.transition;
            track.style.transition = 'none';
            track.style.transform = `translateX(${translateXpx}px)`;
            void track.offsetWidth; // fuerza reflow para aplicar el salto sin animación
            track.style.transition = prevTransition || '';
        } else {
            // Apply transform
            track.style.transform = `translateX(${translateXpx}px)`;
        }
        // console.log('Carousel moved to slide:', { currentSlide, visibleCount, maxIndex, translateXpx, stepWidth, baseLeft });
    }
    updateSlideCounter();
    markCenterCarouselItem();
}

function nextSlide() {
    currentSlide++;
    updateCarousel();
}

function previousSlide() {
    currentSlide--;
    updateCarousel();
}

function updateSlideCounter() {
    const currentSlideElement = document.getElementById('currentSlide');
    const totalSlidesElement = document.getElementById('totalSlides');
    if (currentSlideElement) currentSlideElement.textContent = (currentSlide + 1);
    if (totalSlidesElement) totalSlidesElement.textContent = totalSlides;
}

// Mark center carousel item on desktop
function markCenterCarouselItem() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    const items = Array.from(track.querySelectorAll('.carousel-item'));
    if (!items.length) return;
    items.forEach(it => it.classList.remove('is-center'));

    const firstItem = items[0];
    const container = track.parentElement;
    const itemWidth = firstItem.getBoundingClientRect().width;
    const containerWidth = container.getBoundingClientRect().width;
    const visibleCount = Math.max(1, Math.floor(containerWidth / itemWidth));

    const centerIndex = (currentSlide + Math.floor(visibleCount / 2)) % items.length;
    items[centerIndex].classList.add('is-center');
}

// Hook into carousel updates
const _origUpdateCarousel = typeof updateCarousel === 'function' ? updateCarousel : null;
if (_origUpdateCarousel) {
    window.updateCarousel = function() {
        _origUpdateCarousel();
        markCenterCarouselItem();
    };
}

window.addEventListener('resize', markCenterCarouselItem);

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(markCenterCarouselItem, 200);
});

// Funciones de los botones
function openLocation(location) {
    // Enlaces de ejemplo (dirección ficticia) - ceremonia y celebración
    const mapsUrls = {
        ceremony: "https://maps.app.goo.gl/qb4aGMMEwRixPiik6",
        reception: "https://maps.app.goo.gl/qb4aGMMEwRixPiik6"
    };
    const mapsUrl = mapsUrls[location] || mapsUrls.ceremony;
    window.open(mapsUrl, '_blank');
}

// NOTA: esta es una plantilla de ejemplo. Reemplaza el contenido de estas
// funciones con tu propio enlace (Google Drive, Google Form, lista de
// regalos, etc.) cuando personalices la invitación.

function sharePhotos() {
    // Ejemplo: aquí se debe colocar el enlace real a la carpeta de Google Drive.
    window.open('https://photos.app.goo.gl/p9PGQHWrvLG1Bpj28', '_blank');
}

function showDressCode() {
    const modal = document.getElementById('dresscodeModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeDressCodeModal() {
    // El click dentro de la tarjeta del modal usa stopPropagation(), así que
    // esta función solo se dispara al hacer click en el fondo oscuro o en la X.
    const modal = document.getElementById('dresscodeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Regalos: "Ver más" muestra los datos bancarios
document.addEventListener('DOMContentLoaded', function () {
    const more = document.getElementById('giftMore');
    const card = document.getElementById('bankCard');
    if (!more || !card) return;
    more.addEventListener('click', function () {
        const open = card.hidden;
        card.hidden = !open;
        card.classList.toggle('is-open', open);
        more.textContent = open ? 'Ver menos' : 'Ver más';
        more.setAttribute('aria-expanded', String(open));
        if (open) setTimeout(function () { card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 150);
    });
});

// Brillo: estrellitas que titilan sobre toda la invitación
document.addEventListener('DOMContentLoaded', function () {
    const layer = document.createElement('div');
    layer.className = 'sky-sparkles';
    layer.setAttribute('aria-hidden', 'true');
    const count = window.innerWidth < 700 ? 22 : 38;
    for (let i = 0; i < count; i++) {
        const el = document.createElement('i');
        if (Math.random() < 0.35) el.className = 'star';
        el.style.setProperty('--x', (Math.random() * 100).toFixed(2) + '%');
        el.style.setProperty('--y', (Math.random() * 100).toFixed(2) + '%');
        el.style.setProperty('--s', (1.5 + Math.random() * 2.5).toFixed(1) + 'px');
        el.style.setProperty('--d', (2.8 + Math.random() * 3.5).toFixed(2) + 's');
        el.style.setProperty('--delay', (-Math.random() * 6).toFixed(2) + 's');
        layer.appendChild(el);
    }
    document.body.appendChild(layer);
});

// Copiar número de cuenta
document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('copyAccount');
    const num = document.getElementById('bankNumber');
    if (!btn || !num) return;
    btn.addEventListener('click', function () {
        const text = num.textContent.trim();
        const done = function () {
            const old = btn.textContent;
            btn.textContent = '¡Copiado!';
            setTimeout(function () { btn.textContent = old; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
        } else { fallbackCopy(text); done(); }
    });
    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
    }
});

function showGifts() {
    window.open('https://cuentapro11.github.io/numero-cuenta-ejemplo/', '_blank');
}

function confirmAttendance() {
    // Ejemplo: aquí se debe colocar el enlace real al formulario de Google Forms.
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSdIYoM33yAkMmS4DZCRVmO9_IE0gZT4eEw8cV0r2PgWlYE0Ag/viewform?usp=header', '_blank');
}

// Sistema de Toast
function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastContent = document.getElementById('toastContent');
    
    toastContent.innerHTML = `
        <h4 style="font-weight: 700; color: #fff; margin-bottom: 0.35rem; letter-spacing: 0.2px;">${title}</h4>
        <p style="color: #ddd;">${message}</p>
    `;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Nota: el efecto de portada ahora se logra 100% con CSS (hero fijo detrás
// del contenido, ver .hero-section y .content en CCSB.css), igual que en
// boda100L. Ya no hace falta mover nada por JS en el scroll.


// Forzar limpieza de caches en clientes antiguos
(function() {
  function clearCaches() {
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      }).catch(() => {});
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearCaches);
  } else {
    clearCaches();
  }
})();
