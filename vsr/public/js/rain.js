const canvas = document.getElementById('rain');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initDrops();
});

const DROPS = 120;
let drops = [];

function initDrops() {
  drops = Array.from({ length: DROPS }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    len: Math.random() * 18 + 8,
    speed: Math.random() * 4 + 2,
    opacity: Math.random() * 0.4 + 0.1,
    width: Math.random() * 0.8 + 0.3
  }));
}

initDrops();

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drops.forEach(d => {
    ctx.save();
    ctx.globalAlpha = d.opacity;
    ctx.strokeStyle = '#8888cc';
    ctx.lineWidth = d.width;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - 1, d.y + d.len);
    ctx.stroke();
    ctx.restore();
    d.y += d.speed;
    if (d.y > canvas.height) {
      d.y = -d.len;
      d.x = Math.random() * canvas.width;
    }
  });
  requestAnimationFrame(draw);
}

draw();
