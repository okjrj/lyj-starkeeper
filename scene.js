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
const gestureButtons = [cameraToggle, start, door, home, back, helpToggle, ...roomObjects, ...roomControls, ...windowChecklist, ...yardObjects, noteInstructions, noteClose];
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
let sunShake;
let yardFeedbackTimer;
const windowHints = [
  '두 손의 검지를 들고 커튼을 양옆으로 벌려 주세요.',
  '작은 줄 위에서 주먹을 쥐고 아래로 당겨 주세요.',
  '해 위에서 검지를 들면 해가 장갑에 붙어요.',
];
let audioContext;
const chimes = {
  selection: [[880, 0, .19, .033], [1174.66, .035, .26, .024]],
  guide: [[523.25, 0, .52, .054], [783.99, .09, .54, .044], [1046.5, .18, .72, .033]],
  discovery: [[698.46, 0, .36, .062], [1046.5, .12, .44, .055], [1396.91, .28, .68, .048]],
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
  yardFeedback.hidden = true;
  if (view === 'yard') {
    for (const object of yardObjects) object.setAttribute('aria-pressed', 'false');
  }
  clearTimeout(yardFeedbackTimer);
  clearTimeout(windowHintTimer);
  clearTimeout(windowFeedbackTimer);
  curtainStart = cordGrab = sunShake = undefined;
  if (view === 'title' || view === 'landscape') {
    sunHolder = undefined;
    heldSun.hidden = true;
  }
  updatePointer();
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
  pinnedNote.hidden = roomStage !== 'note-read' || !['interior', 'window', 'yard'].includes(view);
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
}

function updatePointer() {
  const visible = pointerEvent && !cameraSession?.landmarker;
  pointerGlove.hidden = !visible;
  if (sunHolder === pointerGlove && !visible) heldSun.hidden = true;
  experience.toggleAttribute('data-pointer-glove', Boolean(visible));
  if (visible) {
    const source = sunHolder === pointerGlove ? gloveImages.fist : gloveImages.point;
    if (pointerGlove.getAttribute('src') !== source) pointerGlove.src = source;
    placeGlove(pointerGlove, pointerEvent.clientX, pointerEvent.clientY, -.24);
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
  const windowHands = [];
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
    const source = glove === sunHolder ? gloveImages.fist : gloveImages[pose] ?? gloveImages.open;
    if (glove.getAttribute('src') !== source) glove.src = source;
    placeGlove(glove, x, y, Math.atan2(dx, -dy), flip);
    visibleGloves.add(glove);
    if (pose === 'point') pointingHands.push(x);
    if (!windowView.hidden) {
      windowHands.push({ glove, x, y, pose, tipX: (1 - points[8].x) * innerWidth, tipY: points[8].y * innerHeight });
    }
    const clicked = trackButtonGesture(glove, x, y, pose);
    clickedButton ??= clicked;
  });
  for (const glove of Object.values(handGloves)) {
    glove.hidden = !visibleGloves.has(glove);
    if (glove.hidden) handActions.delete(glove);
  }
  if (sunHolder && sunHolder !== pointerGlove && !visibleGloves.has(sunHolder)) heldSun.hidden = true;
  updateButtonHighlights();
  if (!windowView.hidden) updateWindowHands(windowHands);
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
  heldSun.style.setProperty('--x', `${x + (pointer ? 14 : 0)}px`);
  heldSun.style.setProperty('--y', `${y - (pointer ? 0 : 22)}px`);
  heldSun.hidden = false;
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
    const hand = hands.find(({ pose, tipX, tipY }) => pose === 'point' && nearWindowTarget(sunTarget, tipX, tipY));
    if (hand) pickUpSun(hand.glove, hand.x, hand.y);
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
    showView('window');
  } else if (button === roomNote) {
    showRoomFeedback('메모는 이미 확인했어요.');
  } else if (sunHolder) {
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
    for (const item of yardObjects) item.setAttribute('aria-pressed', String(item === object));
    yardFeedback.textContent = object.getAttribute('aria-label');
    yardFeedback.hidden = false;
    clearTimeout(yardFeedbackTimer);
    yardFeedbackTimer = setTimeout(() => { yardFeedback.hidden = true; }, 2500);
  });
}
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
  const previousViews = { window: 'interior', interior: 'landscape', landscape: 'title', yard: 'interior' };
  showView(previousViews[experience.dataset.view] ?? 'title');
});
helpToggle.addEventListener('click', () => {
  if (!helpToggle.hasAttribute('data-hand-hover')) showHelp(sceneHelp.hidden);
});
experience.addEventListener('keydown', (event) => {
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
