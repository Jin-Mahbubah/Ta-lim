document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos ---
    const exerciseContentEl = document.querySelector('.exercise-content'); 
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

    // --- Iniciar ---
    async function startQuiz() {
        const urlParams = new URLSearchParams(window.location.search);
        lessonId = urlParams.get('lesson_id');
        chapterId = urlParams.get('chapter_id');
        
        if (!lessonId || !chapterId) {
            questionTitleEl.textContent = "Erro: IDs de lição ou capítulo em falta.";
            return;
        }
        
        // Link de voltar para a lição
        backButton.href = `/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}`;

        try {
            const response = await fetch(`/api/exercises?lesson_id=${lessonId}`);
            if (!response.ok) throw new Error('Falha ao carregar exercícios.');
            
            questions = await response.json();
            
            // Filtra
            questions = questions.filter(q => q.type === 'multiple_choice' && q.options);

            if (questions.length === 0) {
                questionTitleEl.textContent = "Nenhum exercício encontrado.";
                optionsContainerEl.innerHTML = '';
                return;
            }

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

        // Imagem
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

        // Progresso
        const progressPercentage = ((questionIndex + 1) / questions.length) * 100; // Corrigido para +1
        progressBar.style.width = `${progressPercentage}%`;

        // Opções
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
    
    // --- Próxima Pergunta ---
    function handleNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion(currentQuestionIndex);
        } else {
            endQuiz();
        }
    }

    // --- Selecionar Resposta ---
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
            const correctOption = optionsContainerEl.children[correctOptionIndex];
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
        nextButton.textContent = (currentQuestionIndex === questions.length - 1) ? 'Ver Resultados' : 'Continuar'; // Muda texto do último botão
        nextButton.addEventListener('click', handleNextQuestion);
        feedbackAreaEl.appendChild(nextButton);
        feedbackAreaEl.classList.remove('hidden');
    }

    // --- Fim do Quiz ---
    function endQuiz() {
        progressBar.style.width = `100%`;
        imageContainerEl.classList.add('hidden');
        questionTitleEl.textContent = `Exercícios Concluídos!`;
        // CORRIGIDO: Link de retorno com &show=completion
        optionsContainerEl.innerHTML = `<div class="completion-box"><span class="completion-icon">🏆</span><h3>Resultado Final</h3><p>Você acertou ${score} de ${questions.length} perguntas.</p> <a href="/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}&show=completion" class="back-button-link">Voltar à Lição</a></div>`;
        feedbackAreaEl.classList.add('hidden');
    }

    startQuiz();
});