document.addEventListener('DOMContentLoaded', () => {
    const exerciseContentEl = document.querySelector('.exercise-content'); // Container principal
    const questionTitleEl = document.getElementById('question-title');
    const optionsContainerEl = document.getElementById('options-container');
    const feedbackAreaEl = document.getElementById('feedback-area');
    const backButton = document.getElementById('back-to-lesson');
    const progressBar = document.querySelector('.progress-bar');
    const imageContainerEl = document.getElementById('image-container'); // NOVO: Div para a imagem

    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let lessonId = null;
    let chapterId = null;

    async function startQuiz() {
        const urlParams = new URLSearchParams(window.location.search);
        lessonId = urlParams.get('lesson_id');
        chapterId = urlParams.get('chapter_id');
        backButton.href = `/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}`;

        if (!lessonId) { /* ... (tratamento de erro igual) ... */ return; }

        try {
            const response = await fetch(`/api/exercises?lesson_id=${lessonId}`);
            if (!response.ok) throw new Error('Falha ao carregar exercícios.');
            questions = await response.json();

            // Filtrar apenas multiple_choice por agora
            questions = questions.filter(q => q.type === 'multiple_choice');
            if (!questions || questions.length === 0) { /* ... (tratamento de erro igual) ... */ return; }

            loadQuestion(currentQuestionIndex);

        } catch (error) { /* ... (tratamento de erro igual) ... */ }
    }

    function loadQuestion(questionIndex) {
        optionsContainerEl.innerHTML = '';
        imageContainerEl.innerHTML = ''; // Limpa a imagem anterior
        feedbackAreaEl.classList.add('hidden');
        optionsContainerEl.classList.remove('options-disabled');

        const question = questions[questionIndex];
        questionTitleEl.innerHTML = question.text;

        // --- MOSTRAR IMAGEM ---
        if (question.image_url) {
            const img = document.createElement('img');
            img.src = question.image_url;
            img.alt = "Imagem do exercício";
            img.className = 'exercise-image'; // Classe para estilização
            imageContainerEl.appendChild(img); // Adiciona a imagem ao seu container
            imageContainerEl.classList.remove('hidden');
        } else {
            imageContainerEl.classList.add('hidden'); // Esconde o container se não houver imagem
        }
        // ----------------------

        const progressPercentage = (questionIndex / questions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        let optionsArray = [];
        if (typeof question.options === 'string') {
             try { optionsArray = JSON.parse(question.options); } catch (e) { /* ... */ return; }
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
        } else { /* ... */ }
    }
    
    // ... (As funções handleNextQuestion, selectAnswer, endQuiz continuam iguais à versão anterior) ...
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
            if (optionsContainerEl.children[correctOptionIndex]) {
                 optionsContainerEl.children[correctOptionIndex].classList.add('correct');
            }
            feedbackTitle.textContent = "Incorreto!";
            feedbackTitle.className = 'incorrect-feedback';
            feedbackAreaEl.className = 'feedback-area incorrect-feedback';
        }

        feedbackAreaEl.appendChild(feedbackTitle);
        const nextButton = document.createElement('button');
        nextButton.id = 'next-question-button';
        nextButton.textContent = 'Continuar';
        nextButton.addEventListener('click', handleNextQuestion);
        feedbackAreaEl.appendChild(nextButton);
        feedbackAreaEl.classList.remove('hidden');
    }

    function endQuiz() {
        progressBar.style.width = `100%`;
        imageContainerEl.classList.add('hidden'); // Esconde container da imagem no final
        questionTitleEl.textContent = `Exercícios Concluídos!`;
        optionsContainerEl.innerHTML = `<div class="completion-box"><span class="completion-icon">🏆</span><h3>Resultado Final</h3><p>Você acertou ${score} de ${questions.length} perguntas.</p> <a href="/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}" class="back-button-link">Voltar à Lição</a></div>`;
        feedbackAreaEl.classList.add('hidden');
    }

    startQuiz();
});