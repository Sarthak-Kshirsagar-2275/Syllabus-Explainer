const API_URL = 'https://syllabus-explainer-backend.vercel.app/api/explain';
const input = document.querySelector('#topic-input');
const explainButton = document.querySelector('#explain-button');
const resultContent = document.querySelector('#result-content');
const errorMessage = document.querySelector('#error-message');
const characterCount = document.querySelector('#character-count');
const copyButton = document.querySelector('#copy-button');
const threeContainer = document.getElementById('three-container');

let currentRenderer = null;
let animationFrameId = null;
let currentCamera = null;

input.addEventListener('input', () => {
  characterCount.textContent = `${input.value.length.toLocaleString()} / 12,000`;
  hideError();
});

input.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') explainTopic();
});

explainButton.addEventListener('click', explainTopic);
copyButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(resultContent.innerText);
  copyButton.textContent = 'Copied';
  setTimeout(() => { copyButton.textContent = 'Copy answer'; }, 1600);
});

async function explainTopic() {
  const text = input.value.trim();
  if (!text) {
    showError('Add a lecture topic or passage so I know what to explain.');
    input.focus();
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something went wrong.');
    

    const explanationText = data.explanation || 'No explanation generated. Please try again.';
    renderExplanation(explanationText);
    
    if (threeContainer) {
      mount3DEnvironment(data.spatial_flag);
    }
    
  } catch (error) {
    showError(error.message.includes('Failed to fetch')
      ? 'The backend is not running. Start it with “npm run dev” in the backend folder.'
      : error.message);
  } finally {
    setLoading(false);
  }
}

function renderExplanation(text) {
  resultContent.classList.remove('empty-state');
  resultContent.innerHTML = formatExplanation(text);
  copyButton.hidden = false;
  resultContent.scrollTop = 0;
}

function formatExplanation(text) {
  
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*/g, '')
    .replace(/\\bmod/g, ' mod ')
    .replace(/\\pmod{([^}]+)}/g, ' (mod $1) ')
    .replace(/\\equiv/g, ' ≡ ')
    .replace(/\\[()]/g, '') 
    .replace(/[{}]/g, '')   
    .replace(/\\/g, '')     
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (/^\d+\.\s/.test(trimmed)) return `<h3>${trimmed.replace(/^\d+\.\s/, '')}</h3>`;
      if (/^[-*]\s/.test(trimmed)) return `<li>${trimmed.replace(/^[-*]\s/, '')}</li>`;
      return `<p>${trimmed}</p>`;
    }).join('');
}

function setLoading(isLoading) {
  explainButton.disabled = isLoading;
  explainButton.querySelector('.button-label').textContent = isLoading ? 'Thinking' : 'Explain this';
  explainButton.querySelector('.button-arrow').textContent = isLoading ? '…' : '→';
  if (isLoading) {
    copyButton.hidden = true;
    resultContent.className = 'result-content empty-state';
    resultContent.innerHTML = '<div class="empty-icon loading-dots" aria-hidden="true">✦</div><p>Making this click</p><span>Reading your topic and finding the clearest path.</span>';
    
    if (threeContainer) threeContainer.style.display = 'none';
  }
}

function showError(message) { errorMessage.textContent = message; errorMessage.hidden = false; }
function hideError() { errorMessage.hidden = true; }

function mount3DEnvironment(spatialFlag) {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (currentRenderer) {
    threeContainer.innerHTML = '';
    currentRenderer.dispose();
  }

  if (!spatialFlag || spatialFlag === 'none') {
    threeContainer.style.display = 'none';
    return;
  }

  threeContainer.style.display = 'block';

  const scene = new THREE.Scene();
  currentCamera = new THREE.PerspectiveCamera(75, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
  currentCamera.position.z = 5;

  currentRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  currentRenderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
  threeContainer.appendChild(currentRenderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(2, 2, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  let geometry, material, mesh;
  
  if (spatialFlag === 'sphere') {
    geometry = new THREE.SphereGeometry(2, 32, 32);
    material = new THREE.MeshStandardMaterial({ color: 0x0077ff, wireframe: true });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  } else if (spatialFlag === 'cube') {
    geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    material = new THREE.MeshStandardMaterial({ color: 0xff0055 });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  } else if (spatialFlag === 'particles') {
    geometry = new THREE.BufferGeometry();
    const vertices = [];
    for ( let i = 0; i < 500; i ++ ) {
      vertices.push(THREE.MathUtils.randFloatSpread(10), THREE.MathUtils.randFloatSpread(10), THREE.MathUtils.randFloatSpread(10));
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    material = new THREE.PointsMaterial({ color: 0x00ffcc, size: 0.1 });
    mesh = new THREE.Points(geometry, material);
    scene.add(mesh);
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (mesh) {
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.01;
    }
    currentRenderer.render(scene, currentCamera);
  }
  
  animate();
}


window.addEventListener('resize', () => {
  if (currentRenderer && currentCamera && threeContainer.style.display !== 'none') {
    currentCamera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
    currentCamera.updateProjectionMatrix();
    currentRenderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
  }
});
