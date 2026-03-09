let wordsToStudy = [];
let currentIndex = 0;
let score = 0;
let currentCorrectTranslations = [];

// Configuração da API de Reconhecimento de Voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.continuous = false;
recognition.interimResults = false;

// Função para buscar tradução na API MyMemory (Robusta e Gratuita)
async function getTranslations(word) {
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=pt|en`);
        const data = await response.json();
        
        // Pegamos a tradução principal e limpamos o texto
        let translation = data.responseData.translatedText.toLowerCase().replace(/[.,!?]/g, "").trim();
        return [translation]; 
    } catch (e) {
        console.error("Erro ao traduzir:", e);
        return [];
    }
}

async function startApp() {
    const text = document.getElementById('inputList').value;
    wordsToStudy = text.split('\n').map(w => w.trim()).filter(w => w !== "");
    
    if (wordsToStudy.length === 0) return alert("Por favor, digite ao menos uma palavra!");
    
    document.getElementById('setup').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    showWord();
}

async function showWord() {
    const pt = wordsToStudy[currentIndex];
    const display = document.getElementById('display-word');
    const resultDiv = document.getElementById('result');
    
    display.textContent = "Buscando...";
    resultDiv.classList.add('hidden');
    document.getElementById('btn-next').classList.add('hidden');
    
    // Busca tradução em tempo real
    currentCorrectTranslations = await getTranslations(pt);
    
    display.textContent = pt;
    document.getElementById('stat-pos').textContent = currentIndex + 1;
    document.getElementById('stat-total').textContent = wordsToStudy.length;
}

// Lógica do Botão de Escutar
const btnListen = document.getElementById('btn-listen');
btnListen.onclick = () => {
    try {
        recognition.start();
        btnListen.textContent = "Escutando...";
        btnListen.classList.add('recording');
    } catch (e) {
        console.log("Aguardando fim do processo anterior...");
    }
};

recognition.onresult = (event) => {
    const spoken = event.results[0][0].transcript.toLowerCase().trim().replace(/[.,!?]/g, "");
    btnListen.textContent = "🎤 Clicar e Falar";
    btnListen.classList.remove('recording');
    checkAnswer(spoken);
};

recognition.onerror = () => {
    btnListen.textContent = "🎤 Clicar e Falar";
    btnListen.classList.remove('recording');
    alert("Erro ao acessar o microfone. Verifique se deu permissão no Safari/Chrome.");
};

function checkAnswer(spoken) {
    const resultDiv = document.getElementById('result');
    resultDiv.classList.remove('hidden');
    
    // Compara o que foi dito com o que a API traduziu
    // Aceita se a palavra falada estiver contida na tradução ou vice-versa
    const correct = currentCorrectTranslations.some(t => spoken === t || spoken.includes(t) || t.includes(spoken));

    if (correct) {
        resultDiv.innerHTML = `✅ Correto!<br><small>Você disse: "${spoken}"</small>`;
        resultDiv.className = "result-box msg-success";
        score++;
        document.getElementById('stat-ok').textContent = score;
    } else {
        const expected = currentCorrectTranslations[0] || "Erro na tradução";
        resultDiv.innerHTML = `❌ Errado!<br><small>Você disse "${spoken}".<br>Esperado: "${expected}"</small>`;
        resultDiv.className = "result-box msg-error";
    }
    
    document.getElementById('btn-next').classList.remove('hidden');
}

function playAudio() {
    if (currentCorrectTranslations.length > 0) {
        const msg = new SpeechSynthesisUtterance(currentCorrectTranslations[0]);
        msg.lang = 'en-US';
        window.speechSynthesis.speak(msg);
    }
}

function nextWord() {
    currentIndex++;
    if (currentIndex < wordsToStudy.length) {
        showWord();
    } else {
        alert(`Treino Finalizado!\nAcertos: ${score} de ${wordsToStudy.length}`);
        location.reload();
    }
}
