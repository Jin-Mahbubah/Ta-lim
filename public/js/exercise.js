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

    // --- Normalização de texto árabe ---
    const tashkilRegex = /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;
    const tatweelRegex = /\u0640/g;
    const arabicSpaceRegex = /[\u200C\u200D\u200E\u200F]/g;
    
    function normalizeArabic(text) {
        if (!text) return '';
        return text
            .replace(tashkilRegex, '')
            .replace(tatweelRegex, '')
            .replace(arabicSpaceRegex, '')
            .replace(/أ|إ|آ|ا|ﻯ|ﺍ/g, 'ا')
            .replace(/ب|ﺏ/g, 'ب')
            .replace(/ت|ﺕ/g, 'ت')
            .replace(/ث|ﺙ/g, 'ث')
            .replace(/ج|ﺝ/g, 'ج')
            .replace(/ح|ﺡ/g, 'ح')
            .replace(/خ|ﺥ/g, 'خ')
            .replace(/د|ﺩ/g, 'د')
            .replace(/ذ|ﺫ/g, 'ذ')
            .replace(/ر|ﺭ/g, 'ر')
            .replace(/ز|ﺯ/g, 'ز')
            .replace(/س|ﺱ/g, 'س')
            .replace(/ش|ﺵ/g, 'ش')
            .replace(/ص|ﺹ/g, 'ص')
            .replace(/ض|ﺽ/g, 'ض')
            .replace(/ط|ﻁ/g, 'ط')
            .replace(/ظ|ﻅ/g, 'ظ')
            .replace(/ع|ﻉ/g, 'ع')
            .replace(/غ|ﻍ/g, 'غ')
            .replace(/ف|ﻑ/g, 'ف')
            .replace(/ق|ﻕ/g, 'ق')
            .replace(/ك|ک|ﻙ/g, 'ك')
            .replace(/ل|ﻝ/g, 'ل')
            .replace(/م|ﻡ/g, 'م')
            .replace(/ن|ﻥ/g, 'ن')
            .replace(/ه|ہ|ﻩ/g, 'ه')
            .replace(/ة/g, 'ه')
            .replace(/و|ؤ|ﻭ/g, 'و')
            .replace(/ي|ی|ئ|ى|ﻱ/g, 'ي')
            .trim();
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async function startQuiz() {
        const urlParams = new URLSearchParams(window.location.search);
        lessonId = urlParams.get('lesson_id');
        chapterId = urlParams.get('chapter_id');
        
        if (!lessonId || !chapterId) {
            questionTitleEl.textContent = "Erro: IDs em falta.";
            return;
        }
        
        backButton.href = `/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}`;

        try {
            // Adiciona um parâmetro aleatório para evitar cache
            const response = await fetch(`/api/exercises?lesson_id=${lessonId}&v=${Math.random()}`);
            if (!response.ok) throw new Error('Falha ao carregar exercícios.');
            
            questions = await response.json();
            // Filtra apenas tipos suportados
            questions = questions.filter(q => 
                (q.type === 'multiple_choice' || q.type === 'letter_scramble') && 
                q.options
            );

            if (questions.length === 0) {
                questionTitleEl.textContent = "Nenhum exercício encontrado.";
                optionsContainerEl.innerHTML = '';
                return;
            }

            // IMPORTANTE: Embaralhar as perguntas no início
            shuffleArray(questions);
            loadQuestion(currentQuestionIndex);

        } catch (error) {
            console.error("Erro:", error);
            questionTitleEl.textContent = "Erro ao carregar.";
        }
    }

    function loadQuestion(questionIndex) {
        if (questionIndex < 0 || questionIndex >= questions.length) return;

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
            img.alt = "Imagem";
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

    function loadMultipleChoice(question) {
        // Se começar com letra árabe ou sublinhado, assume RTL
        const isRTL = /[\u0600-\u06FF]/.test(question.text.charAt(0)) || question.text.startsWith('____');
        questionTitleEl.dir = isRTL ? 'rtl' : 'ltr';
        questionTitleEl.innerHTML = question.text; 

        let optionsArray = [];
        try {
            if (typeof question.options === 'string') {
                optionsArray = JSON.parse(question.options);
            } else if (Array.isArray(question.options)) {
                optionsArray = question.options;
            }
        } catch (e) { console.error("Erro parse opções:", e); }

        if (!Array.isArray(optionsArray)) return;

        optionsArray.forEach((optionText, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option-item';
            optionElement.textContent = optionText;
            optionElement.addEventListener('click', () => selectAnswer(optionElement, index, question.correct_option_index));
            optionsContainerEl.appendChild(optionElement);
        });
    }

    function loadLetterScramble(question) {
        const fullAnswer = question.text; 
        const normalizedAnswer = normalizeArabic(fullAnswer); 
        correctAnswerLetters = normalizedAnswer.split('');
        const answerLength = correctAnswerLetters.length;
        
        // Força LTR no container, mas RTL na palavra árabe
        questionTitleEl.dir = 'ltr'; 
        questionTitleEl.innerHTML = `Forme a palavra: <strong dir="rtl">${fullAnswer}</strong>`;

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
        } catch (e) {}
        
        if (Array.isArray(letterOptions)) {
            shuffleArray(letterOptions).forEach((letter, index) => {
                const chip = document.createElement('button');
                chip.className = 'letter-bank-chip';
                chip.textContent = letter;
                chip.dataset.id = index; 
                chip.addEventListener('click', () => moveLetterToSlot(chip));
                bankContainer.appendChild(chip);
                letterBank.push(chip); 
            });
        }

        optionsContainerEl.appendChild(slotsContainer);
        optionsContainerEl.appendChild(bankContainer);
    }

    function moveLetterToSlot(chip) {
        if (chip.classList.contains('disabled')) return;
        const firstEmptySlot = letterSlots.find(slot => slot.classList.contains('empty'));
        if (firstEmptySlot) {
            firstEmptySlot.textContent = chip.textContent;
            firstEmptySlot.classList.remove('empty');
            firstEmptySlot.dataset.chipId = chip.dataset.id;
            chip.classList.add('disabled'); 

            const allFilled = letterSlots.every(slot => !slot.classList.contains('empty'));
            if (allFilled) showLetterScrambleCheckButton();
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
        
        for (let i = 0; i < correctAnswerLetters.length; i++) {
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
            } else { allCorrect = false; }
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

    function handleNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion(currentQuestionIndex);
        } else {
            endQuiz();
        }
    }

    function endQuiz() {
        progressBar.style.width = `100%`;
        imageContainerEl.classList.add('hidden');
        questionTitleEl.textContent = `Exercícios Concluídos!`;
        questionTitleEl.dir = 'ltr'; 
        
        let completionIcon = '🏆';
        let completionClass = 'completion-good';
        let completionTitle = 'Bom Trabalho!';
        const percentage = (questions.length > 0) ? (score / questions.length) * 100 : 0;
        
        if (percentage === 100) {
            completionIcon = '🏅'; completionClass = 'completion-perfect'; completionTitle = 'Perfeito!';
        } else if (percentage < 50) {
            completionIcon = '💪'; completionClass = 'completion-needs-work'; completionTitle = 'Continue Tentando!';
        }
        
        optionsContainerEl.innerHTML = `
            <div class="completion-box ${completionClass}">
                <span class="completion-icon">${completionIcon}</span>
                <h3>${completionTitle}</h3>
                <p>Você acertou ${score} de ${questions.length} perguntas.</p> 
                <div class="completion-actions">
                    <a href="/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}&show=completion" class="completion-button primary-button">
                        <i class="fas fa-check"></i> Ir para Conclusão
                    </a>
                    <button id="redo-exercises-button" class="completion-button accent-button">
                        <i class="fas fa-sync-alt"></i> Refazer Exercícios
                    </button>
                    <a href="/chapters.html" class="completion-button secondary-button">
                        <i class="fas fa-layer-group"></i> Voltar aos Capítulos
                    </a>
                </div>
            </div>`;
        
        feedbackAreaEl.classList.add('hidden');
        document.getElementById('redo-exercises-button').addEventListener('click', () => {
             currentQuestionIndex = 0;
             score = 0;
             questions = shuffleArray(questions); // Embaralha de novo
             loadQuestion(currentQuestionIndex);
        });
    }
    startQuiz();
});