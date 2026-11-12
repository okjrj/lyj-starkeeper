const experience = document.querySelector('.experience');
const titlePanel = document.querySelector('.title-panel');
const start = document.querySelector('.start');
const back = document.querySelector('.back');
const door = document.querySelector('.house-door');
const houseMessage = document.querySelector('.house-message');
const interior = document.querySelector('.house-interior');
const roomScroll = interior.querySelector('.room-scroll');
const roomObjects = [...interior.querySelectorAll('.room-object')];
const roomControls = [...interior.querySelectorAll('[data-pan]')];
const roomSelection = interior.querySelector('.room-selection');
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
const gestureButtons = [cameraToggle, start, door, back, ...roomObjects, ...roomControls];
const visionPackage = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32';
const handModel = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
let cameraSession = null;
let pointerEvent = null;

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

function showView(view) {
  clearHandActions();
  experience.dataset.view = view;
  titlePanel.inert = view !== 'title';
  back.hidden = view === 'title';
  back.setAttribute('aria-label', view === 'interior' ? '이전 장면으로 돌아가기' : '타이틀로 돌아가기');
  door.hidden = houseMessage.hidden = view !== 'landscape';
  interior.hidden = view !== 'interior';
  if (view === 'interior') {
    roomScroll.scrollLeft = 0;
    roomObjects.forEach((button) => button.setAttribute('aria-pressed', 'false'));
    roomSelection.textContent = '';
    updateRoomControls();
  }
  (view === 'title' ? start : back).focus();
}

function placeGlove(glove, x, y, angle = 0, flip = 1) {
  glove.style.setProperty('--x', `${x}px`);
  glove.style.setProperty('--y', `${y}px`);
  glove.style.setProperty('--angle', `${angle}rad`);
  glove.style.setProperty('--flip', flip);
  glove.hidden = false;
}

function updatePointer() {
  const visible = pointerEvent && !cameraSession?.landmarker;
  pointerGlove.hidden = !visible;
  experience.toggleAttribute('data-pointer-glove', Boolean(visible));
  if (visible) placeGlove(pointerGlove, pointerEvent.clientX, pointerEvent.clientY, -.24);
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
  clearHandActions();
  cameraToggle.textContent = '웹캠켜기';
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
  for (const button of gestureButtons) {
    button.toggleAttribute('data-hand-hover', hands.some((hand) => hand.hover === button));
  }
}

function clearHandActions() {
  handActions.clear();
  updateButtonHighlights();
}

function trackButtonGesture(glove, x, y, pose) {
  const previous = handActions.get(glove);
  const button = document.elementFromPoint(x, y)?.closest('button');
  const hover = gestureButtons.includes(button) && !button.disabled
    && Number(getComputedStyle(button).opacity) > 0 ? button : null;
  if (!hover) {
    handActions.delete(glove);
    return null;
  }
  const wasArmed = previous?.hover === hover && previous.armed;
  const armed = pose === 'fist' || (pose !== 'open' && wasArmed);
  handActions.set(glove, { hover, armed });
  return pose === 'open' && wasArmed ? hover : null;
}

function drawHands(result) {
  const visibleGloves = new Set();
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
    const anchor = pose === 'point' ? points[8] : palm;
    const x = (1 - anchor.x) * innerWidth;
    const y = anchor.y * innerHeight;
    glove.dataset.pose = pose;
    const source = gloveImages[pose] ?? gloveImages.open;
    if (glove.getAttribute('src') !== source) glove.src = source;
    // The drawn index finger leans slightly toward the thumb.
    const angle = pose === 'point'
      ? Math.atan2((points[5].x - points[8].x) * video.videoWidth,
        (points[5].y - points[8].y) * video.videoHeight) + 0.17 * flip
      : Math.atan2(dx, -dy);
    placeGlove(glove, x, y, angle, flip);
    visibleGloves.add(glove);
    const clicked = trackButtonGesture(glove, (1 - palm.x) * innerWidth, palm.y * innerHeight, pose);
    clickedButton ??= clicked;
  });
  for (const glove of Object.values(handGloves)) {
    glove.hidden = !visibleGloves.has(glove);
    if (glove.hidden) handActions.delete(glove);
  }
  updateButtonHighlights();
  cameraStatus.textContent = visibleGloves.size === 0 ? '웹캠에 양손을 보여주세요.' : '';
  if (clickedButton) clickedButton.click();
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
  cameraToggle.textContent = '웹캠끄기';
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
  roomObjects.forEach((object) => object.setAttribute('aria-pressed', String(object === button)));
  roomSelection.textContent = button.getAttribute('aria-label');
}));

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
door.addEventListener('click', () => showView('interior'));
back.addEventListener('click', () => showView(interior.hidden ? 'title' : 'landscape'));
experience.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !back.hidden) back.click();
  if (!interior.hidden && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    panRoom(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
