let wordsToStudy = [];
let currentIndex = 0;
let score = 0;
let currentCorrectTranslations = [];
let isContinuousMode = false;
let missedWords = []; 

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.continuous = true;
recognition.interimResults = false;

async function getTranslations(word) {
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=pt|en`);
        const data = await response.json();
        return [data.responseData.translatedText.toLowerCase().replace(/[.,!?]/g, "").trim()];
    } catch (e) { return []; }
}

async function startApp() {
    const text = document.getElementById('inputList').value;
    wordsToStudy = text.split('\n').map(w => w.trim()).filter(w => w !== "");
    if (wordsToStudy.length === 0) return alert("Digite algo!");
    
    currentIndex = 0;
    score = 0;
    missedWords = [];
    
    document.getElementById('setup').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('training-content').classList.remove('hidden');
    document.getElementById('report-content').classList.add('hidden');
    showWord();
}

async function showWord() {
    if (currentIndex >= wordsToStudy.length) {
        finishTraining();
        return;
    }
    const pt = wordsToStudy[currentIndex];
    document.getElementById('display-word').textContent = "⏳...";
    currentCorrectTranslations = await getTranslations(pt);
    document.getElementById('display-word').textContent = pt;
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
    const spoken = event.results[event.results.length - 1][0].transcript.toLowerCase().trim().replace(/[.,!?]/g, "");
    checkAnswer(spoken);
};

function checkAnswer(spoken) {
    const resultDiv = document.getElementById('result');
    const pt = wordsToStudy[currentIndex];
    const expected = currentCorrectTranslations[0];
    
    const isCorrect = spoken === expected || spoken.includes(expected) || expected.includes(spoken);
    resultDiv.classList.remove('hidden');

    if (isCorrect) {
        resultDiv.innerHTML = `✅ ACERTOU: "${spoken}"`;
        resultDiv.className = "result-box msg-success";
        score++;
        document.getElementById('stat-ok').textContent = score;
        setTimeout(() => { if (isContinuousMode && currentIndex < wordsToStudy.length) nextWord(); }, 1500);
    } else {
        resultDiv.innerHTML = `❌ OUVI: "${spoken}"<br><small>Tente novamente para: "${expected}"</small>`;
        resultDiv.className = "result-box msg-error";
        if (!missedWords.some(item => item.pt === pt)) missedWords.push({ pt: pt, en: expected });
    }
}

function nextWord() {
    currentIndex++;
    showWord();
}

function finishTraining() {
    stopMicrophone();
    document.getElementById('training-content').classList.add('hidden');
    const reportDiv = document.getElementById('report-content');
    reportDiv.classList.remove('hidden');
    
    let html = `<h2>Resultado Final</h2><p>Acertos: ${score} de ${wordsToStudy.length}</p>`;
    if (missedWords.length > 0) {
        html += `<h3>Lista de Revisão:</h3><ul>`;
        missedWords.forEach(i => html += `<li><strong>${i.pt}:</strong> ${i.en}</li>`);
        html += `</ul>`;
    } else {
        html += `<p style="color:green">Excelente! Nenhum erro.</p>`;
    }
    html += `<button class="btn btn-blue" onclick="location.reload()">Novo Treino</button>`;
    reportDiv.innerHTML = html;
}

function playAudio() {
    if (currentCorrectTranslations.length > 0) {
        const msg = new SpeechSynthesisUtterance(currentCorrectTranslations[0]);
        msg.lang = 'en-US';
        window.speechSynthesis.speak(msg);
    }
}

recognition.onend = () => { if (isContinuousMode) recognition.start(); };
