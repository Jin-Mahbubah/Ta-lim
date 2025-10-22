document.addEventListener('DOMContentLoaded', async () => {
    const lessonTitleEl = document.getElementById('lesson-title');
    const lessonContentArea = document.getElementById('lesson-content-area'); // Área que contém o conteúdo e o botão
    const lessonContentEl = document.getElementById('lesson-content'); // Onde o conteúdo do passo é renderizado
    const startExercisesButton = document.getElementById('start-exercises-button');
    const backButton = document.getElementById('back-to-lessons');
    const lessonNavEl = document.querySelector('.lesson-navigation');
    const prevBtn = document.getElementById('prev-step-button');
    const nextBtn = document.getElementById('next-step-button');
    const progressIndicator = document.getElementById('progress-indicator');

    let lessonSteps = [];
    let currentStepIndex = 0;
    
    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('lesson_id');
    const chapterId = urlParams.get('chapter_id');

    // Função para renderizar o passo (atualizada)
    function showStep(index) {
        if (!lessonSteps || index < 0 || index >= lessonSteps.length) {
            console.error("Índice de passo inválido:", index);
            return;
        }
        const stepData = lessonSteps[index];
        let htmlContent = '';
        const hasImage = stepData.image_url ? `<img src="${stepData.image_url}" alt="Ilustração da lição" class="lesson-image">` : '';
        // ALTERAÇÃO: Classe do botão corrigida para .translate-button-icon
        const translateButtonHtml = `<button class="translate-button-icon" title="Mostrar/Ocultar Tradução"><i class="fas fa-language"></i></button>`;

        switch (stepData.content_type) {
            case 'intro_box':
            case 'grammar_box':
                // Adiciona a classe diretamente ao contêiner principal para estilização
                lessonContentEl.className = stepData.content_type; 
                htmlContent = marked.parse(stepData.content_markdown);
                break;
            case 'vocabulary':
                lessonContentEl.className = 'vocabulary-step'; // Classe genérica para vocabulário
                const [vocabArabic, vocabPortuguese] = stepData.content_markdown.split('|').map(s => s.trim());
                htmlContent = `
                    ${hasImage}
                    <div class="lesson-text">
                        <div class="dialogue-line speaker-1" style="align-self: center; max-width: 100%;">
                            <p class="arabic-text">${vocabArabic} <i class="fas fa-volume-up audio-icon" data-audio="${stepData.audio_url || ''}"></i></p>
                            <p class="translation-text hidden">${vocabPortuguese}</p>
                        </div>
                    </div>
                    ${translateButtonHtml}`;
                break;
            case 'dialogue':
                lessonContentEl.className = 'dialogue-step'; // Classe genérica para diálogo
                const lines = stepData.content_markdown.split('---');
                let dialogueHtml = '';
                lines.forEach((line, i) => {
                    const [dialogueArabic, dialoguePortuguese] = line.split('|').map(s => s.trim());
                    const speakerClass = (i % 2 === 0) ? 'speaker-1' : 'speaker-2';
                    dialogueHtml += `
                        <div class="dialogue-line ${speakerClass}">
                            <p class="arabic-text">${dialogueArabic} <i class="fas fa-volume-up audio-icon" data-audio="${stepData.audio_url || ''}"></i></p>
                            <p class="translation-text hidden">${dialoguePortuguese}</p>
                        </div>`;
                });
                htmlContent = `
                    ${hasImage}
                    <div class="lesson-text">${dialogueHtml}</div>
                    ${translateButtonHtml}`;
                break;
            default:
                 lessonContentEl.className = ''; // Remove classes específicas
                 htmlContent = `<p>Tipo de conteúdo desconhecido: ${stepData.content_type}</p>`;
        }
        
        lessonContentEl.innerHTML = htmlContent; // Coloca o conteúdo dentro do div#lesson-content
        updateNavControls(index); // Atualiza os controles
    }

    // Função para atualizar os controles de navegação
    function updateNavControls(index) {
        progressIndicator.textContent = `Passo ${index + 1} de ${lessonSteps.length}`;
        nextBtn.textContent = (index === lessonSteps.length - 1) ? 'Concluir Lição' : 'Continuar';
        // ALTERAÇÃO: Usar display none/inline-block é mais robusto que visibility
        prevBtn.style.display = (index === 0) ? 'none' : 'inline-block'; 
    }

    // Função para carregar os dados da lição
    async function startLesson() {
        if (!lessonId) { 
             lessonTitleEl.textContent = 'Erro: Lição não encontrada.';
             return; 
        }
        // ALTERAÇÃO: Garantir caminho absoluto para o botão voltar
        backButton.href = `/lessons.html?chapter_id=${chapterId}`; 
        
        try {
            // Carrega informações da lição e passos em paralelo
            const [infoRes, stepsRes] = await Promise.all([
                fetch(`/api/lesson/${lessonId}`),
                fetch(`/api/lesson-steps/${lessonId}`)
            ]);

            if (!infoRes.ok) throw new Error(`Falha ao buscar info da lição: ${infoRes.statusText}`);
            if (!stepsRes.ok) throw new Error(`Falha ao buscar passos da lição: ${stepsRes.statusText}`);

            const lessonInfo = await infoRes.json();
            lessonSteps = await stepsRes.json();
            
            lessonTitleEl.textContent = lessonInfo.title || 'Título da Lição'; // Mostra título
            
            if (lessonSteps && lessonSteps.length > 0) {
                lessonNavEl.classList.remove('hidden'); // Mostra a navegação
                showStep(0); // Mostra o primeiro passo
            } else {
                // Caso não haja passos, informa o utilizador
                lessonNavEl.classList.add('hidden');
                startExercisesButton.classList.remove('hidden');
                lessonContentEl.innerHTML = "<p>Nenhum conteúdo encontrado para esta lição.</p>";
            }
        } catch (error) { 
            console.error('Erro ao carregar a lição:', error); 
            lessonTitleEl.textContent = 'Erro ao Carregar';
            lessonContentEl.innerHTML = '<p>Não foi possível carregar o conteúdo. Tente novamente.</p>';
        }
    }

    // Evento para o botão "Próximo / Concluir"
    nextBtn.addEventListener('click', () => {
        if (currentStepIndex < lessonSteps.length - 1) {
            currentStepIndex++;
            showStep(currentStepIndex);
        } else {
            // Fim da lição - Mostrar mensagem de conclusão
            lessonContentArea.innerHTML = `
                <div class="completion-box">
                    <span class="completion-icon">🎉</span>
                    <h3>Lição Concluída!</h3>
                    <p>Excelente trabalho!</p>
                </div>`;
            lessonNavEl.classList.add('hidden'); // Esconde navegação da lição
            startExercisesButton.classList.remove('hidden'); // Mostra botão de exercícios
        }
    });

    // Evento para o botão "Anterior"
    prevBtn.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            showStep(currentStepIndex);
        }
    });

    // Evento para cliques dentro da área de conteúdo (delegação)
    lessonContentArea.addEventListener('click', (event) => {
        const translateButton = event.target.closest('.translate-button-icon');
        const dialogueLine = event.target.closest('.dialogue-line');
        const audioIcon = event.target.closest('.audio-icon');

        // Lógica para o botão de tradução geral
        if (translateButton) {
            const translations = lessonContentArea.querySelectorAll('.translation-text');
            const isActive = translateButton.classList.toggle('active'); // Adiciona/remove 'active' e retorna true/false
            translations.forEach(el => el.classList.toggle('hidden', !isActive)); // Esconde se não estiver ativo
        }
        
        // Lógica para clique individual na linha/balão
        if (dialogueLine) {
            const translationEl = dialogueLine.querySelector('.translation-text');
            if (translationEl) { 
                translationEl.classList.toggle('hidden'); 
            }
        }

        // TODO: Lógica para o ícone de áudio
        if (audioIcon) {
            const audioUrl = audioIcon.dataset.audio;
            if (audioUrl) {
                console.log("Tocar áudio:", audioUrl); // Placeholder
                // const audio = new Audio(audioUrl);
                // audio.play();
            } else {
                console.log("Áudio não disponível para este item.");
            }
        }
    });
    
    // Evento para o botão "Iniciar Exercícios"
    startExercisesButton.addEventListener('click', () => {
        if (lessonId && chapterId) {
            // ALTERAÇÃO: Garantir caminho absoluto
            window.location.href = `/exercise.html?lesson_id=${lessonId}&chapter_id=${chapterId}`; 
        } else {
            console.error("IDs de lição ou capítulo em falta para iniciar exercícios.");
        }
    });
    
    // Inicia o carregamento da lição
    startLesson();
});