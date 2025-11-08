document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos ---
    const questionTitleEl = document.getElementById('question-title');
    const optionsContainerEl = document.getElementById('options-container');
    const feedbackAreaEl = document.getElementById('feedback-area');
    const backButton = document.getElementById('back-to-lesson');
    const progressBar = document.querySelector('.progress-bar');
    const imageContainerEl = document.getElementById('image-container'); 

    // --- Estado ---
    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let lessonId = null;
    let chapterId = null;

    // --- Estado da Bandeja de Letras ---
    let letterSlots = []; 
    let letterBank = []; 
    let correctAnswerLetters = []; 

    // --- [VERSÃO FINAL E COMPLETA] Normalização de texto árabe ---
    const tashkilRegex = /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;
    const tatweelRegex = /\u0640/g;
    const arabicSpaceRegex = /[\u200C\u200D\u200E\u200F]/g;
    
    function normalizeArabic(text) {
        if (!text) return '';
        
        return text
            .replace(tashkilRegex, '')  // remove harakat (vogais curtas)
            .replace(tatweelRegex, '')  // remove tatweel (ـ)
            .replace(arabicSpaceRegex, '') // remove espaços invisíveis
            
            // --- Unifica todas as formas de apresentação (U+FExx) e variantes ---
            .replace(/أ|إ|آ|ا|ﻯ|ﺍ/g, 'ا') // Alif
            .replace(/ب|ﺏ/g, 'ب') // Ba
            .replace(/ت|ﺕ/g, 'ت') // Ta
            .replace(/ث|ﺙ/g, 'ث') // Tha
            .replace(/ج|ﺝ/g, 'ج') // Jiim
            .replace(/ح|ﺡ/g, 'ح') // Haa
            .replace(/خ|ﺥ/g, 'خ') // Kha
            .replace(/د|ﺩ/g, 'د') // Dal
            .replace(/ذ|ﺫ/g, 'ذ') // Dhal
            .replace(/ر|ﺭ/g, 'ر') // Raa
            .replace(/ز|ﺯ/g, 'ز') // Za
            .replace(/س|ﺱ/g, 'س') // Sin
            .replace(/ش|ﺵ/g, 'ش') // Shin
            .replace(/ص|ﺹ/g, 'ص') // Sad
            .replace(/ض|ﺽ/g, 'ض') // Dad
            .replace(/ط|ﻁ/g, 'ط') // Ta
            .replace(/ظ|ﻅ/g, 'ظ') // Dha
            .replace(/ع|ﻉ/g, 'ع') // Ayn
            .replace(/غ|ﻍ/g, 'غ') // Ghayn
            .replace(/ف|ﻑ/g, 'ف') // Fa
            .replace(/ق|ﻕ/g, 'ق') // Qaf
            .replace(/ك|ک|ﻙ/g, 'ك') // Kaf
            .replace(/ل|ﻝ/g, 'ل') // Lam
            .replace(/م|ﻡ/g, 'م') // Mim
            .replace(/ن|ﻥ/g, 'ن') // Nuun
            .replace(/ه|ہ|ﻩ/g, 'ه') // Heh
            .replace(/ة/g, 'ه') // Taa Marbuta
            .replace(/و|ؤ|ﻭ/g, 'و') // Waw
            .replace(/ي|ی|ئ|ى|ﻱ/g, 'ي') // Yeh
            
            .trim();
    }
    // --- Fim da Normalização ---


    // --- Função para baralhar ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- Iniciar ---
    async function startQuiz() {
        const urlParams = new URLSearchParams(window.location.search);
        lessonId = urlParams.get('lesson_id');
        chapterId = urlParams.get('chapter_id');
        
        if (!lessonId || !chapterId) {
            questionTitleEl.textContent = "Erro: IDs de lição ou capítulo em falta.";
            return;
        }
        
        backButton.href = `/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}`;

        try {
            const response = await fetch(`/api/exercises?lesson_id=${lessonId}&v=${Math.random()}`);
            if (!response.ok) throw new Error('Falha ao carregar exercícios.');
            
            questions = await response.json();
            questions = questions.filter(q => 
                (q.type === 'multiple_choice' || q.type === 'letter_scramble') && 
                q.options
            );

            if (questions.length === 0) {
                questionTitleEl.textContent = "Nenhum exercício encontrado.";
                optionsContainerEl.innerHTML = '';
                return;
            }

            // [CORRIGIDO] A função de embaralhar está ativa
            shuffleArray(questions); 
            
            loadQuestion(currentQuestionIndex);

        } catch (error) {
            console.error("Erro ao buscar exercícios:", error);
            questionTitleEl.textContent = "Não foi possível carregar os exercícios.";
        }
    }

    // --- Carregar Pergunta ---
    function loadQuestion(questionIndex) {
        if (questionIndex < 0 || questionIndex >= questions.length) return;

        // Limpa tudo
        optionsContainerEl.innerHTML = '';
        imageContainerEl.innerHTML = ''; 
        feedbackAreaEl.classList.add('hidden');
        optionsContainerEl.classList.remove('options-disabled');
        letterSlots = []; 
        letterBank = []; 
        correctAnswerLetters = []; 

        const question = questions[questionIndex];
        
        if (question.image_url) {
            const img = document.createElement('img');
            img.src = question.image_url;
            img.alt = "Imagem do exercício";
            img.className = 'exercise-image'; 
            imageContainerEl.appendChild(img);
            imageContainerEl.classList.remove('hidden');
        } else {
            imageContainerEl.classList.add('hidden'); 
        }

        const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        if (question.type === 'multiple_choice') {
            loadMultipleChoice(question);
        } else if (question.type === 'letter_scramble') {
            loadLetterScramble(question);
        }
    }

    // --- Escolha Múltipla ---
    function loadMultipleChoice(question) {
        questionTitleEl.innerHTML = question.text; 

        let optionsArray = [];
        try {
            if (typeof question.options === 'string') {
                optionsArray = JSON.parse(question.options);
            } else if (Array.isArray(question.options)) {
                optionsArray = question.options;
            }
        } catch (e) { console.error("Erro ao fazer parse das opções:", e); }

        if (!Array.isArray(optionsArray)) {
             console.error("Opções não são um array:", optionsArray);
             return;
        }

        optionsArray.forEach((optionText, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option-item';
            optionElement.textContent = optionText;
            optionElement.addEventListener('click', () => selectAnswer(optionElement, index, question.correct_option_index));
            optionsContainerEl.appendChild(optionElement);
        });
    }

    // --- Bandeja de Letras ---
    function loadLetterScramble(question) {
        const fullAnswer = question.text; 
        
        if (!fullAnswer || fullAnswer.trim() === '') {
            console.error("Erro: 'text' (resposta) está vazio para esta pergunta:", question);
            questionTitleEl.innerHTML = "Erro no Exercício";
            optionsContainerEl.innerHTML = `<p style="text-align: center; color: #D9534F;"><b>Falha ao carregar:</b> Os dados desta pergunta estão em falta.<br>A resposta (campo 'text') não foi definida no banco de dados.</p>`;
            return;
        }
        
        const normalizedAnswer = normalizeArabic(fullAnswer); 
        correctAnswerLetters = normalizedAnswer.split('');

        const answerLength = correctAnswerLetters.length;
        
        // [CORRIGIDO] Adicionado <span dir="ltr"> para forçar o alinhamento LTR
        questionTitleEl.innerHTML = `<span dir="ltr">Forme a palavra: <strong>${fullAnswer}</strong></span>`;

        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'letter-slots-container';
        for (let i = 0; i < answerLength; i++) {
            const slot = document.createElement('div');
            slot.className = 'letter-slot empty';
            slot.dataset.index = i; 
            slot.addEventListener('click', () => returnLetterToBank(slot));
            slotsContainer.appendChild(slot);
            letterSlots.push(slot); 
        }

        const bankContainer = document.createElement('div');
        bankContainer.className = 'letter-bank-container';

        let letterOptions = [];
        try {
            if (typeof question.options === 'string') {
                letterOptions = JSON.parse(question.options);
            } else if (Array.isArray(question.options)) {
                letterOptions = question.options;
            }
        } catch (e) {
             console.error("Erro ao fazer parse das opções da bandeja de letras:", e);
        }
        
        if (!Array.isArray(letterOptions)) {
            console.error("Opções da bandeja de letras não são um array:", letterOptions);
            return;
        }
        
        shuffleArray(letterOptions).forEach((letter, index) => {
            const chip = document.createElement('button');
            chip.className = 'letter-bank-chip';
            chip.textContent = letter;
            chip.dataset.id = index; 
            chip.addEventListener('click', () => moveLetterToSlot(chip));
            bankContainer.appendChild(chip);
            letterBank.push(chip); 
        });

        optionsContainerEl.appendChild(slotsContainer);
        optionsContainerEl.appendChild(bankContainer);
    }

    // --- Ações da Bandeja ---
    function moveLetterToSlot(chip) {
        if (chip.classList.contains('disabled')) return;

        const firstEmptySlot = letterSlots.find(slot => slot.classList.contains('empty'));
        if (firstEmptySlot) {
            firstEmptySlot.textContent = chip.textContent;
            firstEmptySlot.classList.remove('empty');
            firstEmptySlot.dataset.chipId = chip.dataset.id;
            chip.classList.add('disabled'); 

            const allFilled = letterSlots.every(slot => !slot.classList.contains('empty'));
            if (allFilled) {
                showLetterScrambleCheckButton();
            }
        }
    }

    function returnLetterToBank(slot) {
        if (slot.classList.contains('empty') || feedbackAreaEl.classList.contains('showing-feedback')) return;

        const chipId = slot.dataset.chipId;
        const chip = letterBank.find(c => c.dataset.id === chipId);
        
        if (chip) chip.classList.remove('disabled'); 
        
        slot.textContent = '';
        slot.classList.add('empty');
        slot.dataset.chipId = '';
        
        const checkButton = document.getElementById('next-question-button');
        if (checkButton && checkButton.textContent === 'Verificar') {
            feedbackAreaEl.classList.add('hidden');
            feedbackAreaEl.innerHTML = '';
        }
    }

    function showLetterScrambleCheckButton() {
        feedbackAreaEl.innerHTML = ''; 
        const checkButton = document.createElement('button');
        checkButton.id = 'next-question-button'; 
        checkButton.textContent = 'Verificar';
        checkButton.addEventListener('click', checkLetterScrambleAnswer);
        feedbackAreaEl.appendChild(checkButton);
        feedbackAreaEl.classList.remove('hidden');
    }

    function checkLetterScrambleAnswer() {
        let userAnswer = [];
        letterSlots.forEach(slot => userAnswer.push(slot.textContent));

        let allCorrect = true;
        const answerLength = correctAnswerLetters.length;

        for (let i = 0; i < answerLength; i++) {
            if (letterSlots[i]) {
                letterSlots[i].classList.remove('correct', 'incorrect'); 
                
                const userLetter = normalizeArabic(userAnswer[i]);
                const correctLetter = normalizeArabic(correctAnswerLetters[i]);
                
                if (userLetter === correctLetter) {
                    letterSlots[i].classList.add('correct');
                } else {
                    letterSlots[i].classList.add('incorrect');
                    allCorrect = false;
                }
            } else {
                allCorrect = false;
            }
        }
        
        feedbackAreaEl.classList.add('showing-feedback'); 

        if (allCorrect) {
            score++;
            feedbackAreaEl.innerHTML = ''; 
            const feedbackTitle = document.createElement('h3');
            feedbackTitle.id = 'feedback-title';
            feedbackTitle.textContent = "Correto!";
            feedbackTitle.className = 'correct-feedback';
            feedbackAreaEl.className = 'feedback-area correct-feedback';
            feedbackAreaEl.appendChild(feedbackTitle);
            
            const nextButton = document.createElement('button');
            nextButton.id = 'next-question-button';
            nextButton.textContent = (currentQuestionIndex === questions.length - 1) ? 'Ver Resultados' : 'Continuar';
            nextButton.addEventListener('click', handleNextQuestion);
            feedbackAreaEl.appendChild(nextButton);
            
            feedbackAreaEl.classList.remove('hidden');
            
            letterSlots.forEach(slot => slot.style.pointerEvents = 'none');
            letterBank.forEach(chip => chip.disabled = true);
        } else {
            const checkButton = document.getElementById('next-question-button');
            if (checkButton) checkButton.disabled = true;

            setTimeout(() => {
                feedbackAreaEl.classList.remove('showing-feedback');
                if (checkButton) checkButton.disabled = false;
                letterSlots.forEach(slot => slot.classList.remove('incorrect'));
            }, 1500); 
        }
    }

    // --- Escolha Múltipla ---
    function selectAnswer(selectedElement, selectedOptionIndex, correctOptionIndex) {
        optionsContainerEl.classList.add('options-disabled'); 
        const isCorrect = selectedOptionIndex === correctOptionIndex;

        feedbackAreaEl.innerHTML = ''; 
        const feedbackTitle = document.createElement('h3');
        feedbackTitle.id = 'feedback-title';
        
        if (isCorrect) {
            selectedElement.classList.add('correct');
            feedbackTitle.textContent = "Correto!";
            feedbackTitle.className = 'correct-feedback';
            feedbackAreaEl.className = 'feedback-area correct-feedback';
            score++;
        } else {
            selectedElement.classList.add('incorrect');
            const correctOption = optionsContainerEl.querySelector(`.option-item:nth-child(${correctOptionIndex + 1})`);
            if (correctOption) correctOption.classList.add('correct');
            
            feedbackTitle.textContent = "Incorreto!";
            feedbackTitle.className = 'incorrect-feedback';
            feedbackAreaEl.className = 'feedback-area incorrect-feedback';
        }

        feedbackAreaEl.appendChild(feedbackTitle);
        
        const nextButton = document.createElement('button');
        nextButton.id = 'next-question-button';
        nextButton.textContent = (currentQuestionIndex === questions.length - 1) ? 'Ver Resultados' : 'Continuar';
        nextButton.addEventListener('click', handleNextQuestion);
        feedbackAreaEl.appendChild(nextButton);
        feedbackAreaEl.classList.remove('hidden');
    }

    // --- Próxima Pergunta ---
    function handleNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion(currentQuestionIndex);
        } else {
            endQuiz();
        }
    }

    // --- Fim do Quiz (com Visuais Melhorados) ---
    function endQuiz() {
        progressBar.style.width = `100%`;
        imageContainerEl.classList.add('hidden');
        questionTitleEl.textContent = `Exercícios Concluídos!`;
        
        // --- Lógica de Feedback Dinâmico ---
        let completionIcon = '🏆';
        let completionClass = 'completion-good';
        let completionTitle = 'Bom Trabalho!';
        
        const percentage = (questions.length > 0) ? (score / questions.length) * 100 : 0;
        
        if (percentage === 100) {
            completionIcon = '🏅'; // Medalha
            completionClass = 'completion-perfect';
            completionTitle = 'Perfeito!';
        } else if (percentage < 50) {
            completionIcon = '💪'; // Força
            completionClass = 'completion-needs-work';
            completionTitle = 'Continue Tentando!';
        }
        // --- Fim da Lógica de Feedback ---
        
        optionsContainerEl.innerHTML = `
            <div class="completion-box ${completionClass}">
                <span class="completion-icon">${completionIcon}</span>
                <h3>${completionTitle}</h3>
                <p>Você acertou ${score} de ${questions.length} perguntas.</p> 
                <div class="completion-actions">
                    <a href="/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}&show=completion" class="completion-button primary-button">
                        <i class="fas fa-check"></i> Concluir
                    </a>
                    <button id="redo-exercises-button" class="completion-button secondary-button">
                        <i class="fas fa-sync-alt"></i> Refazer Exercícios
                    </button>
                </div>
            </div>
        `;
        
        feedbackAreaEl.classList.add('hidden');
        
        // Adiciona o listener para o novo botão "Refazer"
        document.getElementById('redo-exercises-button').addEventListener('click', () => {
             // Resetar e recomeçar
             currentQuestionIndex = 0;
             score = 0;
             questions = shuffleArray(questions);
             loadQuestion(currentQuestionIndex);
        });
    }

    // --- Iniciar ---
    startQuiz();
});