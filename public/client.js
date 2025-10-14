document.addEventListener('DOMContentLoaded', () => {
    const homeView = document.getElementById('home-view');
    const quizContainer = document.getElementById('quiz-container');
    const startButton = document.getElementById('start-button');
    const questionTextElement = document.getElementById('question-text');
    const fillInBlankContainer = document.getElementById('fill-in-blank-container');
    const userAnswerElement = document.getElementById('user-answer');
    const submitButton = document.getElementById('submit-button');
    const multipleChoiceContainer = document.getElementById('multiple-choice-container');
    const constructSentenceContainer = document.getElementById('construct-sentence-container');
    const sentenceArea = document.getElementById('sentence-area');
    const wordBank = document.getElementById('word-bank');
    const checkSentenceButton = document.getElementById('check-sentence-button');
    const resetSentenceButton = document.getElementById('reset-sentence-button');
    const feedbackElement = document.getElementById('feedback');

    let currentQuestion = null;

    startButton.addEventListener('click', () => {
        homeView.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        getNewQuestion();
    });

    async function getNewQuestion() {
        try {
            const response = await fetch('/api/question');
            if (!response.ok) throw new Error('Falha na resposta da rede');
            currentQuestion = await response.json();
            displayQuestion();
        } catch (error) {
            questionTextElement.textContent = 'Erro ao carregar a pergunta. Tente novamente mais tarde.';
            console.error('Erro:', error);
        }
    }

    function displayQuestion() {
        questionTextElement.textContent = currentQuestion.text;
        feedbackElement.textContent = '';
        feedbackElement.className = '';
        userAnswerElement.value = '';
        
        fillInBlankContainer.style.display = 'none';
        multipleChoiceContainer.style.display = 'none';
        constructSentenceContainer.style.display = 'none';
        
        multipleChoiceContainer.innerHTML = '';
        sentenceArea.innerHTML = '';
        wordBank.innerHTML = '';

        if (currentQuestion.type === 'fill_in_blank') {
            fillInBlankContainer.style.display = 'block';
        } else if (currentQuestion.type === 'multiple_choice') {
            multipleChoiceContainer.style.display = 'block';
            currentQuestion.options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option;
                button.addEventListener('click', () => checkAnswer(option));
                multipleChoiceContainer.appendChild(button);
            });
        } else if (currentQuestion.type === 'construct_sentence') {
            constructSentenceContainer.style.display = 'block';
            currentQuestion.words.forEach(word => {
                const button = document.createElement('button');
                button.textContent = word;
                button.addEventListener('click', () => {
                    const wordSpan = document.createElement('span');
                    wordSpan.textContent = word; // Correção: remover espaço extra aqui
                    sentenceArea.appendChild(wordSpan);
                    button.disabled = true;
                });
                wordBank.appendChild(button);
            });
        }
    }
    
    function checkAnswer(userAnswer) {
        if (!currentQuestion || userAnswer === null) return;
        const cleanedCorrectAnswer = currentQuestion.answer.trim().toLowerCase();
        const cleanedUserAnswer = userAnswer.trim().toLowerCase();

        if (cleanedUserAnswer === cleanedCorrectAnswer) {
            feedbackElement.textContent = 'Correto!';
            feedbackElement.className = 'correct';
            setTimeout(getNewQuestion, 1500);
        } else {
            feedbackElement.textContent = 'Incorreto, tente novamente.';
            feedbackElement.className = 'incorrect';
            if(currentQuestion.type === 'fill_in_blank') {
                userAnswerElement.value = '';
            }
        }
    }

    submitButton.addEventListener('click', () => checkAnswer(userAnswerElement.value));
    
    checkSentenceButton.addEventListener('click', () => {
        const words = Array.from(sentenceArea.children).map(span => span.textContent);
        const constructedSentence = words.join(' '); // Adicionar espaços ao juntar
        checkAnswer(constructedSentence);
    });

    resetSentenceButton.addEventListener('click', () => {
        sentenceArea.innerHTML = '';
        Array.from(wordBank.children).forEach(button => button.disabled = false);
        feedbackElement.textContent = '';
        feedbackElement.className = '';
    });
});