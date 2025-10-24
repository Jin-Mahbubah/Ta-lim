document.addEventListener('DOMContentLoaded', async () => {
    // --- Elementos da Interface ---
    const lessonTitleEl = document.getElementById('lesson-title');
    const lessonContentArea = document.getElementById('lesson-content-area'); 
    const lessonContentEl = document.getElementById('lesson-content'); 
    const startExercisesButton = document.getElementById('start-exercises-button');
    const backButton = document.getElementById('back-to-lessons');
    const lessonNavEl = document.querySelector('.lesson-navigation');
    const prevBtn = document.getElementById('prev-step-button');
    const nextBtn = document.getElementById('next-step-button');
    const progressIndicator = document.getElementById('progress-indicator');

    // --- Variáveis de Estado ---
    let lessonSteps = [];
    let currentStepIndex = 0;
    let currentCorrectIndex = null; // Para guardar a resposta correta dos passos interativos
    let interactiveAnswered = false; // Flag para saber se a pergunta interativa foi respondida

    // --- Obter IDs da URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('lesson_id');
    const chapterId = urlParams.get('chapter_id');

    // --- Configuração Inicial ---
    if (chapterId) {
        backButton.href = `/lessons.html?chapter_id=${chapterId}`;
    }
    if (!lessonId) {
        lessonTitleEl.textContent = 'Erro: ID da lição não encontrado.';
        return;
    }

    // --- Função Principal para Renderizar o Passo ---
    function renderStep(stepIndex) {
        if (!lessonSteps || stepIndex < 0 || stepIndex >= lessonSteps.length) return;
        
        const stepData = lessonSteps[stepIndex];
        lessonContentEl.innerHTML = ''; 
        interactiveAnswered = false; // Resetar flag
        currentCorrectIndex = stepData.correct_option_index; // Guardar índice correto, se houver

        let htmlContent = '';
        const hasImage = stepData.image_url ? `<img src="${stepData.image_url}" alt="Ilustração do passo" class="lesson-image">` : '';
        const translateButtonHtml = `<button class="translate-button-icon" title="Mostrar/Ocultar Tradução"><i class="fas fa-language"></i></button>`;

        lessonContentEl.className = stepData.content_type; // Adiciona classe para estilização específica do tipo

        switch (stepData.content_type) {
            case 'intro_box':
            case 'grammar_box':
                htmlContent = marked.parse(stepData.content_markdown);
                break;
            
            case 'vocabulary':
                const [vocabArabic, vocabPortuguese] = stepData.content_markdown.split('|').map(s => s.trim());
                htmlContent = `
                    ${hasImage}
                    <div class="lesson-text">
                        <div class="dialogue-line speaker-1 interactive-line" style="align-self: center; max-width: 100%;">
                            <p class="arabic-text">${vocabArabic} <i class="fas fa-volume-up audio-icon" data-audio="${stepData.audio_url || ''}"></i></p>
                            <p class="translation-text hidden">${vocabPortuguese}</p>
                        </div>
                    </div>
                    ${translateButtonHtml}`;
                break;
            
            case 'dialogue':
                const lines = stepData.content_markdown.split('---');
                let dialogueHtml = '';
                lines.forEach((line, i) => {
                    const [dialogueArabic, dialoguePortuguese] = line.split('|').map(s => s.trim());
                    const speakerClass = (i % 2 === 0) ? 'speaker-1' : 'speaker-2';
                    dialogueHtml += `
                        <div class="dialogue-line ${speakerClass} interactive-line">
                            <p class="arabic-text">${dialogueArabic} <i class="fas fa-volume-up audio-icon" data-audio="${stepData.audio_url || ''}"></i></p>
                            <p class="translation-text hidden">${dialoguePortuguese}</p>
                        </div>`;
                });
                htmlContent = `
                    ${hasImage}
                    <div class="lesson-text">${dialogueHtml}</div>
                    ${translateButtonHtml}`;
                break;

            // --- NOVOS CASOS PARA PASSOS INTERATIVOS ---
            case 'interactive_yes_no':
                htmlContent = `
                    ${hasImage}
                    <p class="question-text">${stepData.content_markdown.split('|')[0].trim()}</p> 
                    <div class="interactive-options yes-no-options">
                        <button class="interactive-option" data-index="0">نعم</button>
                        <button class="interactive-option" data-index="1">لا</button>
                    </div>`;
                 currentCorrectIndex = parseInt(stepData.options); // A resposta (0 ou 1) estava no options, vamos usar correct_option_index agora
                 currentCorrectIndex = stepData.correct_option_index; // Correção: Usar a coluna certa
                break;

            case 'interactive_multiple_choice':
                let optionsArray = [];
                try {
                    optionsArray = JSON.parse(stepData.options);
                } catch(e) { console.error("Erro parsing opções MC:", e); }
                
                let mcOptionsHtml = '';
                optionsArray.forEach((option, index) => {
                    mcOptionsHtml += `<button class="interactive-option mc-option" data-index="${index}">${option}</button>`;
                });

                htmlContent = `
                    ${hasImage}
                    <p class="question-text">${stepData.content_markdown.split('|')[0].trim()}</p>
                    <div class="interactive-options mc-options">${mcOptionsHtml}</div>`;
                break;
            // ---------------------------------------------
                
            default:
                 htmlContent = `<p>Tipo de conteúdo desconhecido: ${stepData.content_type}</p>`;
        }
        
        lessonContentEl.innerHTML = htmlContent; 
        updateNavControls(stepIndex); 
    }

    // --- Função para Atualizar Controles de Navegação ---
    function updateNavControls(index) {
        progressIndicator.textContent = `Passo ${index + 1} de ${lessonSteps.length}`;
        nextBtn.textContent = (index === lessonSteps.length - 1) ? 'Concluir Lição' : 'Continuar';
        prevBtn.style.display = (index === 0) ? 'none' : 'inline-block'; 

        // Desabilitar 'Continuar' para passos interativos até que sejam respondidos
        const currentStep = lessonSteps[index];
        const isInteractive = ['interactive_yes_no', 'interactive_multiple_choice'].includes(currentStep.content_type);
        nextBtn.disabled = isInteractive && !interactiveAnswered;
        nextBtn.style.opacity = nextBtn.disabled ? 0.5 : 1; 
    }

    // --- Função para Carregar a Lição ---
    async function startLesson() {
        // ... (código igual ao anterior para buscar dados) ...
         if (!lessonId) { /* ... */ return; }
        backButton.href = `/lessons.html?chapter_id=${chapterId}`; 
        try {
            const [infoRes, stepsRes] = await Promise.all([
                fetch(`/api/lesson/${lessonId}`),
                fetch(`/api/lesson-steps/${lessonId}`)
            ]);
            if (!infoRes.ok || !stepsRes.ok) throw new Error(`Falha ao buscar dados: ${infoRes.statusText} ${stepsRes.statusText}`);
            const lessonInfo = await infoRes.json();
            lessonSteps = await stepsRes.json();
            lessonTitleEl.textContent = lessonInfo.title || 'Título da Lição'; 
            if (lessonSteps && lessonSteps.length > 0) {
                lessonNavEl.classList.remove('hidden');
                renderStep(0); 
            } else { /* ... */ }
        } catch (error) { /* ... */ }
    }

    // --- Event Listener para a Área de Conteúdo (Atualizado) ---
    lessonContentEl.addEventListener('click', (event) => {
        const translateButton = event.target.closest('.translate-button-icon');
        const interactiveLine = event.target.closest('.interactive-line'); // Para vocabulário e diálogo
        const interactiveOption = event.target.closest('.interactive-option'); // Para botões Sim/Não e MC
        const audioIcon = event.target.closest('.audio-icon');

        // --- Lógica de Tradução ---
        if (translateButton) {
            const translations = lessonContentEl.querySelectorAll('.translation-text');
            const isActive = translateButton.classList.toggle('active'); 
            translations.forEach(el => el.classList.toggle('hidden', !isActive)); 
        }
        if (interactiveLine) {
            const translationEl = interactiveLine.querySelector('.translation-text');
            if (translationEl) { 
                translationEl.classList.toggle('hidden'); 
            }
        }

        // --- Lógica para Respostas Interativas ---
        if (interactiveOption && !interactiveAnswered) {
            interactiveAnswered = true; // Marca como respondido
            const selectedIndex = parseInt(interactiveOption.dataset.index);
            const isCorrect = selectedIndex === currentCorrectIndex;

            // Desabilitar todos os botões/opções deste passo
            lessonContentEl.querySelectorAll('.interactive-option').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = 0.7; // Esmaecer os não selecionados
            });

            // Aplicar feedback visual
            interactiveOption.style.opacity = 1; // Destacar o selecionado
            if (isCorrect) {
                interactiveOption.classList.add('correct');
            } else {
                interactiveOption.classList.add('incorrect');
                // Encontrar e destacar o correto (se houver)
                const correctOption = lessonContentEl.querySelector(`.interactive-option[data-index="${currentCorrectIndex}"]`);
                if (correctOption) {
                    correctOption.classList.add('correct');
                    correctOption.style.opacity = 1; 
                }
            }
            
            // Habilitar o botão Continuar após um pequeno delay para o feedback ser visto
            setTimeout(() => {
                nextBtn.disabled = false;
                nextBtn.style.opacity = 1;
            }, 500); // Meio segundo de delay
        }

        // --- Lógica do Áudio ---
        if (audioIcon) {
            const audioUrl = audioIcon.dataset.audio;
            if (audioUrl) {
                console.log("Tocar áudio:", audioUrl); 
                // const audio = new Audio(audioUrl);
                // audio.play().catch(e => console.error("Erro ao tocar áudio:", e)); 
            } else {
                console.log("Áudio não disponível.");
            }
        }
    });

    // --- Event Listeners para Navegação e Exercícios ---
    // (nextBtn, prevBtn, startExercisesButton - código igual ao anterior)
    nextBtn.addEventListener('click', () => {
        if (currentStepIndex < lessonSteps.length - 1) {
            currentStepIndex++;
            renderStep(currentStepIndex);
        } else {
            lessonContentArea.innerHTML = `<div class="completion-box"><span class="completion-icon">🎉</span><h3>Lição Concluída!</h3><p>Excelente trabalho!</p></div>`;
            lessonNavEl.classList.add('hidden');
            startExercisesButton.classList.remove('hidden');
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            renderStep(currentStepIndex);
        }
    });

     startExercisesButton.addEventListener('click', () => {
        if (lessonId && chapterId) {
            window.location.href = `/exercise.html?lesson_id=${lessonId}&chapter_id=${chapterId}`; 
        } else { /* ... */ }
    });

    // --- Inicia a Lição ---
    startLesson();
});