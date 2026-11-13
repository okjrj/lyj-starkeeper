const experience = document.querySelector('.experience');
const titlePanel = document.querySelector('.title-panel');
const start = document.querySelector('.start');
const back = document.querySelector('.back');
const sceneMenu = document.querySelector('.scene-menu');
const home = sceneMenu.querySelector('.home');
const helpToggle = sceneMenu.querySelector('.help-toggle');
const sceneHelp = sceneMenu.querySelector('.scene-help');
const door = document.querySelector('.house-door');
const openingMusic = document.querySelector('.opening-music');
const doorSound = document.querySelector('.door-sound');
const houseMessage = document.querySelector('.house-message');
const interior = document.querySelector('.house-interior');
const roomScroll = interior.querySelector('.room-scroll');
const roomObjects = [...interior.querySelectorAll('.room-object')];
const roomNote = interior.querySelector('.room-note');
const noteOverlay = document.querySelector('.room-note-overlay');
const noteInstructions = noteOverlay.querySelector('.room-note-instructions');
const noteMethod = noteOverlay.querySelector('.room-note-method');
const noteClose = noteOverlay.querySelector('.room-note-close');
const roomWindow = interior.querySelector('.room-window');
const windowView = document.querySelector('.window-view');
const windowActions = [...windowView.querySelectorAll('[data-window-action]')];
const windowChecklist = [...windowView.querySelectorAll('.window-checklist button')];
const windowInstruction = windowView.querySelector('.window-instruction');
const cordTarget = windowView.querySelector('.window-cord-target');
const sunTarget = windowView.querySelector('.window-sun-target');
const heldSun = document.querySelector('.held-sun');
const sunReturn = windowView.querySelector('.sun-return');
const pinnedNote = document.querySelector('.pinned-note');
const nightYard = document.querySelector('.night-yard');
const yardObjects = [...nightYard.querySelectorAll('.yard-object')];
const yardFeedback = nightYard.querySelector('.yard-feedback');
const cartView = document.querySelector('.cart-view');
const cartTarget = cartView.querySelector('.cart-stars-target');
const cartGuide = cartView.querySelector('.cart-guide');
const cartChecklist = [...cartView.querySelectorAll('[data-cart-step]')];
const cartProgress = cartView.querySelector('.cart-progress');
const cartSparkles = cartView.querySelector('.cart-sparkles');
const fallingBasket = document.querySelector('.falling-basket');
const skyView = document.querySelector('.sky-view');
const skyLadder = skyView.querySelector('.sky-ladder');
const skyStars = skyView.querySelector('.sky-stars');
const skyGuide = skyView.querySelector('.sky-guide-title');
const skyGuideDetail = skyView.querySelector('.sky-guide-detail');
const skyPlacement = skyView.querySelector('.sky-placement');
const skyMoon = skyView.querySelector('.sky-moon');
const moonOpen = skyView.querySelector('.moon-open');
const moonHitArea = skyView.querySelector('.moon-hit-area');
const moonFinale = document.querySelector('.moon-finale');
const replayFilm = moonFinale.querySelector('.replay-film');
const finishGame = moonFinale.querySelector('.finish-game');
const ending = document.querySelector('.ending');
const endingFilm = ending.querySelector('.ending-film');
const exitFilm = ending.querySelector('.exit-film');
let endingReturning = false;
let endingTimer;
const heldStar = document.querySelector('.held-star');
const skyRungs = Array.from({ length: 8 }, (_, index) => {
  const rung = document.createElement('button');
  rung.type = 'button';
  rung.className = 'sky-rung';
  rung.setAttribute('aria-label', `사다리 ${index + 1}번째 발판`);
  rung.style.setProperty('--rung', `${18 + index * 19}svh`);
  skyLadder.append(rung);
  return rung;
});
const roomControls = [...interior.querySelectorAll('[data-pan]')];
const roomFeedback = interior.querySelector('.room-feedback');
const roomGuideIntro = interior.querySelector('.room-guide-intro');
const roomGuideDiscovery = interior.querySelector('.room-guide-discovery');
const sky = document.querySelector('.stars');
const cameraToggle = document.querySelector('.camera-toggle');
const cameraStatus = document.querySelector('.camera-status');
const video = document.querySelector('.camera-input');
const pointerGlove = document.querySelector('[data-glove="pointer"]');
const handGloves = {
  Left: document.querySelector('[data-glove="left"]'),
  Right: document.querySelector('[data-glove="right"]'),
};
const gloveImages = {
  open: 'assets/magic-glove.svg',
  fist: 'assets/magic-glove-fist.svg',
  point: 'assets/magic-glove-point.svg',
};
const fingerJoints = [[5, 6, 8], [9, 10, 12], [13, 14, 16], [17, 18, 20]];
const handActions = new Map();
const gestureButtons = [cameraToggle, start, door, home, back, helpToggle, ...roomObjects, ...roomControls, ...windowChecklist, ...yardObjects, ...cartChecklist, ...skyRungs, moonOpen, replayFilm, finishGame, exitFilm, noteInstructions, noteClose];
let handDrag = null;
let helpHideTimer;
let roomDiscoveryTimer;
let roomFeedbackTimer;
let landscapeGuideTimer;
let doorOpeningTimer;
let musicFadeFrame;
let openingMusicFinished = false;
let roomStage = 'exploring';
let windowStep = 0;
let windowHintTimer;
let windowFeedbackTimer;
let windowHintReady = false;
let curtainStart;
let cordGrab;
let sunHolder;
let sunPickupStarted;
let sunlightDelivered = false;
let sunShake;
let yardFeedbackTimer;
let yardZoomTimer;
let basketStartTimer;
let basketFrame;
let basketHolder;
let basketCaught = false;
let basketStarCount = 3;
let climbStep = 0;
let climbTimer;
let skyIdleTimer;
let starHolder;
let starReach;
let cartStep = 0;
let cartReturnTimer;
let fillingMotion;
let basketFillTimer;
let lastFillChime = 0;
const cartHints = ['해를 별 가까이에 대어 주세요.', '떨어지는 바구니를 잡아주세요.', '두 팔을 활짝 벌려 별을 가득 담아 주세요!'];
const windowHints = [
  '두 손의 검지를 들고 커튼을 양옆으로 벌려 주세요.',
  '작은 줄 위에서 주먹을 쥐고 아래로 당겨 주세요.',
  '해 위에서 검지를 들거나 주먹을 쥐어 해를 가져가세요.',
];
let audioContext;
const chimes = {
  selection: [[880, 0, .19, .033], [1174.66, .035, .26, .024]],
  guide: [[523.25, 0, .52, .054], [783.99, .09, .54, .044], [1046.5, .18, .72, .033]],
  discovery: [[698.46, 0, .36, .062], [1046.5, .12, .44, .055], [1396.91, .28, .68, .048]],
  stars: [[659.25, 0, .7, .05], [987.77, .12, .68, .045], [1318.51, .24, .82, .042], [1975.53, .39, .88, .03]],
  note: [[659.25, 0, .52, .044], [880, .08, .59, .035], [1318.51, .18, .74, .028]],
};
const openingMusicVolume = .6;
const visionPackage = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32';
const handModel = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
let cameraSession = null;
let pointerEvent = null;

const pinnedSteps = noteMethod.cloneNode(true);
pinnedSteps.removeAttribute('id');
pinnedSteps.hidden = false;
pinnedNote.append(pinnedSteps);
for (const [x, y, size, delay] of [[563, 369, 20, 0], [670, 269, 24, .35], [748, 368, 17, .7],
  [822, 191, 24, .22], [934, 330, 30, .48], [1030, 233, 19, .8],
  [1127, 301, 25, .12], [1245, 358, 18, .66], [1310, 264, 15, .92]]) {
  const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  sparkle.setAttribute('class', 'cart-sparkle');
  sparkle.setAttribute('d', `M${x} ${y - size} l${size * .22} ${size * .78} ${size * .78} ${size * .22}
    -${size * .78} ${size * .22} -${size * .22} ${size * .78} -${size * .22} -${size * .78}
    -${size * .78} -${size * .22} ${size * .78} -${size * .22} Z`);
  sparkle.style.setProperty('--spark-delay', `${delay}s`);
  cartSparkles.append(sparkle);
}

for (let index = 0; index < 43; index += 1) {
  const star = document.createElement('span');
  star.className = 'star';
  star.style.setProperty('--x', `${(index * 37.17 + 3) % 100}%`);
  star.style.setProperty('--y', `${(index * 19.23 + 2) % 61}%`);
  star.style.setProperty('--size', index % 5 === 0 ? '8px' : `${2 + index % 3}px`);
  star.style.setProperty('--duration', `${2.1 + (index % 8) * 0.39}s`);
  star.style.setProperty('--delay', `-${(index % 11) * 0.44}s`);
  sky.append(star);
}

function playChime(name) {
  if (audioContext?.state !== 'running') return;
  const startTime = audioContext.currentTime + .01;
  for (const [pitch, delay, duration, volume] of chimes[name]) {
    for (const [ratio, strength] of [[1, 1], [2.01, .19]]) {
      const time = startTime + delay;
      const tone = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      tone.frequency.value = pitch * ratio;
      envelope.gain.setValueAtTime(.0001, time);
      envelope.gain.exponentialRampToValueAtTime(volume * strength, time + .018);
      envelope.gain.exponentialRampToValueAtTime(.0001, time + duration / ratio);
      tone.connect(envelope).connect(audioContext.destination);
      tone.start(time);
      tone.stop(time + duration / ratio);
    }
  }
}

function startOpeningMusic() {
  if (!openingMusicFinished && openingMusic.paused) {
    openingMusic.play().catch(() => {});
  }
}

function resetOpeningMusic() {
  cancelAnimationFrame(musicFadeFrame);
  openingMusicFinished = false;
  openingMusic.currentTime = 0;
  openingMusic.volume = openingMusicVolume;
  startOpeningMusic();
}

function fadeOpeningMusic() {
  openingMusicFinished = true;
  cancelAnimationFrame(musicFadeFrame);
  const start = performance.now();
  const volume = openingMusic.volume;
  function fade(time) {
    const remaining = Math.max(0, 1 - (time - start) / 2700);
    openingMusic.volume = volume * remaining;
    if (remaining > 0) musicFadeFrame = requestAnimationFrame(fade);
    else openingMusic.pause();
  }
  if (!openingMusic.paused) musicFadeFrame = requestAnimationFrame(fade);
}

openingMusic.volume = openingMusicVolume;
startOpeningMusic();
for (const event of ['pointerdown', 'keydown', 'click']) {
  experience.addEventListener(event, startOpeningMusic, { capture: true });
}

experience.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button === door || button.disabled || !window.AudioContext) return;
  audioContext ??= new AudioContext();
  if (audioContext.state === 'running') playChime('selection');
  else audioContext.resume().then(() => playChime('selection')).catch(() => {});
}, { capture: true });

function showView(view) {
  closeMoonFinale();
  const previousView = experience.dataset.view;
  clearTimeout(doorOpeningTimer);
  delete experience.dataset.doorOpening;
  clearTimeout(roomDiscoveryTimer);
  roomDiscoveryTimer = undefined;
  clearTimeout(landscapeGuideTimer);
  clearRoomFeedback();
  setNoteOpen(false);
  clearHandActions();
  handDrag = null;
  showHelp(false);
  experience.dataset.view = view;
  titlePanel.inert = view !== 'title';
  sceneMenu.hidden = view === 'title';
  door.hidden = houseMessage.hidden = view !== 'landscape';
  door.disabled = false;
  interior.hidden = view !== 'interior';
  windowView.hidden = view !== 'window';
  nightYard.hidden = view !== 'yard';
  nightYard.inert = view !== 'yard';
  cartView.hidden = view !== 'cart';
  skyView.hidden = view !== 'sky';
  clearTimeout(climbTimer);
  climbTimer = undefined;
  clearTimeout(skyIdleTimer);
  if (view !== 'sky') clearHeldStar();
  clearTimeout(yardZoomTimer);
  delete nightYard.dataset.zoom;
  const keepBasket = basketCaught && ['yard', 'sky', 'interior'].includes(view);
  resetBasket(keepBasket);
  if (view === 'cart') {
    cartView.toggleAttribute('data-lit', sunlightDelivered);
    setCartStep(sunlightDelivered ? 1 : 0);
    if (sunlightDelivered) startBasketFall();
    playChime('guide');
  }
  yardFeedback.hidden = true;
  if (view === 'yard') {
    nightYard.toggleAttribute('data-filled', sunlightDelivered);
    for (const object of yardObjects) object.setAttribute('aria-pressed', 'false');
  }
  clearTimeout(yardFeedbackTimer);
  clearTimeout(windowHintTimer);
  clearTimeout(windowFeedbackTimer);
  curtainStart = cordGrab = sunShake = undefined;
  if (view === 'title' || view === 'landscape') {
    sunHolder = undefined;
    sunlightDelivered = false;
    basketCaught = false;
    resetSky();
    heldSun.hidden = true;
  }
  updatePointer();
  if (view === 'sky') renderSkyStage();
  if (view === 'window') setWindowStep(sunHolder ? 3 : 0);
  if (view === 'title' && openingMusicFinished) resetOpeningMusic();
  if (view === 'landscape') landscapeGuideTimer = setTimeout(() => playChime('guide'), 1600);
  if (view === 'interior' && previousView === 'landscape') {
    roomStage = 'exploring';
    roomScroll.scrollLeft = 0;
    roomGuideIntro.hidden = false;
    roomGuideDiscovery.hidden = true;
    playChime('guide');
    roomDiscoveryTimer = setTimeout(showRoomDiscovery, 7000);
  }
  pinnedNote.hidden = roomStage !== 'note-read' || !['interior', 'window', 'yard', 'cart'].includes(view);
  if (view === 'interior') updateRoomControls();
  (view === 'title' ? start : back).focus();
}

function showHelp(open) {
  clearTimeout(helpHideTimer);
  if (open && sceneHelp.hidden) playChime('guide');
  sceneHelp.hidden = !open;
  helpToggle.setAttribute('aria-expanded', String(open));
  handDrag = null;
}

function placeGlove(glove, x, y, angle = 0, flip = 1) {
  glove.style.setProperty('--x', `${x}px`);
  glove.style.setProperty('--y', `${y}px`);
  glove.style.setProperty('--angle', `${angle}rad`);
  glove.style.setProperty('--flip', flip);
  glove.hidden = false;
  if (glove === sunHolder) placeHeldSun(x, y, glove === pointerGlove);
  if (glove === basketHolder) positionBasket(x, y + 22);
  if (glove === starHolder) placeHeldStar(x, y);
}

function updatePointer() {
  const visible = pointerEvent && !cameraSession?.landmarker;
  pointerGlove.hidden = !visible;
  if (sunHolder === pointerGlove && !visible) heldSun.hidden = true;
  if (basketHolder === pointerGlove && !visible) fallingBasket.hidden = true;
  if (starHolder === pointerGlove && !visible) heldStar.hidden = true;
  experience.toggleAttribute('data-pointer-glove', Boolean(visible));
  if (visible) {
    const source = sunHolder === pointerGlove || basketHolder === pointerGlove ? gloveImages.fist : gloveImages.point;
    if (pointerGlove.getAttribute('src') !== source) pointerGlove.src = source;
    placeGlove(pointerGlove, pointerEvent.clientX, pointerEvent.clientY, -.24);
    if (!cartView.hidden && cartStep === 2 && basketHolder === pointerGlove) {
      fillBasketFromMotion([{ glove: pointerGlove, x: pointerEvent.clientX, y: pointerEvent.clientY }]);
    }
  }
}

experience.addEventListener('pointermove', (event) => {
  pointerEvent = event.pointerType === 'mouse' ? event : null;
  updatePointer();
});
experience.addEventListener('pointerleave', () => {
  pointerEvent = null;
  updatePointer();
});

function stopCamera(message = '') {
  const session = cameraSession;
  cameraSession = null;
  if (session) {
    cancelAnimationFrame(session.frame);
    session.stream?.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    session.landmarker?.close();
  }
  Object.values(handGloves).forEach((glove) => { glove.hidden = true; });
  if (sunHolder && sunHolder !== pointerGlove) heldSun.hidden = true;
  if (basketHolder && basketHolder !== pointerGlove) {
    fallingBasket.hidden = true;
    if (basketCaught) basketHolder = pointerGlove;
  }
  if (starHolder !== pointerGlove) clearHeldStar();
  sunShake = undefined;
  if (cordGrab?.glove) releaseWindowCord();
  curtainStart = undefined;
  clearHandActions();
  handDrag = null;
  cameraToggle.textContent = 'ON';
  cameraToggle.setAttribute('aria-label', '웹캠 켜기');
  cameraToggle.setAttribute('aria-pressed', 'false');
  cameraStatus.textContent = message;
  updatePointer();
}

function glovePose(points) {
  const extended = fingerJoints.map(([base, joint, tip]) => {
    const a = points[base];
    const b = points[joint];
    const c = points[tip];
    const first = [b.x - a.x, b.y - a.y, b.z - a.z];
    const second = [c.x - b.x, c.y - b.y, c.z - b.z];
    const alignment = first.reduce((sum, value, axis) => sum + value * second[axis], 0);
    return alignment > 0.65 * Math.hypot(...first) * Math.hypot(...second);
  });
  if (extended.every(Boolean)) return 'open';
  if (extended.slice(1).some(Boolean)) return 'other';
  return extended[0] ? 'point' : 'fist';
}

function updateButtonHighlights() {
  const hands = [...handActions.values()];
  const wasOverHelp = helpToggle.hasAttribute('data-hand-hover');
  for (const button of gestureButtons) {
    button.toggleAttribute('data-hand-hover', hands.some((hand) => hand.hover === button));
  }
  const isOverHelp = helpToggle.hasAttribute('data-hand-hover');
  if (isOverHelp && !wasOverHelp) showHelp(true);
  if (!isOverHelp && wasOverHelp) {
    helpHideTimer = setTimeout(() => showHelp(false), 3000);
  }
}

function clearHandActions() {
  handActions.clear();
  updateButtonHighlights();
}

function trackButtonGesture(glove, x, y, pose) {
  const previous = handActions.get(glove);
  const button = document.elementFromPoint(x, y)?.closest('button');
  let hover = gestureButtons.includes(button) && !button.disabled
    && Number(getComputedStyle(button).opacity) > 0 ? button : null;
  if (!hover && !sceneMenu.hidden && noteOverlay.hidden) {
    const bounds = helpToggle.getBoundingClientRect();
    if (x >= bounds.left && x <= bounds.right + 32 && y >= bounds.top && y <= bounds.bottom + 28) {
      hover = helpToggle;
    }
  }
  if (!hover) {
    handActions.delete(glove);
    return null;
  }
  if (hover === helpToggle) {
    handActions.set(glove, { hover, armed: false });
    return null;
  }
  const wasArmed = previous?.hover === hover && previous.armed;
  const armed = pose === 'fist' || (pose !== 'open' && wasArmed);
  handActions.set(glove, { hover, armed });
  return pose === 'open' && wasArmed ? hover : null;
}

function drawHands(result) {
  const visibleGloves = new Set();
  const pointingHands = [];
  const sceneHands = [];
  let clickedButton = null;
  result.landmarks.forEach((points, index) => {
    const side = result.handedness[index]?.[0]?.categoryName;
    const glove = handGloves[side];
    if (!glove || visibleGloves.has(glove)) return;
    const [wrist, , thumb, , , , , , , knuckle] = points;
    const dx = (wrist.x - knuckle.x) * video.videoWidth;
    const dy = (knuckle.y - wrist.y) * video.videoHeight;
    const thumbX = (knuckle.x - thumb.x) * video.videoWidth;
    const thumbY = (thumb.y - knuckle.y) * video.videoHeight;
    const flip = dx * thumbY - dy * thumbX > 0 ? -1 : 1;
    const pose = glovePose(result.worldLandmarks?.[index] ?? points);
    const palm = { x: (wrist.x + knuckle.x) / 2, y: (wrist.y + knuckle.y) / 2 };
    const x = (1 - palm.x) * innerWidth;
    const y = palm.y * innerHeight;
    glove.dataset.pose = pose;
    const source = glove === sunHolder || glove === basketHolder ? gloveImages.fist : gloveImages[pose] ?? gloveImages.open;
    if (glove.getAttribute('src') !== source) glove.src = source;
    placeGlove(glove, x, y, Math.atan2(dx, -dy), flip);
    visibleGloves.add(glove);
    if (pose === 'point') pointingHands.push(x);
    if (!windowView.hidden || !cartView.hidden || !skyView.hidden) {
      sceneHands.push({ glove, x, y, pose, tipX: (1 - points[8].x) * innerWidth, tipY: points[8].y * innerHeight });
    }
    const clicked = trackButtonGesture(glove, x, y, pose);
    clickedButton ??= clicked;
  });
  for (const glove of Object.values(handGloves)) {
    glove.hidden = !visibleGloves.has(glove);
    if (glove.hidden) handActions.delete(glove);
  }
  if (sunHolder && sunHolder !== pointerGlove && !visibleGloves.has(sunHolder)) heldSun.hidden = true;
  if (basketHolder && basketHolder !== pointerGlove && !visibleGloves.has(basketHolder)) fallingBasket.hidden = true;
  updateButtonHighlights();
  if (!windowView.hidden) updateWindowHands(sceneHands);
  if (!cartView.hidden) {
    checkBasketHands(sceneHands);
    if (cartStep === 2) fillBasketFromMotion(sceneHands);
  }
  if (!skyView.hidden) updateSkyHands(sceneHands);
  if (!interior.hidden && noteOverlay.hidden && sceneHelp.hidden && pointingHands.length === 2) {
    const center = (pointingHands[0] + pointingHands[1]) / 2;
    handDrag ??= { center, scrollLeft: roomScroll.scrollLeft };
    roomScroll.scrollLeft = handDrag.scrollLeft + (handDrag.center - center) * 2;
  } else {
    handDrag = null;
  }
  cameraStatus.textContent = visibleGloves.size === 0 ? '웹캠에 양손을 보여주세요.' : '';
  if (clickedButton) clickedButton.click();
}

function showWindowInstruction(message) {
  if (windowInstruction.hidden || windowInstruction.textContent !== message) playChime('guide');
  windowInstruction.textContent = message;
  windowInstruction.hidden = false;
}

function setWindowStep(step) {
  windowStep = step;
  sunPickupStarted = step === 2 ? performance.now() : undefined;
  windowView.dataset.step = String(step);
  clearTimeout(windowHintTimer);
  clearTimeout(windowFeedbackTimer);
  windowInstruction.hidden = true;
  sunReturn.hidden = step !== 3;
  windowHintReady = false;
  curtainStart = cordGrab = undefined;
  updateWindowCord(step >= 2 ? 1 : 0, 0);
  for (const [index, button] of windowChecklist.entries()) {
    button.toggleAttribute('data-complete', index < step);
    if (index === step) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
  if (step < windowHints.length) {
    windowHintTimer = setTimeout(() => {
      windowHintReady = true;
      showWindowInstruction(windowHints[step]);
    }, 5000);
  }
}

function advanceWindowStep() {
  setWindowStep(windowStep + 1);
  playChime('discovery');
}

function selectWindowAction(action) {
  if (windowView.hidden || action < windowStep) return false;
  if (action === windowStep) return true;
  showWindowInstruction('먼저 할 일이 있어요.');
  clearTimeout(windowFeedbackTimer);
  windowFeedbackTimer = setTimeout(() => {
    if (!windowInstruction.hidden && windowInstruction.textContent === '먼저 할 일이 있어요.') {
      if (windowHintReady) showWindowInstruction(windowHints[windowStep]);
      else windowInstruction.hidden = true;
    }
  }, 2100);
  return false;
}

function updateWindowCord(night, pull) {
  windowView.style.setProperty('--night', night);
  windowView.style.setProperty('--cord', `${pull}px`);
  windowView.style.setProperty('--cord-length', 1 + pull / 500);
}

function pullWindowCord(y) {
  const distance = Math.max(0, y - cordGrab.start);
  const progress = Math.min(1, distance / cordGrab.required);
  updateWindowCord(progress, progress * 165);
  if (progress === 1) advanceWindowStep();
}

function releaseWindowCord() {
  cordGrab = undefined;
  updateWindowCord(windowStep >= 2 ? 1 : 0, 0);
}

function grabWindowCord(y, input) {
  cordGrab = { ...input, start: y, required: Math.max(64, innerHeight * .16) };
  playChime('selection');
}

function nearWindowTarget(target, x, y, margin = 0) {
  const bounds = target.getBoundingClientRect();
  return x >= bounds.left - margin && x <= bounds.right + margin
    && y >= bounds.top - margin && y <= bounds.bottom + margin;
}

function placeHeldSun(x, y, pointer) {
  const sunX = x + (pointer ? 14 : 0);
  const sunY = y - (pointer ? 0 : 22);
  heldSun.style.setProperty('--x', `${sunX}px`);
  heldSun.style.setProperty('--y', `${sunY}px`);
  heldSun.hidden = false;
  if (!cartView.hidden && !cartView.hasAttribute('data-lit')) lightNearbyStars(sunX, sunY);
}

function lightNearbyStars(x, y) {
  const bounds = cartTarget.getBoundingClientRect();
  const dx = (x - bounds.left - bounds.width / 2) / (bounds.width / 2 + 35);
  const dy = (y - bounds.top - bounds.height / 2) / (bounds.height / 2 + 35);
  if (dx * dx + dy * dy > 1) return;
  sunlightDelivered = true;
  sunHolder = undefined;
  heldSun.hidden = true;
  cartView.dataset.lit = '';
  playChime('stars');
  basketStartTimer = setTimeout(() => {
    setCartStep(1);
    playChime('guide');
    startBasketFall();
  }, 1150);
}

function positionBasket(x, y, angle = 0) {
  fallingBasket.style.setProperty('--x', `${x}px`);
  fallingBasket.style.setProperty('--y', `${y}px`);
  fallingBasket.style.setProperty('--basket-angle', `${angle}deg`);
  fallingBasket.hidden = false;
}

function startBasketFall() {
  const startTime = performance.now();
  const travelPadding = 255;
  function fall(time) {
    const elapsed = time - startTime;
    const duration = 3100;
    const progress = elapsed / duration;
    if (progress >= 1) {
      fallingBasket.hidden = true;
      basketStartTimer = setTimeout(startBasketFall, 550);
      return;
    }
    const x = innerWidth * .52 + Math.sin(progress * Math.PI * 2) * Math.min(32, innerWidth * .08);
    const y = -travelPadding + (innerHeight + travelPadding * 2) * progress;
    positionBasket(x, y, 8 * Math.sin(progress * 8));
    basketFrame = requestAnimationFrame(fall);
  }
  basketFrame = requestAnimationFrame(fall);
}

function resetBasket(keepBasket) {
  clearTimeout(basketStartTimer);
  clearTimeout(cartReturnTimer);
  clearInterval(basketFillTimer);
  cancelAnimationFrame(basketFrame);
  fillingMotion = undefined;
  lastFillChime = 0;
  cartProgress.value = 0;
  if (keepBasket) return;
  basketHolder = undefined;
  fallingBasket.style.removeProperty('--basket-mask');
  delete cartView.dataset.returning;
  fallingBasket.hidden = true;
  delete fallingBasket.dataset.caught;
}

function catchBasket(glove, x, y) {
  if (fallingBasket.hidden || basketHolder || cartView.hidden) return;
  cancelAnimationFrame(basketFrame);
  basketHolder = glove;
  fallingBasket.dataset.caught = '';
  setCartStep(2);
  positionBasket(x, y + 22);
  playChime('discovery');
}

function checkBasketHands(hands) {
  if (fallingBasket.hidden || basketHolder) return;
  const hand = hands.find(({ pose, x, y }) => pose === 'fist' && nearWindowTarget(fallingBasket, x, y, 54));
  if (hand) catchBasket(hand.glove, hand.x, hand.y);
}

function setCartStep(step) {
  clearInterval(basketFillTimer);
  if (step === 2) {
    const assistStart = performance.now() + 3000;
    let lastAssist = assistStart;
    basketFillTimer = setInterval(() => {
      const now = performance.now();
      if (now <= lastAssist) return;
      addBasketProgress(Math.min(now - lastAssist, 250) / 22000);
      lastAssist = now;
    }, 100);
  }
  cartStep = step;
  cartGuide.textContent = cartHints[step] ?? '바구니에 별을 모두 담았어요!';
  cartProgress.hidden = step < 2;
  for (const [index, button] of cartChecklist.entries()) {
    button.toggleAttribute('data-complete', index < step);
    if (index === step) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
}

function fillBasketFromMotion(hands) {
  const bounds = cartTarget.getBoundingClientRect();
  const margin = Math.min(160, innerHeight * .24);
  const nearby = hands.filter(({ y }) => y >= bounds.top - margin && y <= bounds.bottom + margin);
  if (!nearby.length) {
    fillingMotion = undefined;
    return;
  }
  const previous = fillingMotion;
  fillingMotion = new Map(nearby.map(({ glove, x }) => [glove, x]));
  if (!previous) return;
  let distance = 0;
  for (const { glove, x } of nearby) {
    const lastX = previous.get(glove) ?? x;
    const movement = Math.abs(x - lastX);
    if (movement < 7) fillingMotion.set(glove, lastX);
    else distance += Math.min(movement, 55);
  }
  addBasketProgress(distance / Math.max(1250, innerWidth * 1.8));
}

function addBasketProgress(amount) {
  if (cartStep !== 2 || amount <= 0) return;
  const progress = Math.min(1, cartProgress.value + amount);
  cartProgress.value = progress;
  setBasketFill(progress);
  const milestone = Math.floor(progress * 6);
  if (milestone > lastFillChime && progress < 1) {
    lastFillChime = milestone;
    playChime('selection');
  }
  if (progress < 1) return;
  basketCaught = true;
  basketStarCount = 3;
  setCartStep(3);
  playChime('stars');
  cartReturnTimer = setTimeout(() => {
    nightYard.hidden = false;
    nightYard.dataset.filled = '';
    cartView.dataset.returning = '';
    cartReturnTimer = setTimeout(() => showView('yard'), 860);
  }, 650);
}

function setBasketFill(progress) {
  fallingBasket.style.setProperty('--basket-mask', `${61 - progress * 24}%`);
}

function clearHeldStar() {
  starHolder = undefined;
  starReach = undefined;
  heldStar.hidden = true;
}

function resetSky() {
  climbStep = 0;
  basketStarCount = 3;
  skyStars.replaceChildren();
  clearHeldStar();
}

function renderSkyStage() {
  const stage = climbStep >= 8 ? 'moon' : climbStep === 4 && basketStarCount > 0 ? 'place' : 'climb';
  skyView.dataset.stage = stage;
  skyPlacement.hidden = stage !== 'place';
  skyMoon.hidden = stage !== 'moon';
  moonHitArea.toggleAttribute('hidden', stage !== 'moon');
  skyGuideDetail.hidden = stage !== 'place';
  skyLadder.style.setProperty('--climb', `${climbStep * 19}svh`);
  for (const [index, rung] of skyRungs.entries()) {
    rung.tabIndex = stage === 'climb' && index === climbStep ? 0 : -1;
    if (stage === 'climb' && index === climbStep) rung.setAttribute('aria-current', 'step');
    else rung.removeAttribute('aria-current');
  }
  if (stage === 'climb' && climbStep !== 4) {
    showLadderGuide();
  } else {
    skyGuide.textContent = stage === 'moon' ? '달에 도착했어요! 달을 눌러 주세요.'
      : stage === 'place' ? '하늘에 별을 배치해 주세요'
      : '별을 모두 걸었어요! 확인하기 위해 사다리를 더 올라가 볼까요?';
  }
  scheduleSkyAssist();
}

function showLadderGuide() {
  const highlight = document.createElement('strong');
  highlight.textContent = '빛나는 발판';
  skyGuide.replaceChildren('사다리를 올라가 볼까요?', document.createElement('br'),
    highlight, '을 아래에서부터 차례대로 눌러 주세요.');
}

function scheduleSkyAssist() {
  clearTimeout(skyIdleTimer);
  if (skyView.hidden || skyView.dataset.stage === 'moon') return;
  skyIdleTimer = setTimeout(() => {
    if (skyView.dataset.stage === 'climb') {
      climbNextRung();
    } else {
      const index = 3 - basketStarCount;
      const [x, y] = [[.24, .38], [.72, .29], [.80, .61]][index];
      hangSkyStar(innerWidth * x, innerHeight * y);
    }
  }, 10000);
}

function climbNextRung() {
  if (skyView.hidden || skyView.dataset.stage !== 'climb' || climbTimer) return;
  clearTimeout(skyIdleTimer);
  climbStep += 1;
  skyLadder.style.setProperty('--climb', `${climbStep * 19}svh`);
  climbTimer = setTimeout(() => {
    climbTimer = undefined;
    renderSkyStage();
    if (climbStep === 4 || climbStep === 8) playChime('discovery');
  }, 620);
}

function placeHeldStar(x, y) {
  heldStar.style.setProperty('--x', `${x}px`);
  heldStar.style.setProperty('--y', `${y - 20}px`);
  heldStar.hidden = false;
}

function pickBasketStar(glove, x, y) {
  starHolder = glove;
  starReach = undefined;
  placeHeldStar(x, y);
  playChime('selection');
  scheduleSkyAssist();
}

function addSkyStar(symbol, x, y) {
  const star = document.createElement('span');
  star.className = 'sky-star';
  star.textContent = symbol;
  star.style.setProperty('--x', `${x}%`);
  star.style.setProperty('--y', `${y}%`);
  skyStars.append(star);
  return star;
}

function hangSkyStar(x, y) {
  addSkyStar('★', Math.max(3, Math.min(97, x / innerWidth * 100)),
    Math.max(4, Math.min(96, (y - 20) / innerHeight * 100)));
  clearHeldStar();
  basketStarCount -= 1;
  if (basketStarCount > 0) {
    setBasketFill(basketStarCount / 3);
    playChime('discovery');
    scheduleSkyAssist();
    return;
  }
  basketHolder = undefined;
  fallingBasket.hidden = true;
  for (let index = 0; index < 64; index += 1) {
    const x = 3 + ((index * 71 + index * index * 13) % 94);
    const y = 5 + ((index * 53 + index * index * 19) % 90);
    const star = addSkyStar(index % 3 === 0 ? '✦' : '•', x, y);
    star.dataset.small = '';
    star.style.setProperty('--size', `${4 + index % 8}px`);
    star.style.setProperty('--delay', `${(index % 15) * .09}s`);
    star.style.setProperty('--duration', `${.9 + (index % 7) * .18}s`);
  }
  renderSkyStage();
  playChime('stars');
}

function updateSkyHands(hands) {
  if (skyView.dataset.stage !== 'place') return;
  if (starHolder === pointerGlove) return;
  if (starHolder) {
    const hand = hands.find(({ glove }) => glove === starHolder);
    if (!hand) {
      heldStar.hidden = true;
      return;
    }
    const { x, y, pose } = hand;
    if ((pose === 'open' || pose === 'point') && (fallingBasket.hidden || !nearWindowTarget(fallingBasket, x, y, -8))) {
      hangSkyStar(x, y);
    }
  } else {
    const hand = !fallingBasket.hidden && hands.find(({ glove, x, y, tipX, tipY }) => glove !== basketHolder
      && (nearWindowTarget(fallingBasket, x, y, 76) || nearWindowTarget(fallingBasket, tipX, tipY, 55)));
    if (hand) {
      const now = performance.now();
      if (starReach?.glove !== hand.glove) starReach = { glove: hand.glove, time: now };
      if (hand.pose === 'fist' || now - starReach.time >= 500) pickBasketStar(hand.glove, hand.x, hand.y);
    } else starReach = undefined;
  }
}

function pickUpSun(glove, x, y) {
  if (sunHolder) return;
  sunHolder = glove;
  glove.src = gloveImages.fist;
  advanceWindowStep();
  placeHeldSun(x, y, glove === pointerGlove);
}

function returnWithSun() {
  if (windowView.hidden || !sunHolder || windowStep !== 3) return;
  showView('interior');
  playChime('discovery');
}

function detectSunShake(hand, time) {
  if (!hand) {
    sunShake = undefined;
    return;
  }
  const { x, y } = hand;
  if (!sunShake || time - sunShake.time > 800) {
    sunShake = { x, y, time, axis: null, direction: 0, strokes: 0 };
    return;
  }
  const dx = x - sunShake.x;
  const dy = y - sunShake.y;
  const axis = sunShake.axis ?? (Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y');
  const distance = axis === 'x' ? dx : dy;
  if (Math.abs(distance) < Math.max(24, Math.min(innerWidth, innerHeight) * .055)) return;
  const direction = Math.sign(distance);
  if (direction === sunShake.direction) {
    sunShake.x = x;
    sunShake.y = y;
    return;
  }
  const strokes = sunShake.strokes + 1;
  sunShake = { x, y, time, axis, direction, strokes };
  if (strokes === 3) returnWithSun();
}

function updateWindowHands(hands) {
  if (windowStep === 0) {
    const points = hands.filter(({ pose }) => pose === 'point').sort((a, b) => a.tipX - b.tipX);
    if (points.length !== 2) {
      curtainStart = undefined;
      return;
    }
    const [left, right] = points;
    curtainStart ??= [left.tipX, right.tipX];
    const spread = Math.max(35, innerWidth * .035);
    if (curtainStart[0] - left.tipX >= spread && right.tipX - curtainStart[1] >= spread) advanceWindowStep();
  } else if (windowStep === 1 && cordGrab?.pointerId === undefined) {
    if (cordGrab) {
      const hand = hands.find(({ glove, pose }) => glove === cordGrab.glove && pose === 'fist');
      if (hand) pullWindowCord(hand.y);
      else releaseWindowCord();
    } else {
      const hand = hands.find(({ pose, x, y }) => pose === 'fist' && nearWindowTarget(cordTarget, x, y, 18));
      if (hand) grabWindowCord(hand.y, { glove: hand.glove });
    }
  } else if (windowStep === 2) {
    const hand = hands.find(({ pose, x, y, tipX, tipY }) =>
      (pose === 'point' && nearWindowTarget(sunTarget, tipX, tipY)) ||
      (pose === 'fist' && nearWindowTarget(sunTarget, x, y, 18)));
    if (hand) pickUpSun(hand.glove, hand.x, hand.y);
    else if (performance.now() - sunPickupStarted >= 7000) {
      showWindowInstruction('손을 해 가까이에 가져가면 자동으로 잡혀요.');
      const nearby = hands.find(({ x, y, tipX, tipY }) =>
        nearWindowTarget(sunTarget, x, y, 42) || nearWindowTarget(sunTarget, tipX, tipY, 30));
      if (nearby) pickUpSun(nearby.glove, nearby.x, nearby.y);
    }
  } else if (windowStep === 3 && sunHolder !== pointerGlove) {
    detectSunShake(hands.find(({ glove }) => glove === sunHolder), performance.now());
  }
}

function trackHands(session) {
  session.frame = requestAnimationFrame((time) => {
    try {
      if (video.readyState >= 2 && session.videoTime !== video.currentTime) {
        session.videoTime = video.currentTime;
        drawHands(session.landmarker.detectForVideo(video, time));
      }
      if (cameraSession === session) trackHands(session);
    } catch (error) {
      console.error(error);
      stopCamera('손 추적이 중단됐어요. 웹캠을 다시 켜주세요.');
    }
  });
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    stopCamera('이 주소에서는 웹캠을 사용할 수 없어요. Chrome에서 파일을 직접 열거나 HTTPS로 접속해 주세요.');
    return;
  }
  const session = { videoTime: -1 };
  cameraSession = session;
  cameraToggle.textContent = 'OFF';
  cameraToggle.setAttribute('aria-label', '웹캠 끄기');
  cameraToggle.setAttribute('aria-pressed', 'true');
  cameraStatus.textContent = '웹캠과 손 인식을 준비하고 있어요.';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    });
    if (cameraSession !== session) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    session.stream = stream;
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      if (cameraSession === session) stopCamera('웹캠 연결이 끊어졌어요.');
    });
    video.srcObject = stream;
    await video.play();
    const { FilesetResolver, HandLandmarker } = await import(`${visionPackage}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(`${visionPackage}/wasm`);
    if (cameraSession !== session) return;
    const landmarker = await HandLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: handModel },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    if (cameraSession !== session) {
      landmarker.close();
      return;
    }
    session.landmarker = landmarker;
    updatePointer();
    trackHands(session);
  } catch (error) {
    if (cameraSession !== session) return;
    console.error(error);
    stopCamera(error.name === 'NotAllowedError'
      ? '웹캠을 사용하려면 브라우저에서 카메라 접근을 허용해 주세요.'
      : '웹캠이나 손 인식을 시작하지 못했어요. 카메라와 인터넷 연결을 확인해 주세요.');
  }
}

function updateRoomControls() {
  roomControls[0].disabled = roomScroll.scrollLeft <= 1;
  roomControls[1].disabled = roomScroll.scrollLeft + roomScroll.clientWidth >= roomScroll.scrollWidth - 1;
  if (roomControls[1].disabled) showRoomDiscovery();
}

function showRoomDiscovery() {
  if (interior.hidden || roomStage !== 'exploring') return;
  clearTimeout(roomDiscoveryTimer);
  roomDiscoveryTimer = undefined;
  clearRoomFeedback();
  roomStage = 'awaiting-note';
  roomGuideIntro.hidden = true;
  roomGuideDiscovery.hidden = false;
  playChime('discovery');
}

function clearRoomFeedback() {
  clearTimeout(roomFeedbackTimer);
  roomFeedback.replaceChildren();
}

function showRoomFeedback(message) {
  clearRoomFeedback();
  const card = document.createElement('p');
  card.className = 'house-message-card';
  card.textContent = message;
  roomFeedback.append(card);
  playChime('guide');
  roomFeedbackTimer = setTimeout(clearRoomFeedback, 3000);
}

function setNoteOpen(open) {
  if (open === !noteOverlay.hidden) return;
  noteOverlay.hidden = !open;
  interior.inert = sceneMenu.inert = !noteOverlay.hidden;
  roomNote.setAttribute('aria-expanded', String(open));
  noteMethod.hidden = true;
  noteInstructions.setAttribute('aria-expanded', 'false');
  clearHandActions();
  handDrag = null;
  if (open) {
    showHelp(false);
    playChime('note');
    noteInstructions.focus({ preventScroll: true });
  } else {
    roomNote.focus({ preventScroll: true });
  }
}

function panRoom(direction) {
  roomScroll.scrollBy({
    left: direction * roomScroll.clientWidth * 0.75,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}

roomScroll.addEventListener('scroll', updateRoomControls);
window.addEventListener('resize', updateRoomControls);
roomControls.forEach((button) => button.addEventListener('click', () => panRoom(Number(button.dataset.pan))));
roomObjects.forEach((button) => button.addEventListener('click', () => {
  if (roomStage === 'exploring') {
    showRoomFeedback('주변을 먼저 둘러봐 주세요.');
  } else if (button === roomNote && roomStage === 'awaiting-note') {
    roomStage = 'reading-note';
    roomGuideDiscovery.hidden = true;
    clearRoomFeedback();
    setNoteOpen(true);
  } else if (roomStage === 'awaiting-note') {
    showRoomFeedback('침대 위의 메모를 먼저 확인해 주세요.');
  } else if (button === roomWindow) {
    if (sunHolder || sunlightDelivered) showRoomFeedback('창문은 이미 확인했어요.');
    else showView('window');
  } else if (button === roomNote) {
    showRoomFeedback('메모는 이미 확인했어요.');
  } else if (sunHolder || sunlightDelivered) {
    doorSound.currentTime = 0;
    doorSound.play().catch(() => {});
    showView('yard');
  } else {
    showRoomFeedback('아직 나가면 안될텐데...');
  }
}));
noteClose.addEventListener('click', () => {
  if (roomStage === 'reading-note') roomStage = 'note-read';
  setNoteOpen(false);
  if (roomStage === 'note-read') pinnedNote.hidden = false;
});
sunReturn.addEventListener('click', () => {
  if (sunHolder === pointerGlove) returnWithSun();
});
for (const object of yardObjects) {
  object.addEventListener('click', () => {
    if (nightYard.hasAttribute('data-zoom')) return;
    if (object.dataset.yardObject === 'box') {
      if (basketCaught) {
        yardFeedback.textContent = '별을 이미 담았어요.';
        yardFeedback.hidden = false;
        clearTimeout(yardFeedbackTimer);
        yardFeedbackTimer = setTimeout(() => { yardFeedback.hidden = true; }, 2500);
        return;
      }
      const art = object.closest('.night-yard-art').getBoundingClientRect();
      const box = object.getBoundingClientRect();
      nightYard.style.setProperty('--cart-zoom-x', `${box.left + box.width / 2 - art.left}px`);
      nightYard.style.setProperty('--cart-zoom-y', `${box.top + box.height / 2 - art.top}px`);
      nightYard.dataset.zoom = '';
      yardFeedback.hidden = true;
      yardZoomTimer = setTimeout(() => showView('cart'), 530);
      return;
    }
    if (basketCaught) {
      nightYard.style.setProperty('--cart-zoom-x', '41%');
      nightYard.style.setProperty('--cart-zoom-y', '35%');
      nightYard.dataset.zoom = '';
      yardZoomTimer = setTimeout(() => {
        showView('sky');
        playChime('guide');
      }, 530);
      return;
    }
    yardFeedback.textContent = '별박스를 먼저 확인해 주세요.';
    yardFeedback.hidden = false;
    playChime('guide');
    clearTimeout(yardFeedbackTimer);
    yardFeedbackTimer = setTimeout(() => { yardFeedback.hidden = true; }, 2500);
  });
}
for (const [index, rung] of skyRungs.entries()) {
  rung.addEventListener('click', () => {
    if (skyView.dataset.stage !== 'climb' || climbTimer) return;
    if (index !== climbStep) {
      showLadderGuide();
      return;
    }
    climbNextRung();
  });
}
skyPlacement.addEventListener('click', (event) => {
  if (cameraSession?.landmarker || !basketCaught) return;
  const x = event.detail ? event.clientX : innerWidth * (.25 + (3 - basketStarCount) * .24);
  const y = event.detail ? event.clientY : innerHeight * .38;
  if (starHolder) hangSkyStar(x, y);
  else if (!event.detail || (!fallingBasket.hidden && nearWindowTarget(fallingBasket, x, y, 76))) {
    pickBasketStar(pointerGlove, x, y);
  }
});

function closeMoonFinale() {
  if (moonFinale.hidden) return;
  moonFinale.hidden = true;
  skyView.inert = sceneMenu.inert = false;
}

moonOpen.addEventListener('click', () => {
  if (skyView.hidden || skyMoon.hidden || !ending.hidden) return;
  moonFinale.hidden = false;
  skyView.inert = sceneMenu.inert = true;
  showHelp(false);
  clearHandActions();
  playChime('stars');
  replayFilm.focus();
});

function returnFromEnding() {
  if (ending.hidden || endingReturning) return;
  clearTimeout(endingTimer);
  endingReturning = true;
  endingFilm.pause();
  endingFilm.hidden = true;
  exitFilm.hidden = true;
  stopCamera();
  showView('title');
  ending.dataset.returning = '';
  setTimeout(() => {
    ending.hidden = true;
    delete ending.dataset.returning;
    moonFinale.inert = false;
    endingReturning = false;
    endingFilm.load();
    endingFilm.style.opacity = '';
    endingFilm.volume = 1;
  }, 700);
}

function startEnding(withFilm) {
  if (moonFinale.hidden || !ending.hidden) return;
  ending.hidden = false;
  moonFinale.inert = true;
  endingFilm.hidden = !withFilm;
  exitFilm.hidden = !withFilm;
  if (!withFilm) stopCamera();
  pointerEvent = null;
  updatePointer();
  if (withFilm) {
    exitFilm.focus();
    endingFilm.play().catch(scheduleEndingReturn);
  } else {
    scheduleEndingReturn();
  }
}

function scheduleEndingReturn() {
  if (ending.hidden || endingReturning) return;
  clearTimeout(endingTimer);
  endingTimer = setTimeout(returnFromEnding, 1300);
}

replayFilm.addEventListener('click', () => startEnding(true));
finishGame.addEventListener('click', () => startEnding(false));
exitFilm.addEventListener('click', returnFromEnding);
endingFilm.addEventListener('timeupdate', () => {
  const remaining = endingFilm.duration - endingFilm.currentTime;
  if (Number.isFinite(remaining)) {
    const fade = Math.max(0, Math.min(1, remaining / 1.5));
    endingFilm.style.opacity = fade;
    endingFilm.volume = fade;
  }
});
endingFilm.addEventListener('ended', returnFromEnding);
endingFilm.addEventListener('error', () => {
  if (!endingFilm.hidden) scheduleEndingReturn();
});
for (const [step, button] of cartChecklist.entries()) {
  button.addEventListener('click', () => {
    if (cartStep === 3) return;
    if (step <= cartStep) {
      cartGuide.textContent = cartHints[cartStep];
    } else {
      cartGuide.textContent = `먼저 할 일이 있어요. ${cartHints[cartStep]}`;
      playChime('guide');
    }
  });
}
fallingBasket.addEventListener('click', (event) => {
  if (cameraSession?.landmarker) return;
  const bounds = fallingBasket.getBoundingClientRect();
  catchBasket(pointerGlove, event.detail ? event.clientX : bounds.left + bounds.width / 2,
    event.detail ? event.clientY : bounds.top + bounds.height / 2);
});
noteInstructions.addEventListener('click', () => {
  noteMethod.hidden = !noteMethod.hidden;
  noteInstructions.setAttribute('aria-expanded', String(!noteMethod.hidden));
  if (!noteMethod.hidden) playChime('note');
});

for (const button of windowActions) {
  const action = Number(button.dataset.windowAction);
  button.addEventListener('click', (event) => {
    if (!selectWindowAction(action)) return;
    if (cameraSession?.landmarker) {
      showWindowInstruction(windowHints[action]);
    } else if (action === 0) {
      advanceWindowStep();
    } else if (action === 1) {
      if (event.detail === 0) advanceWindowStep();
      else showWindowInstruction('작은 줄을 누른 채 아래로 끌어 주세요.');
    } else {
      const bounds = sunTarget.getBoundingClientRect();
      pickUpSun(pointerGlove, pointerEvent?.clientX ?? bounds.left + bounds.width / 2,
        pointerEvent?.clientY ?? bounds.top + bounds.height / 2);
    }
  });
}
const cordButton = cordTarget.querySelector('button');
cordButton.addEventListener('pointerdown', (event) => {
  if (windowStep !== 1 || cameraSession?.landmarker || event.button !== 0) return;
  cordButton.setPointerCapture(event.pointerId);
  grabWindowCord(event.clientY, { pointerId: event.pointerId });
});
cordButton.addEventListener('pointermove', (event) => {
  if (cordGrab?.pointerId === event.pointerId) pullWindowCord(event.clientY);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  cordButton.addEventListener(type, (event) => {
    if (cordGrab?.pointerId === event.pointerId) releaseWindowCord();
  });
}

let roomDrag = null;
roomScroll.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  roomDrag = { id: event.pointerId, x: event.clientX, scrollLeft: roomScroll.scrollLeft };
});
roomScroll.addEventListener('pointermove', (event) => {
  if (roomDrag?.id !== event.pointerId || !(event.buttons & 1)) return;
  const distance = event.clientX - roomDrag.x;
  if (!roomScroll.hasPointerCapture(event.pointerId) && Math.abs(distance) < 6) return;
  roomScroll.setPointerCapture(event.pointerId);
  roomScroll.scrollLeft = roomDrag.scrollLeft - distance;
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  roomScroll.addEventListener(event, () => { roomDrag = null; });
}

cameraToggle.addEventListener('click', () => {
  if (cameraSession) stopCamera();
  else startCamera();
});
window.addEventListener('pagehide', () => stopCamera());
start.addEventListener('click', () => showView('landscape'));
door.addEventListener('click', () => {
  if (door.hidden || door.disabled) return;
  door.disabled = true;
  experience.dataset.doorOpening = '';
  doorSound.currentTime = 0;
  doorSound.play().catch(() => {});
  fadeOpeningMusic();
  doorOpeningTimer = setTimeout(() => showView('interior'), 460);
});
home.addEventListener('click', () => showView('title'));
back.addEventListener('click', () => {
  const previousViews = { window: 'interior', interior: 'landscape', landscape: 'title', yard: 'interior', cart: 'yard', sky: 'yard' };
  showView(previousViews[experience.dataset.view] ?? 'title');
});
helpToggle.addEventListener('click', () => {
  if (!helpToggle.hasAttribute('data-hand-hover')) showHelp(sceneHelp.hidden);
});
experience.addEventListener('keydown', (event) => {
  if (!ending.hidden) return;
  if (!moonFinale.hidden) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMoonFinale();
      moonOpen.focus();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      (document.activeElement === replayFilm ? finishGame : replayFilm).focus();
    }
    return;
  }
  if (!noteOverlay.hidden) {
    if (event.key === 'Escape') {
      event.preventDefault();
      noteClose.click();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      (document.activeElement === noteInstructions ? noteClose : noteInstructions).focus();
    }
    return;
  }
  if (event.key === 'Escape' && !sceneMenu.hidden) {
    if (sceneHelp.hidden) back.click();
    else if (!helpToggle.hasAttribute('data-hand-hover')) showHelp(false);
  }
  if (!interior.hidden && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    panRoom(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
