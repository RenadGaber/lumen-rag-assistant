// ---------- Glow background (replaces video) ----------
(function () {
  const canvas = document.getElementById('glowCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }

  function makeParticles() {
    const count = Math.round((canvas.offsetWidth * canvas.offsetHeight) / 9000);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.4 + 0.4) * devicePixelRatio,
      vx: (Math.random() - 0.5) * 0.08 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.08 * devicePixelRatio,
      a: Math.random() * 0.5 + 0.15,
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w / 2, h * 0.38, 0, w / 2, h * 0.38, Math.max(w, h) * 0.6);
    grad.addColorStop(0, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  resize();
  makeParticles();
  if (!reduceMotion) requestAnimationFrame(tick);
  else tick();

  window.addEventListener('resize', () => { resize(); makeParticles(); });
})();

// ---------- Live backend connection ----------
const API_BASE_URL = "http://127.0.0.1:8000"; // change this when you deploy the backend elsewhere

const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

function addMessage(text, sender, sources) {
  const el = document.createElement('div');
  el.className = `chat-msg ${sender}`;
  el.textContent = text;
  if (sources && sources.length) {
    const src = document.createElement('span');
    src.className = 'chat-source';
    src.textContent = 'Source: ' + sources.join(', ');
    el.appendChild(src);
  }
  chatBody.appendChild(el);
  chatBody.scrollTop = chatBody.scrollHeight;
  return el;
}

async function sendQuestion() {
  const question = chatInput.value.trim();
  if (!question) return;

  addMessage(question, 'user');
  chatInput.value = '';
  chatSend.disabled = true;
  const loadingEl = addMessage('Thinking...', 'bot loading');

  try {
    const res = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    loadingEl.remove();
    addMessage(data.answer, 'bot', data.sources);
  } catch (err) {
    loadingEl.remove();
    addMessage(
      "Couldn't reach the backend. Make sure it's running locally (uvicorn app.main:app --reload) on " + API_BASE_URL,
      'bot'
    );
  } finally {
    chatSend.disabled = false;
  }
}

chatSend.addEventListener('click', sendQuestion);
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendQuestion(); });

// ---------- Nav active state ----------
document.querySelectorAll('.nav-link, .mm-link').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const group = link.classList.contains('nav-link') ? '.nav-link' : '.mm-link';
    document.querySelectorAll(group).forEach((l) => l.classList.remove('active'));
    link.classList.add('active');
    if (link.dataset.open === 'chat') openModal('chat');
  });
});

// ---------- Modal helpers ----------
function openModal(name) {
  const overlay = document.getElementById(name === 'chat' ? 'chatOverlay' : 'signOverlay');
  const modal = document.getElementById(name === 'chat' ? 'chatModal' : 'signModal');
  overlay.hidden = false;
  modal.hidden = false;
}
function closeModal(name) {
  const overlay = document.getElementById(name === 'chat' ? 'chatOverlay' : 'signOverlay');
  const modal = document.getElementById(name === 'chat' ? 'chatModal' : 'signModal');
  overlay.hidden = true;
  modal.hidden = true;
}

document.getElementById('ctaBtn').addEventListener('click', (e) => { e.preventDefault(); openModal('chat'); });
document.getElementById('chatClose').addEventListener('click', () => closeModal('chat'));
document.getElementById('chatOverlay').addEventListener('click', () => closeModal('chat'));

document.getElementById('signInBtn').addEventListener('click', (e) => { e.preventDefault(); openModal('sign'); });
document.getElementById('signClose').addEventListener('click', () => closeModal('sign'));
document.getElementById('signOverlay').addEventListener('click', () => closeModal('sign'));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal('chat'); closeModal('sign'); }
});

// ---------- Mobile menu ----------
const burger = document.querySelector('.burger');
const overlay = document.querySelector('.overlay');
const menu = document.querySelector('.mobile-menu');

function openMenu() {
  burger.classList.add('open');
  burger.setAttribute('aria-expanded', 'true');
  overlay.hidden = false;
  menu.hidden = false;
  document.body.classList.add('menu-open');
}
function closeMenu() {
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  overlay.hidden = true;
  menu.hidden = true;
  document.body.classList.remove('menu-open');
}

burger.addEventListener('click', () => {
  burger.classList.contains('open') ? closeMenu() : openMenu();
});
overlay.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
document.querySelectorAll('.mm-link, .mm-signin').forEach(el => el.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 720) closeMenu(); });

// ---------- Stat count-up ----------
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animateStat(el, index) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const duration = 1500 + index * 80;
  const startOffset = 480 + index * 90;

  setTimeout(() => {
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, startOffset);
}

const statEls = document.querySelectorAll('.stat-value');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const idx = Array.from(statEls).indexOf(entry.target);
      animateStat(entry.target, idx);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.25 });

statEls.forEach(el => observer.observe(el));
