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

    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('lesson_id');
    const chapterId = urlParams.get('chapter_id');

    async function startQuiz() {
        backButton.href = `/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}`;
        if (!lessonId) { return; }

        try {
            const response = await fetch(`/api/exercises?lesson_id=${lessonId}`);
            questions = await response.json();
            if (!questions || questions.length === 0) {
                questionTitleEl.textContent = "Nenhum exercício encontrado.";
                return;
            }
            loadQuestion(currentQuestionIndex);
        } catch (error) {
            console.error("Erro ao buscar exercícios:", error);
        }
    }

    function loadQuestion(index) {
        feedbackAreaEl.classList.add('hidden');
        optionsContainerEl.innerHTML = '';
        optionsContainerEl.style.pointerEvents = 'auto';

        const question = questions[index];
        questionTitleEl.textContent = question.text;

        progressBar.style.width = `${(index / questions.length) * 100}%`;

        if (question.type === 'multiple_choice' && question.options) {
            question.options.forEach((option, optionIndex) => {
                const optionEl = document.createElement('div');
                optionEl.className = 'option-item';
                optionEl.textContent = option;
                optionEl.onclick = () => selectAnswer(optionEl, optionIndex, question.correct_option_index);
                optionsContainerEl.appendChild(optionEl);
            });
        }
    }

    function selectAnswer(selectedEl, selectedIndex, correctIndex) {
        optionsContainerEl.style.pointerEvents = 'none';
        const isCorrect = selectedIndex === correctIndex;

        if (isCorrect) {
            selectedEl.classList.add('correct');
            feedbackTitleEl.textContent = "Correto!";
            feedbackAreaEl.className = 'correct-feedback';
            score++;
        } else {
            selectedEl.classList.add('incorrect');
            optionsContainerEl.children[correctIndex]?.classList.add('correct');
            feedbackTitleEl.textContent = "Incorreto!";
            feedbackAreaEl.className = 'incorrect-feedback';
        }
        feedbackAreaEl.classList.remove('hidden');
    }

    function endQuiz() {
        progressBar.style.width = `100%`;
        document.getElementById('question-area').innerHTML = `
            <h2>🎉 Quiz Completo!</h2>
            <p style="text-align: center; font-size: 1.2rem; margin-top: 20px;">
                Você acertou ${score} de ${questions.length} perguntas.
            </p>
        `;
        feedbackAreaEl.classList.add('hidden');
    }

    nextQuestionButton.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion(currentQuestionIndex);
        } else {
            endQuiz();
        }
    });

    startQuiz();
});