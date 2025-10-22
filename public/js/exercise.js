document.addEventListener('DOMContentLoaded', () => {
    const questionTitleEl = document.getElementById('question-title');
    const optionsContainerEl = document.getElementById('options-container');
    const feedbackAreaEl = document.getElementById('feedback-area');
    const feedbackTitleEl = document.getElementById('feedback-title');
    // REMOVIDO: const feedbackTextEl = document.getElementById('feedback-text'); // Não usado
    const nextQuestionButton = document.getElementById('next-question-button'); // Já está no feedback, obteremos depois
    const backButton = document.getElementById('back-to-lesson');
    const progressBar = document.querySelector('.progress-bar');

    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let lessonId = null; // Guardar o lessonId para navegação
    let chapterId = null; // Guardar o chapterId para navegação

    async function startQuiz() {
        const urlParams = new URLSearchParams(window.location.search);
        lessonId = urlParams.get('lesson_id');
        chapterId = urlParams.get('chapter_id');

        // ALTERAÇÃO: Usar caminhos absolutos
        backButton.href = `/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}`;

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

            // Filtra apenas os exercícios do tipo multiple_choice por agora
            questions = questions.filter(q => q.type === 'multiple_choice');

             if (!questions || questions.length === 0) {
                questionTitleEl.textContent = "Nenhum exercício de múltipla escolha encontrado.";
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
        // Limpezas
        optionsContainerEl.innerHTML = '';
        feedbackAreaEl.classList.add('hidden');
        optionsContainerEl.classList.remove('options-disabled'); // Reativa as opções

        const question = questions[questionIndex];
        questionTitleEl.innerHTML = question.text; // Usar innerHTML para interpretar `<code>` se houver

        // Atualiza a barra de progresso
        const progressPercentage = (questionIndex / questions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
        let optionsArray = [];
        if (typeof question.options === 'string') {
            try {
                optionsArray = JSON.parse(question.options); // Converte a string JSON num array
            } catch (e) {
                console.error("Erro ao fazer parse das opções JSON:", e);
                optionsContainerEl.innerHTML = "<p><i>Erro no formato das opções.</i></p>";
                return; // Não continuar se as opções estiverem mal formatadas
            }
        } else if (Array.isArray(question.options)) {
             optionsArray = question.options; // Se já for array, usa diretamente
        }
        // ------------------------------------

        if (question.type === 'multiple_choice' && optionsArray.length > 0) {
            optionsArray.forEach((optionText, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option-item';
                optionElement.textContent = optionText; // Usa o texto da opção do array
                optionElement.addEventListener('click', () => selectAnswer(optionElement, index, question.correct_option_index));
                optionsContainerEl.appendChild(optionElement);
            });
        } 
        // Remover a lógica de fill_in_blank por enquanto, já que filtramos as questões
        /* else if (question.type === 'fill_in_blank') {
            optionsContainerEl.innerHTML = "<p><i>(Tipo 'Preencher o espaço' ainda não implementado.)</i></p>";
            // Configurar botão Continuar para este tipo se necessário
        } */
        else {
             optionsContainerEl.innerHTML = "<p><i>Tipo de pergunta não suportado ou sem opções.</i></p>";
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

    // Função chamada quando uma opção é selecionada
    function selectAnswer(selectedElement, selectedOptionIndex, correctOptionIndex) {
        optionsContainerEl.classList.add('options-disabled'); // Desativa cliques futuros nas opções
        const isCorrect = selectedOptionIndex === correctOptionIndex;

        // Limpa a área de feedback antes de adicionar novo conteúdo
        feedbackAreaEl.innerHTML = ''; 

        const feedbackTitle = document.createElement('h3');
        feedbackTitle.id = 'feedback-title'; // Reatribui ID se necessário
        
        if (isCorrect) {
            selectedElement.classList.add('correct');
            feedbackTitle.textContent = "Correto!";
            feedbackTitle.className = 'correct-feedback'; // Classe para cor verde
            feedbackAreaEl.className = 'feedback-area correct-feedback'; // Classe para fundo verde
            score++;
        } else {
            selectedElement.classList.add('incorrect');
            // Mostra qual era a correta
            if (optionsContainerEl.children[correctOptionIndex]) {
                 optionsContainerEl.children[correctOptionIndex].classList.add('correct');
            }
            feedbackTitle.textContent = "Incorreto!";
            feedbackTitle.className = 'incorrect-feedback'; // Classe para cor vermelha
            feedbackAreaEl.className = 'feedback-area incorrect-feedback'; // Classe para fundo vermelho
        }

        feedbackAreaEl.appendChild(feedbackTitle); // Adiciona o título H3

        // Adiciona o botão continuar
        const nextButton = document.createElement('button');
        nextButton.id = 'next-question-button';
        nextButton.textContent = 'Continuar';
        nextButton.addEventListener('click', handleNextQuestion);
        feedbackAreaEl.appendChild(nextButton);

        feedbackAreaEl.classList.remove('hidden'); // Mostra a área de feedback
    }

    // Função para terminar o quiz
    function endQuiz() {
        progressBar.style.width = `100%`;
        questionTitleEl.textContent = `Exercícios Concluídos!`;
        optionsContainerEl.innerHTML = `<div class="completion-box"><span class="completion-icon">🏆</span><h3>Resultado Final</h3><p>Você acertou ${score} de ${questions.length} perguntas.</p> <a href="/lesson.html?lesson_id=${lessonId}&chapter_id=${chapterId}" class="back-button-link">Voltar à Lição</a></div>`; // Mensagem final com botão voltar
        feedbackAreaEl.classList.add('hidden'); // Esconde área de feedback
        // Adicionar botão para voltar à lição ou dashboard se necessário
    }

    // Inicia o quiz quando a página carrega
    startQuiz();
});