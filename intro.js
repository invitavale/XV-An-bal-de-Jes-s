// =====================================================================
// INTRO: VIDEO -> MENSAJE -> INVITACIÓN
// 1) El video arranca en pausa mostrando el sobre cerrado.
//    Un toque es el detonante: se reproduce el video (mudo) y se inicia
//    musica.mp3 DENTRO del mismo gesto, de forma síncrona. Así lo aceptan
//    Safari/iPhone, Chrome, Firefox, Samsung Internet, etc.
// 2) Al final del video, el cielo se disuelve en la escena del mensaje:
//    el texto aparece palabra por palabra y luego se "escribe" la firma.
// 3) Con el botón (o solo, tras unos segundos) entra la luz dorada con
//    chispas y la portada aparece enfocándose desde la luz.
// =====================================================================
(function () {
    var intro = document.getElementById('introScreen');
    var video = document.getElementById('introVideo');
    var skipBtn = document.getElementById('introSkip');
    var msgText = document.getElementById('msgText');
    var msgSign = document.getElementById('msgSign');
    var msgContinue = document.getElementById('msgContinue');
    var root = document.documentElement;
    if (!intro || !video) { root.classList.remove('intro-active'); return; }

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- Ajustes de tiempo ----
    var LEAD_TIME = 1.0;        // seg. antes del final del video en que entra el mensaje
    var CHAR_DELAY = 42;         // ms entre letra y letra (más alto = más lento)
    var TEXT_START = 1700;      // ms desde que entra el mensaje hasta la 1ª palabra
    var SIGN_DURATION = 3200;   // ms que tarda en "escribirse" la firma
    var AUTO_CONTINUE = 8000;   // ms que se queda el mensaje completo antes de avanzar solo

    var phase = 'idle';         // idle -> video -> message -> leaving
    var timers = [];
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    // Siempre arrancar arriba de la página
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    // Garantiza que el video esté mudo (requisito para reproducir en móviles)
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    try { video.load(); } catch (e) {}

    // Partir el texto en letras (agrupadas por palabra para no cortar palabras)
    var chars = [];
    if (msgText) {
        var raw = msgText.textContent.trim().split(/\s+/);
        msgText.setAttribute('aria-label', msgText.textContent.trim());
        msgText.textContent = '';
        raw.forEach(function (w, i) {
            var word = document.createElement('span');
            word.className = 'w';
            word.setAttribute('aria-hidden', 'true');
            Array.from(w).forEach(function (ch) {
                var c = document.createElement('span');
                c.className = 'c';
                c.textContent = ch;
                word.appendChild(c);
                chars.push(c);
            });
            msgText.appendChild(word);
            if (i < raw.length - 1) {
                msgText.appendChild(document.createTextNode(' '));
                chars.push(null); // pausa breve en el espacio
            }
        });
    }

    function startMusic() {
        if (typeof window.startMusicFromGesture === 'function') {
            window.startMusicFromGesture();
            return;
        }
        var audio = document.getElementById('bgMusic');
        if (audio) { try { audio.play(); } catch (e) {} }
    }

    // ================= 1) VIDEO =================
    function onTap(e) {
        if (phase !== 'idle') return;
        if (e && e.target && e.target.closest && e.target.closest('.intro-skip, .msg-continue')) return;
        phase = 'video';

        startMusic(); // síncrono dentro del gesto del usuario

        intro.classList.add('is-playing');
        var p;
        try { p = video.play(); } catch (err) { p = null; }
        if (p && typeof p.then === 'function') {
            p.then(onVideoStarted).catch(function () { showMessage(); });
        } else {
            onVideoStarted();
        }
        later(function () { intro.classList.add('can-skip'); }, 1500);
    }

    function onVideoStarted() {
        var d = isFinite(video.duration) && video.duration > 0 ? video.duration : 11;
        // Seguro por si el video se traba: nunca dejar al invitado atrapado
        later(showMessage, (d + 6) * 1000);
        watchEnd();
    }

    function watchEnd() {
        if (phase !== 'video') return;
        var d = video.duration;
        if (isFinite(d) && d > 0 && video.currentTime >= d - LEAD_TIME) {
            showMessage();
            return;
        }
        requestAnimationFrame(watchEnd);
    }

    // ================= 2) MENSAJE =================
    function showMessage() {
        if (phase === 'message' || phase === 'leaving') return;
        phase = 'message';
        clearTimers();
        intro.classList.remove('is-buffering');
        intro.classList.add('is-message', 'can-skip');
        var msg = document.getElementById('introMessage');
        if (msg) msg.removeAttribute('aria-hidden');

        // Liberar el video cuando ya no se ve
        later(function () { try { video.pause(); } catch (e) {} }, 1800);

        var start = reduceMotion ? 600 : TEXT_START;
        var step = reduceMotion ? 0 : CHAR_DELAY;
        var t = start;
        chars.forEach(function (c, i) {
            if (c) {
                later(function () { c.classList.add('on'); }, t);
                // pausa un poquito más en comas y puntos
                var ch = c.textContent;
                t += step * (ch === ',' ? 6 : ch === '.' ? 10 : 1);
            } else {
                t += step;
            }
        });
        var textEnd = t + 900;

        later(function () { if (msgSign) msgSign.classList.add('on'); }, textEnd);
        var signEnd = textEnd + (reduceMotion ? 100 : SIGN_DURATION);

        later(function () {
            if (skipBtn) skipBtn.classList.add('hide');
            if (msgContinue) {
                msgContinue.style.setProperty('--auto', AUTO_CONTINUE + 'ms');
                msgContinue.classList.add('on');
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () { msgContinue.classList.add('counting'); });
                });
            }
        }, signEnd);

        later(leaveToInvitation, signEnd + AUTO_CONTINUE);
    }

    // Mostrar todo el mensaje de golpe (si tocan "Saltar" mientras se escribe)
    function completeMessage() {
        clearTimers();
        chars.forEach(function (c) { if (c) c.classList.add('on'); });
        if (msgSign) msgSign.classList.add('on');
        later(leaveToInvitation, 1600);
    }

    // ================= 3) INVITACIÓN =================
    function leaveToInvitation() {
        if (phase === 'leaving') return;
        phase = 'leaving';
        clearTimers();
        intro.classList.add('is-leaving');
        if (!reduceMotion) setTimeout(burstSparkles, 450);
        // Cuando la luz cubre la pantalla, se descubre la invitación
        setTimeout(revealInvitation, reduceMotion ? 300 : 1000);
    }

    function revealInvitation() {
        window.scrollTo(0, 0);
        root.classList.add('intro-revealing');
        void root.offsetWidth; // reflow: que las transiciones partan del estado inicial
        root.classList.remove('intro-active');
        intro.classList.add('is-gone');

        // Estrella fugaz sobre la portada, 2 segundos después de entrar
        if (!reduceMotion) setTimeout(heroShootingStar, 2000);

        var music = document.getElementById('musicPlayer');
        if (music) {
            music.style.display = 'block';
            music.classList.add('is-entering');
        }

        setTimeout(function () {
            try { video.pause(); } catch (e) {}
            video.removeAttribute('src');
            try { video.load(); } catch (e) {}
            if (intro.parentNode) intro.parentNode.removeChild(intro);
        }, 1500);

        setTimeout(function () {
            root.classList.remove('intro-revealing');
            if (music) music.classList.remove('is-entering');
        }, 3600);
    }

    // ---------- Estrella fugaz de la portada ----------
    function heroShootingStar() {
        var hero = document.querySelector('.hero-section');
        if (!hero) return;
        var star = document.createElement('div');
        star.className = 'hero-shooting-star';
        star.setAttribute('aria-hidden', 'true');
        star.innerHTML = '<span class="hss-trail"></span>';
        hero.appendChild(star);
        setTimeout(function () { star.remove(); }, 3000);
    }

    // ---------- Chispas doradas ----------
    function burstSparkles() {
        var canvas = document.createElement('canvas');
        canvas.className = 'intro-sparkles';
        document.body.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        if (!ctx) { canvas.remove(); return; }

        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var W = window.innerWidth, H = window.innerHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        var cx = W / 2, cy = H * 0.47;
        var colors = ['#FFFFFF', '#FFF3C4', '#FFE39A', '#F2C94C', '#E0A82E'];
        var parts = [];
        var count = W < 600 ? 90 : 150;
        for (var i = 0; i < count; i++) {
            var a = Math.random() * Math.PI * 2;
            var sp = 2 + Math.random() * 9;
            parts.push({
                x: cx, y: cy,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 1.2,
                r: 0.8 + Math.random() * 2.6,
                star: Math.random() < 0.28,
                rot: Math.random() * Math.PI,
                c: colors[(Math.random() * colors.length) | 0],
                life: 0,
                max: 70 + Math.random() * 70
            });
        }

        function drawStar(x, y, r, rot) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.beginPath();
            for (var k = 0; k < 4; k++) {
                ctx.lineTo(0, -r * 3);
                ctx.rotate(Math.PI / 4);
                ctx.lineTo(0, -r * 0.7);
                ctx.rotate(Math.PI / 4);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        function frame() {
            ctx.clearRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'lighter';
            var alive = 0;
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                if (p.life >= p.max) continue;
                alive++;
                p.life++;
                p.vx *= 0.965;
                p.vy = p.vy * 0.965 + 0.035;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += 0.03;
                var t = p.life / p.max;
                var alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
                ctx.globalAlpha = Math.max(0, alpha) * (0.6 + 0.4 * Math.sin(p.life * 0.4 + i));
                ctx.fillStyle = p.c;
                ctx.shadowColor = '#F2C94C';
                ctx.shadowBlur = 10;
                if (p.star) {
                    drawStar(p.x, p.y, p.r, p.rot);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            if (alive > 0) requestAnimationFrame(frame);
            else canvas.remove();
        }
        requestAnimationFrame(frame);
    }

    // ---------- Eventos ----------
    // El contenedor nunca debe desplazarse (Safari antiguo ignora overflow: clip)
    intro.addEventListener('scroll', function () {
        if (intro.scrollTop || intro.scrollLeft) { intro.scrollTop = 0; intro.scrollLeft = 0; }
    });
    intro.addEventListener('click', onTap);
    intro.addEventListener('keydown', function (e) {
        if (phase === 'idle' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onTap(e); }
    });

    if (skipBtn) {
        skipBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (phase === 'idle') { onTap(); showMessage(); }
            else if (phase === 'video') showMessage();
            else if (phase === 'message') completeMessage();
        });
    }

    if (msgContinue) {
        msgContinue.addEventListener('click', function (e) {
            e.stopPropagation();
            leaveToInvitation();
        });
    }

    video.addEventListener('ended', function () { if (phase === 'video') showMessage(); });
    video.addEventListener('waiting', function () { if (phase === 'video') intro.classList.add('is-buffering'); });
    video.addEventListener('playing', function () { intro.classList.remove('is-buffering'); });
    video.addEventListener('error', function () {
        // Si el video no carga, el toque igual inicia la música y sigue al mensaje
        if (phase === 'video') showMessage();
    });

    // Si cambian de pestaña durante el video, retomar al volver
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden && phase === 'video' && video.paused) {
            var p = video.play();
            if (p && p.catch) p.catch(function () { showMessage(); });
        }
    });
})();
