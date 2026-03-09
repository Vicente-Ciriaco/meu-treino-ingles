let wordsToStudy = [];
let currentIndex = 0;
let score = 0;
let currentCorrectTranslations = [];
let isContinuousMode = false;
let missedWords = []; // Lista para guardar os erros

// Configuração do Reconhecimento de Voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.continuous = true;
recognition.interimResults = false;

async function getTranslations(word) {
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=pt|en`);
        const data = await response.json();
        let translation = data.responseData.translatedText.toLowerCase().replace(/[.,!?]/g, "").trim();
        return [translation]; 
    } catch (e) {
        return [];
    }
}

async function startApp() {
    const text = document.getElementById('inputList').value;
    wordsToStudy = text.split('\n').map(w => w.trim()).filter(w => w !== "");
    if (wordsToStudy.length === 0) return alert("Digite as palavras!");
    
    missedWords = []; // Reinicia lista de erros
    document.getElementById('setup').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    showWord();
}

async function showWord() {
    if (currentIndex >= wordsToStudy.length) {
        finishTraining();
        return;
    }
    const pt = wordsToStudy[currentIndex];
    const display = document.getElementById('display-word');
    display.textContent = "⏳ Carregando...";
    
    currentCorrectTranslations = await getTranslations(pt);
    display.textContent = pt;
    
    document.getElementById('stat-pos').textContent = currentIndex + 1;
    document.getElementById('stat-total').textContent = wordsToStudy.length;
    document.getElementById('result').classList.add('hidden');
}

const btnListen = document.getElementById('btn-listen');
btnListen.onclick = () => {
    if (!isContinuousMode) {
        recognition.start();
        isContinuousMode = true;
        btnListen.textContent = "🛑 Parar Microfone";
        btnListen.classList.add('recording');
    } else {
        stopMicrophone();
    }
};

function stopMicrophone() {
    recognition.stop();
    isContinuousMode = false;
    btnListen.textContent = "🎤 Iniciar Treino Ativo";
    btnListen.classList.remove('recording');
}

recognition.onresult = (event) => {
    const lastIndex = event.results.length - 1;
    const spoken = event.results[lastIndex][0].transcript.toLowerCase().trim().replace(/[.,!?]/g, "");
    checkAnswer(spoken);
};

function checkAnswer(spoken) {
    const resultDiv = document.getElementById('result');
    const pt = wordsToStudy[currentIndex];
    const expected = currentCorrectTranslations[0].toLowerCase().trim().replace(/[.,!?]/g, "");
    
    const isCorrect = spoken === expected || spoken.includes(expected) || expected.includes(spoken);
    resultDiv.classList.remove('hidden');

    if (isCorrect) {
        resultDiv.innerHTML = `✅ ACERTOU: "${spoken}"`;
        resultDiv.className = "result-box msg-success";
        score++;
        document.getElementById('stat-ok').textContent = score;
        
        setTimeout(() => {
            if (isContinuousMode) nextWord();
        }, 1500);
    } else {
        resultDiv.innerHTML = `❌ OUVI: "${spoken}"<br><small>Tente novamente para: "${expected}"</small>`;
        resultDiv.className = "result-box msg-error";
        
        // Adiciona aos erros se ainda não estiver na lista
        if (!missedWords.some(item => item.pt === pt)) {
            missedWords.push({ pt: pt, en: expected });
        }
    }
}

function nextWord() {
    currentIndex++;
    showWord();
}

function finishTraining() {
    stopMicrophone();
    const appDiv = document.getElementById('app');
    
    let reportHTML = `
        <h2>Treino Finalizado!</h2>
        <div class="stats-grid">
            <div>Total: ${wordsToStudy.length}</div>
            <div>Acertos: ${score}</div>
        </div>
    `;

    if (missedWords.length > 0) {
        reportHTML += `<h3>Palavras para revisar:</h3><ul style="text-align: left; background: #fff4f4; padding: 15px; border-radius: 8px; list-style: none;">`;
        missedWords.forEach(item => {
            reportHTML += `<li style="margin-bottom: 8px; border-bottom: 1px solid #fca5a5; padding-bottom: 4px;">
                <strong>${item.pt}:</strong> ${item.en}
            </li>`;
        });
        reportHTML += `</ul>`;
    } else {
        reportHTML += `<p style="color: green; font-weight: bold;">Perfeito! Você não errou nenhuma palavra. 🏆</p>`;
    }

    reportHTML += `<button class="btn btn-blue" onclick="location.reload()">Novo Treino</button>`;
    
    appDiv.innerHTML = reportHTML;
}

function playAudio() {
    if (currentCorrectTranslations.length > 0) {
        const msg = new SpeechSynthesisUtterance(currentCorrectTranslations[0]);
        msg.lang = 'en-US';
        window.speechSynthesis.speak(msg);
    }
}

recognition.onend = () => {
    if (isContinuousMode) recognition.start();
};
