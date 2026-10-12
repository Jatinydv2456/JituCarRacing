const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const $ = (id) => document.getElementById(id);

const W = 360;
const H = 600;
const road = { x: 42, width: 276 };
const laneWidth = road.width / 3;

let player;
let enemies = [];
let coinsOnRoad = [];
let particles = [];
let score = 0;
let coinCount = 0;
let speed = 4;
let roadOffset = 0;
let spawnTimer = 0;
let coinTimer = 0;
let lastTime = 0;
let running = false;
let animationId = 0;
let keys = { left: false, right: false };
let best = 0;

try {
  best = Number(localStorage.getItem("turboBest")) || 0;
} catch (error) {
  best = 0;
}

$("bestScore").textContent = best;

function resetGame() {
  player = {
    x: W / 2 - 19,
    y: H - 112,
    width: 38,
    height: 66,
    moveSpeed: 5
  };

  enemies = [];
  coinsOnRoad = [];
  particles = [];
  score = 0;
  coinCount = 0;
  speed = 4;
  roadOffset = 0;
  spawnTimer = 0;
  coinTimer = 0;
  keys.left = false;
  keys.right = false;

  updateHUD();
}

function updateHUD() {
  $("score").textContent = Math.floor(score);
  $("coins").textContent = coinCount;
  $("speed").textContent = Math.floor(speed * 10);
}

function roundedRect(x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawRoad() {
  // Grass
  ctx.fillStyle = "#285b39";
  ctx.fillRect(0, 0, W, H);

  // Road surface
  ctx.fillStyle = "#343b45";
  ctx.fillRect(road.x, 0, road.width, H);

  // Road shoulders
  ctx.fillStyle = "#d5d6d1";
  ctx.fillRect(road.x, 0, 5, H);
  ctx.fillRect(road.x + road.width - 5, 0, 5, H);

  // Roadside grass details
  for (let y = -30; y < H + 30; y += 70) {
    const yy = (y + roadOffset * 0.8) % (H + 70);
    ctx.fillStyle = "#3e7748";
    ctx.fillRect(10, yy, 15, 7);
    ctx.fillRect(335, yy + 30, 13, 6);
  }

  // Lane markings
  ctx.fillStyle = "#e8e8d4";

  for (let lane = 1; lane < 3; lane++) {
    const x = road.x + lane * laneWidth - 2;

    for (let y = -60; y < H + 60; y += 90) {
      const yy = (y + roadOffset) % (H + 90) - 30;
      ctx.fillRect(x, yy, 4, 42);
    }
  }

  // Roadside red markers
  for (let y = -30; y < H + 30; y += 48) {
    const yy = (y + roadOffset) % (H + 48) - 20;
    ctx.fillStyle = "#ff5b55";
    ctx.fillRect(road.x - 7, yy, 5, 20);
    ctx.fillRect(road.x + road.width + 2, yy, 5, 20);
  }
}

function drawCar(car, color, isPlayer = false) {
  const { x, y, width: w, height: h } = car;

  // Wheels
  roundedRect(x - 4, y + 10, 7, 18, 3, "#111820");
  roundedRect(x + w - 3, y + 10, 7, 18, 3, "#111820");
  roundedRect(x - 4, y + h - 28, 7, 18, 3, "#111820");
  roundedRect(x + w - 3, y + h - 28, 7, 18, 3, "#111820");

  // Car body
  roundedRect(x, y, w, h, 9, "#101820");
  roundedRect(x + 2, y + 2, w - 4, h - 4, 8, color);

  // Front windshield
  roundedRect(x + 6, y + 11, w - 12, 17, 5, "#bce6f3");

  // Rear window
  roundedRect(x + 7, y + h - 22, w - 14, 13, 4, "#182d3a");

  // Roof detail
  roundedRect(x + 7, y + 31, w - 14, 9, 3,
    isPlayer ? "#ecffff" : "#e0e5e9");

  // Headlights and tail lights
  roundedRect(x + 4, y + 3, 8, 5, 2, "#fff5b0");
  roundedRect(x + w - 12, y + 3, 8, 5, 2, "#fff5b0");
  roundedRect(x + 4, y + h - 7, 8, 4, 2, "#ff4d4d");
  roundedRect(x + w - 12, y + h - 7, 8, 4, 2, "#ff4d4d");

  if (isPlayer) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + w / 2 - 2, y + 43, 4, 7);
  }
}

function drawCoin(coin) {
  ctx.save();
  ctx.translate(coin.x, coin.y);

  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fillStyle = "#ffbf24";
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#fff0a2";
  ctx.stroke();

  ctx.fillStyle = "#8d5700";
  ctx.font = "bold 15px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", 0, 1);

  ctx.restore();
}

function drawScene() {
  drawRoad();

  for (const coin of coinsOnRoad) {
    drawCoin(coin);
  }

  for (const enemy of enemies) {
    drawCar(enemy, enemy.color);
  }

  if (player) {
    drawCar(player, "#17d6a0", true);
  }

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 30);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  }

  ctx.globalAlpha = 1;
}

function spawnEnemy() {
  const lane = Math.floor(Math.random() * 3);
  const colors = ["#ff595e", "#f4a261", "#8e7dff", "#46a0ef"];

  enemies.push({
    x: road.x + lane * laneWidth + laneWidth / 2 - 19,
    y: -80,
    width: 38,
    height: 66,
    color: colors[Math.floor(Math.random() * colors.length)],
    extraSpeed: Math.random() * 1.3
  });
}

function spawnCoin() {
  const lane = Math.floor(Math.random() * 3);

  coinsOnRoad.push({
    x: road.x + lane * laneWidth + laneWidth / 2,
    y: -25,
    radius: 12
  });
}

function overlaps(a, b) {
  // Smaller collision boxes make the game feel fairer.
  const insetA = 5;
  const insetB = b.radius ? b.radius : 5;

  const ax1 = a.x + insetA;
  const ay1 = a.y + insetA;
  const ax2 = a.x + a.width - insetA;
  const ay2 = a.y + a.height - insetA;

  if (b.radius) {
    const closestX = Math.max(ax1, Math.min(b.x, ax2));
    const closestY = Math.max(ay1, Math.min(b.y, ay2));
    const dx = b.x - closestX;
    const dy = b.y - closestY;
    return dx * dx + dy * dy < b.radius * b.radius;
  }

  return (
    ax1 < b.x + b.width - insetB &&
    ax2 > b.x + insetB &&
    ay1 < b.y + b.height - insetB &&
    ay2 > b.y + insetB
  );
}

function burst(x, y, color) {
  for (let i = 0; i < 18; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7,
      color,
      life: 30
    });
  }
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  }

  particles = particles.filter((p) => p.life > 0);
}

function endGame() {
  running = false;
  keys.left = false;
  keys.right = false;

  const final = Math.floor(score);

  if (final > best) {
    best = final;
    $("bestScore").textContent = best;

    try {
      localStorage.setItem("turboBest", String(best));
    } catch (error) {
      // The game can still work if storage is unavailable.
    }
  }

  $("finalScore").textContent = final;
  $("finalCoins").textContent = coinCount;
  $("gameOverScreen").classList.remove("hidden");
}

function update(dt) {
  const step = Math.min(dt / 16.67, 2);

  // Difficulty gradually increases.
  speed = Math.min(4 + score / 500, 9);
  score += step * speed * 0.12;
  roadOffset = (roadOffset + speed * step) % 90;

  if (keys.left) {
    player.x -= player.moveSpeed * step;
  }

  if (keys.right) {
    player.x += player.moveSpeed * step;
  }

  player.x = Math.max(
    road.x + 7,
    Math.min(road.x + road.width - player.width - 7, player.x)
  );

  spawnTimer += dt;
  coinTimer += dt;

  const spawnInterval = Math.max(430, 1050 - score * 1.2);

  if (spawnTimer > spawnInterval) {
    spawnEnemy();
    spawnTimer = 0;
  }

  if (coinTimer > 1150) {
    spawnCoin();
    coinTimer = 0;
  }

  for (const enemy of enemies) {
    enemy.y += (speed + enemy.extraSpeed) * step;

    if (overlaps(player, enemy)) {
      burst(player.x + player.width / 2,
        player.y + player.height / 2, "#ff645d");
      updateParticles();
      drawScene();
      endGame();
      return;
    }
  }

  for (const coin of coinsOnRoad) {
    coin.y += speed * step;

    if (!coin.collected && overlaps(player, coin)) {
      coin.collected = true;
      coinCount++;
      score += 25;
      burst(coin.x, coin.y, "#ffd166");
    }
  }

  enemies = enemies.filter((e) => e.y < H + 90);
  coinsOnRoad = coinsOnRoad.filter(
    (c) => c.y < H + 30 && !c.collected
  );

  updateParticles();
  updateHUD();
}

function frame(timestamp) {
  if (!running) return;

  const dt = lastTime ? timestamp - lastTime : 16.67;
  lastTime = timestamp;

  update(dt);
  drawScene();

  if (running) {
    animationId = requestAnimationFrame(frame);
  }
}

function startGame() {
  cancelAnimationFrame(animationId);
  resetGame();

  $("startScreen").classList.add("hidden");
  $("gameOverScreen").classList.add("hidden");

  running = true;
  lastTime = 0;
  animationId = requestAnimationFrame(frame);
}

function drawPreview() {
  resetGame();
  drawScene();
}

// Keyboard controls
document.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = true;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = true;
  }

  if (
    (event.key === "Enter" || event.key === " ") &&
    !running
  ) {
    startGame();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = false;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = false;
  }
});

function setupButton(id, direction) {
  const button = $(id);

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    keys[direction] = true;

    try {
      button.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is optional.
    }
  });

  const release = (event) => {
    event.preventDefault();
    keys[direction] = false;
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", () => {
    keys[direction] = false;
  });
}

setupButton("leftBtn", "left");
setupButton("rightBtn", "right");

$("startBtn").addEventListener("click", startGame);
$("restartBtn").addEventListener("click", startGame);

// Draw the road before the player starts.
drawPreview();