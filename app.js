// --- ALIASES & CONFIG ---
const { Engine, World, Bodies, Mouse, MouseConstraint, Body } = Matter;

// Global State
let width = window.innerWidth;
let height = window.innerHeight;
let isGravityActive = false;
let isMusicPlaying = false;
let particles = [];
let confetti = [];
let items = [];

// DOM Elements
const appContainer = document.getElementById('app-container');
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
const gravityToggle = document.getElementById('gravity-toggle');
const gravityLabel = document.getElementById('gravity-toggle-label');
const resetBtn = document.getElementById('reset-btn');
const musicBtn = document.getElementById('music-btn');
const bgMusic = document.getElementById('bg-music');
const letterModal = document.getElementById('letter-modal');
const closeModal = document.getElementById('close-modal');

// Mouse Parallax Trackers
let mouseX = width / 2;
let mouseY = height / 2;
let targetMouseX = width / 2;
let targetMouseY = height / 2;

// --- INITIALIZE STAR CANVAS ---
function initStars() {
  bgCanvas.width = width;
  bgCanvas.height = height;
  particles = [];
  
  const count = Math.min(120, Math.floor((width * height) / 8000));
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.4,
      speedY: Math.random() * 0.12 + 0.03, // slow upward drift
      alpha: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      direction: Math.random() > 0.5 ? 1 : -1,
      parallaxFactor: Math.random() * 0.03 + 0.005
    });
  }
}

function updateAndDrawStars() {
  bgCtx.clearRect(0, 0, width, height);
  
  // Smoothly interpolate mouse coordinates for parallax
  mouseX += (targetMouseX - mouseX) * 0.05;
  mouseY += (targetMouseY - mouseY) * 0.05;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const offsetX = mouseX - centerX;
  const offsetY = mouseY - centerY;
  
  particles.forEach(p => {
    // Twinkle effect (alpha pulsing)
    p.alpha += p.twinkleSpeed * p.direction;
    if (p.alpha >= 1 || p.alpha <= 0.2) {
      p.direction *= -1;
    }
    
    // Upward drift
    p.y -= p.speedY;
    if (p.y < -10) {
      p.y = height + 10;
      p.x = Math.random() * width;
    }
    
    // Apply mouse parallax offset
    const drawX = p.x - offsetX * p.parallaxFactor;
    const drawY = p.y - offsetY * p.parallaxFactor;
    
    // Draw star with glow
    bgCtx.shadowBlur = p.size * 3;
    bgCtx.shadowColor = 'rgba(168, 85, 247, 0.4)';
    bgCtx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
    bgCtx.beginPath();
    bgCtx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
    bgCtx.fill();
  });
  
  bgCtx.shadowBlur = 0; // reset shadow
}

// --- INITIALIZE CONFETTI ---
function triggerConfettiBurst() {
  confetti = [];
  const colors = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7', 
    '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', 
    '#eab308', '#f97316'
  ];
  
  // Create 150 confetti particles starting below the screen
  const count = 120;
  for (let i = 0; i < count; i++) {
    confetti.push({
      x: Math.random() * width,
      y: height + Math.random() * 80 + 20,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: -(Math.random() * 3.5 + 2), // move upwards
      speedX: Math.random() * 2 - 1,
      swayRange: Math.random() * 1.5 + 0.5,
      swaySpeed: Math.random() * 0.05 + 0.02,
      swayOffset: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: Math.random() * 0.06 - 0.03,
      opacity: 1,
      shape: Math.random() > 0.5 ? 'circle' : (Math.random() > 0.5 ? 'square' : 'triangle')
    });
  }
}

function updateAndDrawConfetti() {
  confettiCanvas.width = width;
  confettiCanvas.height = height;
  
  if (confetti.length === 0) return;
  
  confettiCtx.clearRect(0, 0, width, height);
  
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    
    // Upward motion
    c.y += c.speedY;
    
    // Swaying motion using sine wave
    c.swayOffset += c.swaySpeed;
    c.x += Math.sin(c.swayOffset) * c.swayRange + c.speedX;
    
    // Spin
    c.rotation += c.rotationSpeed;
    
    // Fade out as it nears the top 20% of the screen
    if (c.y < height * 0.3) {
      c.opacity -= 0.015;
    }
    
    // Remove if fully faded or off screen
    if (c.y < -20 || c.opacity <= 0) {
      confetti.splice(i, 1);
      continue;
    }
    
    confettiCtx.save();
    confettiCtx.globalAlpha = c.opacity;
    confettiCtx.translate(c.x, c.y);
    confettiCtx.rotate(c.rotation);
    confettiCtx.fillStyle = c.color;
    
    confettiCtx.beginPath();
    if (c.shape === 'circle') {
      confettiCtx.arc(0, 0, c.size / 2, 0, Math.PI * 2);
    } else if (c.shape === 'square') {
      confettiCtx.rect(-c.size / 2, -c.size / 2, c.size, c.size);
    } else { // triangle
      confettiCtx.moveTo(0, -c.size / 2);
      confettiCtx.lineTo(c.size / 2, c.size / 2);
      confettiCtx.lineTo(-c.size / 2, c.size / 2);
      confettiCtx.closePath();
    }
    confettiCtx.fill();
    confettiCtx.restore();
  }
}

// --- MATTER.JS PHYSICS SETUP ---
let engine, world;
let leftWall, rightWall, topWall, bottomWall;

function initPhysics() {
  engine = Engine.create();
  world = engine.world;
  
  // Set gravity to exactly 0 (antigravity space)
  engine.gravity.y = 0;
  engine.gravity.x = 0;
  
  // Define wall boundaries (very thick walls, updated on resize)
  // Walls are 5000px thick so they block bodies securely on quick resizes
  leftWall = Bodies.rectangle(-2500, height / 2, 5000, height * 5, { isStatic: true, restitution: 0.8 });
  rightWall = Bodies.rectangle(width + 2500, height / 2, 5000, height * 5, { isStatic: true, restitution: 0.8 });
  topWall = Bodies.rectangle(width / 2, -2500, width * 5, 5000, { isStatic: true, restitution: 0.8 });
  bottomWall = Bodies.rectangle(width / 2, height + 2500, width * 5, 5000, { isStatic: true, restitution: 0.8 });
  
  World.add(world, [leftWall, rightWall, topWall, bottomWall]);
  
  // Setup mouse constraint so user can grab and fling items
  const mouse = Mouse.create(appContainer);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.08,
      render: { visible: false }
    }
  });
  
  World.add(world, mouseConstraint);
  
  // Register DOM elements to create physics bodies
  const domIds = [
    { id: 'card-1', type: 'rectangle' },
    { id: 'card-2', type: 'rectangle' },
    { id: 'card-3', type: 'rectangle' },
    { id: 'card-4', type: 'rectangle' },
    { id: 'note-1', type: 'rectangle' },
    { id: 'note-2', type: 'rectangle' },
    { id: 'note-3', type: 'rectangle' },
    { id: 'capsule', type: 'circle' },
    { id: 'svg-star-1', type: 'circle' },
    { id: 'svg-star-2', type: 'circle' },
    { id: 'svg-heart-1', type: 'circle' },
    { id: 'svg-heart-2', type: 'circle' }
  ];
  
  items = [];
  
  domIds.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    // Choose a random spawn position within the viewport margins
    const spawnX = Math.random() * (width * 0.7) + (width * 0.15);
    const spawnY = Math.random() * (height * 0.6) + (height * 0.2);
    
    let body;
    const options = {
      restitution: 0.8, // Bouncy
      frictionAir: 0.02, // Simulate floating fluid (zero-G)
      friction: 0.0,
      label: item.id
    };
    
    if (item.type === 'circle') {
      const radius = Math.max(w, h) / 2;
      body = Bodies.circle(spawnX, spawnY, radius, options);
      items.push({ id: item.id, el, body, w, h, radius, type: 'circle' });
    } else {
      body = Bodies.rectangle(spawnX, spawnY, w, h, options);
      items.push({ id: item.id, el, body, w, h, type: 'rectangle' });
    }
    
    // Apply a soft initial floating kick/spin
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 2.5,
      y: (Math.random() - 0.5) * 2.5
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);
    
    World.add(world, body);
  });
}

// --- POSITION ALIGNMENT (GRAVITY COLLAGE GRID) ---
function getAlignedPositions() {
  const isMobile = width < 640;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const positions = {};
  
  if (isMobile) {
    // Tight 2-column stacked collage fitting mobile screens (height ~600px+)
    // Shift layout slightly downwards to leave space for Hero Title
    positions['card-1'] = { x: centerX - 75, y: centerY - 140, angle: -0.04 };
    positions['card-2'] = { x: centerX + 75, y: centerY - 140, angle: 0.03 };
    positions['card-3'] = { x: centerX - 75, y: centerY + 10,  angle: 0.02 };
    positions['card-4'] = { x: centerX + 75, y: centerY + 10,  angle: -0.03 };
    
    positions['note-1'] = { x: centerX - 75, y: centerY + 140, angle: -0.05 };
    positions['note-2'] = { x: centerX + 75, y: centerY + 140, angle: 0.04 };
    positions['note-3'] = { x: centerX,      y: centerY + 225, angle: 0.01 };
    
    positions['capsule'] = { x: centerX,     y: centerY - 65,  angle: 0 };
    
    // SVGs float down to form a glowing border
    positions['svg-star-1']  = { x: centerX - 120, y: centerY - 220, angle: 0.2 };
    positions['svg-star-2']  = { x: centerX + 120, y: centerY - 220, angle: -0.1 };
    positions['svg-heart-1'] = { x: centerX - 120, y: centerY + 210, angle: -0.2 };
    positions['svg-heart-2'] = { x: centerX + 120, y: centerY + 210, angle: 0.3 };
  } else {
    // Beautiful, wide scrapbook-style scrap collage surrounding the central letter capsule
    positions['card-1'] = { x: centerX - 240, y: centerY - 130, angle: -0.06 };
    positions['card-2'] = { x: centerX + 240, y: centerY - 130, angle: 0.05 };
    positions['card-3'] = { x: centerX - 240, y: centerY + 130, angle: 0.04 };
    positions['card-4'] = { x: centerX + 240, y: centerY + 130, angle: -0.05 };
    
    positions['note-1'] = { x: centerX - 420, y: centerY,      angle: -0.03 };
    positions['note-2'] = { x: centerX + 420, y: centerY,      angle: 0.04 };
    positions['note-3'] = { x: centerX,      y: centerY + 180, angle: 0.01 };
    
    positions['capsule'] = { x: centerX,     y: centerY - 20,  angle: 0 };
    
    // SVGs aligned beautifully
    positions['svg-star-1']  = { x: centerX - 100, y: centerY - 140, angle: 0.1 };
    positions['svg-star-2']  = { x: centerX + 100, y: centerY - 140, angle: -0.1 };
    positions['svg-heart-1'] = { x: centerX - 100, y: centerY + 80,  angle: -0.2 };
    positions['svg-heart-2'] = { x: centerX + 100, y: centerY + 80,  angle: 0.2 };
  }
  
  return positions;
}

// --- GAME LOOP (UPDATE & DRAW) ---
function loop() {
  if (!isGravityActive) {
    // Run Matter.js physics engine in zero-gravity mode
    Engine.update(engine, 16.666);
    
    // Sync Matter.js body coordinates to HTML transform
    items.forEach(item => {
      const { el, body, w, h } = item;
      const x = body.position.x - w / 2;
      const y = body.position.y - h / 2;
      el.style.transform = `translate3d(${x}px, ${y}px, 0px) rotate(${body.angle}rad)`;
    });
  }
  
  updateAndDrawStars();
  updateAndDrawConfetti();
  
  requestAnimationFrame(loop);
}

// --- TRANSITIONS: GRAVITY SWITCH ---
function toggleGravity(active) {
  isGravityActive = active;
  
  if (isGravityActive) {
    // 1. Update text label
    gravityLabel.textContent = "Aligned";
    gravityLabel.classList.remove('text-slate-400');
    gravityLabel.classList.add('text-purple-300');
    
    // 2. Pause physics engine updates
    // In aligned state, bodies become static so user cannot drag/fling them
    items.forEach(item => {
      Body.setStatic(item.body, true);
      item.el.classList.add('aligned');
    });
    
    // 3. Reveal subheader and pulse hero title
    gsap.to('#hero-sub', { opacity: 1, y: 0, duration: 0.6 });
    gsap.to('#hero-hint', { textContent: "Gravity active. The pieces have aligned.", duration: 0.4 });
    gsap.to('#hero-title', { scale: 1.05, textShadow: '0 0 35px rgba(236,72,153,0.7)', duration: 0.8, ease: "power2.out" });
    
    // 4. Calculate coordinates and trigger GSAP collage layout animation
    const targets = getAlignedPositions();
    
    items.forEach(item => {
      const dest = targets[item.id];
      if (!dest) return;
      
      // Create a temporary object to hold animation target values.
      // Animating body.position directly leaves positionPrev stale, causing physics engine velocity explosions.
      const animTarget = { x: item.body.position.x, y: item.body.position.y, angle: item.body.angle };
      
      gsap.to(animTarget, {
        x: dest.x,
        y: dest.y,
        angle: dest.angle,
        duration: 1.4,
        ease: 'power3.inOut',
        overwrite: 'auto',
        onUpdate: () => {
          // Update physics body positions through Matter API to synchronize both position and positionPrev
          Matter.Body.setPosition(item.body, { x: animTarget.x, y: animTarget.y });
          Matter.Body.setAngle(item.body, animTarget.angle);
          
          // Clear velocities to prevent building momentum during static transition
          Matter.Body.setVelocity(item.body, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(item.body, 0);
          
          // Sync during the tween so rotation and translation look butter-smooth
          const x = animTarget.x - item.w / 2;
          const y = animTarget.y - item.h / 2;
          item.el.style.transform = `translate3d(${x}px, ${y}px, 0px) rotate(${animTarget.angle}rad)`;
        }
      });
    });
    
    // 5. Blast gravity-defying confetti upward
    triggerConfettiBurst();
    
    // Try playing background music automatically on toggle interaction
    if (!isMusicPlaying) {
      playAudio();
    }
    
  } else {
    // 1. Release switch label
    gravityLabel.textContent = "Gravity";
    gravityLabel.classList.remove('text-purple-300');
    gravityLabel.classList.add('text-slate-400');
    
    // 2. Animate elements back to random floaty positions first
    gsap.to('#hero-sub', { opacity: 0, y: -10, duration: 0.5 });
    gsap.to('#hero-hint', { textContent: "Hover to feel weightless. Click and drag elements to fling.", duration: 0.4 });
    gsap.to('#hero-title', { scale: 1, textShadow: '0 0 20px rgba(168, 85, 247, 0.3)', duration: 0.8 });
    
    items.forEach(item => {
      const scatterX = Math.random() * (width * 0.7) + (width * 0.15);
      const scatterY = Math.random() * (height * 0.6) + (height * 0.2);
      const scatterAngle = (Math.random() - 0.5) * 1.5;
      
      // Animate a temporary target object instead of mutating body.position directly to prevent velocity buildup
      const animTarget = { x: item.body.position.x, y: item.body.position.y, angle: item.body.angle };
      
      gsap.to(animTarget, {
        x: scatterX,
        y: scatterY,
        angle: scatterAngle,
        duration: 1.2,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate: () => {
          // Sync physics coordinates and update positionPrev in Matter.js
          Matter.Body.setPosition(item.body, { x: animTarget.x, y: animTarget.y });
          Matter.Body.setAngle(item.body, animTarget.angle);
          
          const x = animTarget.x - item.w / 2;
          const y = animTarget.y - item.h / 2;
          item.el.style.transform = `translate3d(${x}px, ${y}px, 0px) rotate(${animTarget.angle}rad)`;
        },
        onComplete: () => {
          // Re-enable physics reaction and release static hold
          Body.setStatic(item.body, false);
          item.el.classList.remove('aligned');
          
          // Apply a gentle scatter velocity to resume zero-gravity drifting
          Body.setVelocity(item.body, {
            x: (Math.random() - 0.5) * 2.0,
            y: (Math.random() - 0.5) * 2.0
          });
          Body.setAngularVelocity(item.body, (Math.random() - 0.5) * 0.02);
        }
      });
    });
  }
}

// --- UTILITY ACTIONS ---
function scatterElements() {
  if (isGravityActive) {
    // Toggle switch off first
    gravityToggle.checked = false;
    toggleGravity(false);
    return;
  }
  
  items.forEach(item => {
    // Scatter coordinates
    const scatterX = Math.random() * (width * 0.7) + (width * 0.15);
    const scatterY = Math.random() * (height * 0.6) + (height * 0.2);
    const scatterAngle = (Math.random() - 0.5) * 2.0;
    
    // Reset positions and apply a strong drift velocity
    Body.setPosition(item.body, { x: scatterX, y: scatterY });
    Body.setAngle(item.body, scatterAngle);
    
    Body.setVelocity(item.body, {
      x: (Math.random() - 0.5) * 4.0,
      y: (Math.random() - 0.5) * 4.0
    });
    Body.setAngularVelocity(item.body, (Math.random() - 0.5) * 0.04);
  });
}

function playAudio() {
  bgMusic.play().then(() => {
    isMusicPlaying = true;
    musicBtn.innerHTML = '<i class="fa-solid fa-volume-high text-purple-400"></i>';
    musicBtn.title = "Pause Music";
  }).catch(err => {
    console.log("Audio play blocked by browser. Awaiting user interaction.", err);
  });
}

function pauseAudio() {
  bgMusic.pause();
  isMusicPlaying = false;
  musicBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
  musicBtn.title = "Play Music";
}

// --- ENVELOPE MODAL OPEN/CLOSE ---
function openLetterModal() {
  // Try turning on audio on capsule open
  if (!isMusicPlaying) {
    playAudio();
  }
  
  letterModal.classList.add('active');
  
  // Pause the physics engine entirely while letter is open
  items.forEach(item => Body.setStatic(item.body, true));
}

function closeLetterModal() {
  letterModal.classList.remove('active');
  
  // Only restore physics movement if gravity is NOT active
  if (!isGravityActive) {
    items.forEach(item => {
      Body.setStatic(item.body, false);
      // Give a tiny floating velocity so they drift again
      Body.setVelocity(item.body, {
        x: (Math.random() - 0.5) * 1.5,
        y: (Math.random() - 0.5) * 1.5
      });
    });
  }
}

// --- CLICK OR DRAG INTERACTION CAPTURE ---
function addInteractionListeners() {
  const capsuleEl = document.getElementById('capsule');
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  
  const handleDown = (clientX, clientY) => {
    startX = clientX;
    startY = clientY;
    startTime = Date.now();
  };
  
  const handleUp = (clientX, clientY) => {
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    const dist = Math.hypot(deltaX, deltaY);
    const duration = Date.now() - startTime;
    
    // If the movement was negligible and fast, trigger the modal (it's a tap/click, not a physics drag)
    if (dist < 8 && duration < 250) {
      openLetterModal();
    }
  };
  
  // Mouse Events
  capsuleEl.addEventListener('mousedown', (e) => handleDown(e.clientX, e.clientY));
  capsuleEl.addEventListener('mouseup', (e) => handleUp(e.clientX, e.clientY));
  
  // Touch Events
  capsuleEl.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      handleDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
  capsuleEl.addEventListener('touchend', (e) => {
    if (e.changedTouches.length > 0) {
      handleUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  });
}

// --- RESIZE HANDLER ---
function handleResize() {
  width = window.innerWidth;
  height = window.innerHeight;
  
  // Update boundary walls positions to match new screen dimensions
  if (leftWall && rightWall && topWall && bottomWall) {
    Body.setPosition(leftWall, { x: -2500, y: height / 2 });
    Body.setPosition(rightWall, { x: width + 2500, y: height / 2 });
    Body.setPosition(topWall, { x: width / 2, y: -2500 });
    Body.setPosition(bottomWall, { x: width / 2, y: height + 2500 });
  }
  
  // Re-initialize starry sky canvas dimensions
  initStars();
  
  // If gravity collage is active during resize, immediately snap elements to their new relative aligned positions
  if (isGravityActive) {
    const targets = getAlignedPositions();
    items.forEach(item => {
      const dest = targets[item.id];
      if (dest) {
        Body.setPosition(item.body, { x: dest.x, y: dest.y });
        Body.setAngle(item.body, dest.angle);
        const x = dest.x - item.w / 2;
        const y = dest.y - item.h / 2;
        item.el.style.transform = `translate3d(${x}px, ${y}px, 0px) rotate(${dest.angle}rad)`;
      }
    });
  }
}

// --- EVENT BINDINGS & INIT ---
function init() {
  // Initialize star backgrounds
  initStars();
  
  // Initialize Matter.js physics
  initPhysics();
  
  // Bind UI Events
  gravityToggle.addEventListener('change', (e) => toggleGravity(e.target.checked));
  resetBtn.addEventListener('click', scatterElements);
  
  musicBtn.addEventListener('click', () => {
    if (isMusicPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  });
  
  closeModal.addEventListener('click', closeLetterModal);
  letterModal.addEventListener('click', (e) => {
    if (e.target === letterModal) {
      closeLetterModal();
    }
  });
  
  // Capture clicks vs drags on letter envelope
  addInteractionListeners();
  
  // Parallax star background mouse listener
  window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  });
  
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      targetMouseX = e.touches[0].clientX;
      targetMouseY = e.touches[0].clientY;
    }
  });
  
  window.addEventListener('resize', handleResize);
  
  // Intro GSAP Timeline (animate header text and stagger float items fade-in)
  gsap.timeline()
    .to('#hero-title', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 })
    .to('#hero-hint', { opacity: 0.7, duration: 0.8, ease: 'power2.out' }, '-=0.4')
    .fromTo('.physics-wrapper', 
      { opacity: 0, scale: 0.5 }, 
      { opacity: 1, scale: 1, duration: 1.0, stagger: 0.1, ease: 'back.out(1.7)' },
      '-=0.6'
    );
  
  // Start Main Loop
  loop();
}

// Run on DOM loaded
window.addEventListener('DOMContentLoaded', init);
