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

    // --- [NOVO] FUNÇÃO PARA BARALHAR (Shuffle) ---
    function shuffleArray(array) {
        // Algoritmo Fisher-Yates
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
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
            const response = await fetch(`/api/exercises?lesson_id=${lessonId}`);
            if (!response.ok) throw new Error('Falha ao carregar exercícios.');
            
            questions = await response.json();
            questions = questions.filter(q => q.type === 'multiple_choice' && q.options);

            if (questions.length === 0) {
                questionTitleEl.textContent = "Nenhum exercício encontrado.";
                optionsContainerEl.innerHTML = '';
                return;
            }

            // --- [NOVO] BARALHAR AS PERGUNTAS ---
            shuffleArray(questions);
            // ------------------------------------

            loadQuestion(currentQuestionIndex);

        } catch (error) {
            console.error("Erro ao buscar exercícios:", error);
            questionTitleEl.textContent = "Não foi possível carregar os exercícios.";
        }
    }

    // --- Carregar Pergunta ---
    function loadQuestion(questionIndex) {
        if (questionIndex < 0 || questionIndex >= questions.length) return;

        optionsContainerEl.innerHTML = '';
        imageContainerEl.innerHTML = ''; 
        feedbackAreaEl.classList.add('hidden');
        optionsContainerEl.classList.remove('options-disabled');

        const question = questions[questionIndex];
        questionTitleEl.innerHTML = question.text;

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

        let optionsArray = [];
        if (typeof question.options === 'string') {
             try { optionsArray = JSON.parse(question.options); } catch (e) { console.error("Erro parse JSON options:", e); }
        } else if (Array.isArray(question.options)) {
             optionsArray = question.options;
        }

        if (question.type === 'multiple_choice' && optionsArray.length > 0) {
            optionsArray.forEach((optionText, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option-item';
                optionElement.textContent = optionText;
                optionElement.addEventListener('click', () => selectAnswer(optionElement, index, question.correct_option_index));
                optionsContainerEl.appendChild(optionElement);
            });
        }
    }
    
    function handleNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion(currentQuestionIndex);
        } else {
            endQuiz();
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
            if (correctOption) {
                 correctOption.classList.add('correct');
            }
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

    function endQuiz() {
        progressBar.style.width = `100%`;
        imageContainerEl.classList.add('hidden');
        questionTitleEl.textContent = `Exercícios Concluídos!`;
        optionsContainerEl.innerHTML = `<div class="completion-box"><span class="completion-icon">🏆</span><h3>Resultado Final</h3><p>Você acertou ${score} de ${questions.length} perguntas.</p> <a href="/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}&show=completion" class="back-button-link">Voltar à Lição</a></div>`;
        feedbackAreaEl.classList.add('hidden');
    }

    startQuiz();
});