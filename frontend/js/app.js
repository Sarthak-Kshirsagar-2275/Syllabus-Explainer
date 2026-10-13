const API_URL = 'https://syllabus-explainer-backend.vercel.app/api/explain';
const input = document.querySelector('#topic-input');
const explainButton = document.querySelector('#explain-button');
const resultContent = document.querySelector('#result-content');
const errorMessage = document.querySelector('#error-message');
const characterCount = document.querySelector('#character-count');
const copyButton = document.querySelector('#copy-button');

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
    renderExplanation(data.explanation);
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
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*/g, '')
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
  }
}

function showError(message) { errorMessage.textContent = message; errorMessage.hidden = false; }
function hideError() { errorMessage.hidden = true; }
