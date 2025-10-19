document.addEventListener('DOMContentLoaded', () => {
    const questionTitleEl = document.getElementById('question-title');
    const optionsContainerEl = document.getElementById('options-container');
    const feedbackAreaEl = document.getElementById('feedback-area');
    const feedbackTitleEl = document.getElementById('feedback-title');
    const nextQuestionButton = document.getElementById('next-question-button');
    const backButton = document.getElementById('back-to-lesson');
    const progressBar = document.querySelector('.progress-bar');

    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];

    async function startQuiz() {
        const urlParams = new URLSearchParams(window.location.search);
        const lessonId = urlParams.get('lesson_id');
        const chapterId = urlParams.get('chapter_id');

        backButton.href = `lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}`;

        if (!lessonId) {
            questionTitleEl.textContent = "Erro: ID da lição não encontrado.";
            return;
        }

        try {
            const response = await fetch(`/api/exercises?lesson_id=${lessonId}`);
            if (!response.ok) throw new Error('Falha ao carregar exercícios.');
            
            questions = await response.json();

            if (!questions || questions.length === 0) {
                questionTitleEl.textContent = "Nenhum exercício encontrado para esta lição.";
                optionsContainerEl.innerHTML = '';
                return;
            }

            loadQuestion(currentQuestionIndex);

        } catch (error) {
            console.error("Erro ao buscar exercícios:", error);
            questionTitleEl.textContent = "Não foi possível carregar os exercícios.";
        }
    }

    function loadQuestion(questionIndex) {
        optionsContainerEl.innerHTML = '';
        feedbackAreaEl.classList.add('hidden');
        optionsContainerEl.classList.remove('options-disabled');

        const question = questions[questionIndex];
        questionTitleEl.textContent = question.text;

        const progressPercentage = (questionIndex / questions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        // ✨ A CORREÇÃO ESTÁ AQUI ✨
        // Agora verificamos o tipo de pergunta antes de fazer qualquer coisa.
        if (question.type === 'multiple_choice') {
            // Verificamos também se as opções existem e não são nulas
            if (question.options && question.options.length > 0) {
                question.options.forEach((option, index) => {
                    const optionElement = document.createElement('div');
                    optionElement.className = 'option-item';
                    optionElement.textContent = option;
                    optionElement.addEventListener('click', () => selectAnswer(optionElement, index, question.correct_option_index));
                    optionsContainerEl.appendChild(optionElement);
                });
            }
        } else if (question.type === 'fill_in_blank') {
            // No futuro, podemos adicionar aqui a lógica para este tipo de pergunta.
            optionsContainerEl.innerHTML = "<p><i>(Tipo de pergunta 'Preencher o espaço' ainda não implementado.)</i></p>";
            // Esconde o botão de feedback para este tipo
            feedbackAreaEl.classList.remove('hidden');
            feedbackAreaEl.innerHTML = '<button id="next-question-button">Continuar</button>';
            document.getElementById('next-question-button').addEventListener('click', handleNextQuestion);
        } else {
            optionsContainerEl.innerHTML = "<p><i>Tipo de pergunta não reconhecido.</i></p>";
        }
    }
    
    // Função para tratar o clique no botão "Continuar"
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

        if (isCorrect) {
            selectedElement.classList.add('correct');
            feedbackTitleEl.textContent = "Correto!";
            feedbackTitleEl.className = 'correct-feedback';
            feedbackAreaEl.className = 'correct-feedback';
            score++;
        } else {
            selectedElement.classList.add('incorrect');
            // Mostra qual era a correta
            if (optionsContainerEl.children[correctOptionIndex]) {
                 optionsContainerEl.children[correctOptionIndex].classList.add('correct');
            }
            feedbackTitleEl.textContent = "Incorreto!";
            feedbackTitleEl.className = 'incorrect-feedback';
            feedbackAreaEl.className = 'incorrect-feedback';
        }
        feedbackAreaEl.classList.remove('hidden');
        // Adiciona o botão continuar no feedback
        feedbackAreaEl.innerHTML += '<button id="next-question-button">Continuar</button>';
        document.getElementById('next-question-button').addEventListener('click', handleNextQuestion);
    }

    // Função para terminar o quiz
    function endQuiz() {
        progressBar.style.width = `100%`;
        questionTitleEl.textContent = `Quiz Completo!`;
        optionsContainerEl.innerHTML = `<p style="text-align: center; font-size: 1.2rem;">Você acertou ${score} de ${questions.length} perguntas.</p>`;
        feedbackAreaEl.classList.add('hidden');
    }

    startQuiz();
});