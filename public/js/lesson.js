document.addEventListener('DOMContentLoaded', async () => {
    // --- Elementos da Interface ---
    const lessonTitleEl = document.getElementById('lesson-title');
    const lessonContentArea = document.getElementById('lesson-content-area'); 
    const lessonContentEl = document.getElementById('lesson-content'); 
    const startExercisesButton = document.getElementById('start-exercises-button'); // Este é o botão antigo
    const backButton = document.getElementById('back-to-lessons');
    const lessonNavEl = document.querySelector('.lesson-navigation');
    const prevBtn = document.getElementById('prev-step-button'); 
    const nextBtn = document.getElementById('next-step-button');
    const progressIndicator = document.getElementById('progress-indicator');

    // --- Variáveis de Estado ---
    let lessonSteps = [];
    let currentStepIndex = 0;
    let currentCorrectIndex = null; 
    let interactiveAnswered = false; 
    let currentAudio = null; 
    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('lesson_id');
    const chapterId = urlParams.get('chapter_id');
    const showCompletion = urlParams.get('show') === 'completion'; 

    // --- Configuração Inicial ---
    if (!lessonId || !chapterId) { 
        if(lessonTitleEl) lessonTitleEl.textContent = 'Erro: IDs inválidos.'; 
        if(lessonContentEl) lessonContentEl.innerHTML = '<p>Link inválido.</p>';
        return; 
    }
    if (backButton) { backButton.href = `/lessons.html?chapter_id=${chapterId}`; }

    // --- Funções Auxiliares ---
    async function showCompletionScreen() {
        if(lessonTitleEl) lessonTitleEl.textContent = ''; 

        // Buscar informações da próxima lição
        let nextLessonId = null;
        try {
            const lessonsResponse = await fetch(`/api/lessons?chapter_id=${chapterId}`);
            if (lessonsResponse.ok) {
                const lessonsInChapter = await lessonsResponse.json();
                const currentLessonIndexInArray = lessonsInChapter.findIndex(l => l.id == lessonId);
                
                if (currentLessonIndexInArray !== -1 && currentLessonIndexInArray < lessonsInChapter.length - 1) {
                    nextLessonId = lessonsInChapter[currentLessonIndexInArray + 1].id;
                }
            }
        } catch (error) {
            console.error("Erro ao buscar próxima lição:", error);
        }
        
        // [HTML CORRIGIDO] Adicionado o botão "Fazer/Refazer Exercícios" dentro das actions
        lessonContentArea.innerHTML = `
            <div class="completion-box">
                <span class="completion-icon">🎉</span>
                <h3>Lição Concluída!</h3>
                <p>Excelente trabalho! Você completou todos os passos da lição.</p>
                <div class="completion-actions">
                    ${nextLessonId ? `
                        <a href="/lesson.html?lesson_id=${nextLessonId}&chapter_id=${chapterId}" class="completion-button primary-button">
                            <i class="fas fa-arrow-right"></i> Próxima Lição
                        </a>
                    ` : `
                         <a href="/lessons.html?chapter_id=${chapterId}" class="completion-button primary-button">
                             <i class="fas fa-book"></i> Voltar às Lições
                         </a>
                    `}
                    
                    <button id="redo-lesson-exercises" class="completion-button accent-button">
                        <i class="fas fa-pencil-alt"></i> Fazer/Refazer Exercícios
                    </button>
                    
                    <a href="/chapters.html" class="completion-button secondary-button">
                        <i class="fas fa-layer-group"></i> Voltar aos Capítulos
                    </a>
                </div>
            </div>
        `;
        
        // [CORRIGIDO] Esconde o botão de navegação E o botão antigo
        if(lessonNavEl) lessonNavEl.classList.add('hidden'); 
        if(startExercisesButton) {
            startExercisesButton.classList.add('hidden'); // Esconde o botão antigo
        }

        // [NOVO] Adiciona o listener para o novo botão
        document.getElementById('redo-lesson-exercises').addEventListener('click', () => {
            window.location.href = `/exercise.html?lesson_id=${lessonId}&chapter_id=${chapterId}`;
        });
    }

    function renderStep(stepIndex) {
        if (!lessonSteps || stepIndex < 0 || stepIndex >= lessonSteps.length || !lessonContentEl) return;
        if (currentAudio) { currentAudio.pause(); currentAudio = null; }

        const stepData = lessonSteps[stepIndex];
        lessonContentEl.innerHTML = ''; 
        lessonContentEl.style.backgroundImage = ''; 
        interactiveAnswered = false; 
        
        currentCorrectIndex = stepData.correct_option_index; 

        let htmlContent = '';
        const translateButtonHtml = stepData.step_type === 'dialogue'
            ? `<button class="translate-button-icon" title="Mostrar/Ocultar Traduções"><i class="fas fa-language"></i></button>` 
            : '';
        const audioIconHtml = `<i class="fas fa-volume-up audio-icon" data-audio="${stepData.audio_url || ''}" title="Ouvir pronúncia"></i>`; 

        lessonContentEl.className = stepData.step_type; 

        try {
            switch (stepData.step_type) {
                case 'intro_box':
                case 'grammar_box':
                    htmlContent = marked.parse(stepData.content_markdown || '');
                    break;
                
                case 'vocabulary':
                    const [vocabArabic, vocabPortuguese] = (stepData.content_markdown || '|').split('|').map(s => s.trim());
                    const vocabImage = stepData.image_url ? `<img src="${stepData.image_url}" alt="Ilustração" class="lesson-image">` : ''; 
                    
                    htmlContent = `${vocabImage}<div class="lesson-step-text"><div class="vocabulary-line interactive-line"><p class="arabic-text">${vocabArabic} ${audioIconHtml}</p><p class="translation-text hidden">${vocabPortuguese}</p></div></div>`; 
                    break;
                
                case 'dialogue':
                    const lines = (stepData.content_markdown || '').split('---');
                    let dialogueHtml = '';

                    const speaker1_icon = '<i class="fas fa-user-tie"></i>'; // Ex: Professor
                    const speaker2_icon = '<i class="fas fa-user-graduate"></i>'; // Ex: Aluno

                    lines.forEach((line, i) => { 
                        const [dialogueArabic, dialoguePortuguese] = (line || '|').split('|').map(s => s.trim()); 
                        
                        let speakerClass = '';
                        let speakerIcon = '';

                        if (i % 2 === 0) {
                            speakerClass = 'speaker-1';
                            speakerIcon = speaker1_icon;
                        } else {
                            speakerClass = 'speaker-2';
                            speakerIcon = speaker2_icon;
                        }

                        dialogueHtml += `
                            <div class="dialogue-line-wrapper ${speakerClass}">
                                <div class="speaker-avatar">${speakerIcon}</div>
                                <div class="dialogue-line interactive-line">
                                    <p class="arabic-text">${dialogueArabic} ${audioIconHtml}</p>
                                    <p class="translation-text hidden">${dialoguePortuguese}</p>
                                </div>
                            </div>
                        `; 
                    });
                    
                    htmlContent = `<div class="lesson-step-text">${dialogueHtml}</div>${translateButtonHtml}`; 
                    
                    setTimeout(() => {
                         const dialogueTextContainer = lessonContentEl.querySelector('.lesson-step-text');
                         if (dialogueTextContainer && stepData.image_url) {
                            dialogueTextContainer.style.backgroundImage = `url('${stepData.image_url}')`;
                            dialogueTextContainer.classList.add('has-background-image'); 
                         }
                    }, 0); 
                    break;

                case 'interactive_yes_no':
                     const ynQuestionText = (stepData.content_markdown || '|').split('|')[0].trim();
                     const ynImage = stepData.image_url ? `<img src="${stepData.image_url}" alt="Pergunta" class="lesson-image">` : '';
                     htmlContent = `${ynImage}<p class="question-text">${ynQuestionText} ${audioIconHtml}</p><div class="interactive-options yes-no-options"><button class="interactive-option" data-index="0">نَعَمْ</button><button class="interactive-option" data-index="1">لَا</button></div>`;
                    break;

                case 'interactive_multiple_choice':
                    const mcQuestionText = (stepData.content_markdown || '|').split('|')[0].trim();
                     const mcImage = stepData.image_url ? `<img src="${stepData.image_url}" alt="Pergunta" class="lesson-image">` : '';
                    let mcOptionsArray = [];
                    try { mcOptionsArray = JSON.parse(stepData.options || '[]'); } catch(e) { console.error("Erro parsing opções MC:", e); }
                    let mcOptionsHtml = '';
                    mcOptionsArray.forEach((option, index) => { mcOptionsHtml += `<button class="interactive-option mc-option" data-index="${index}">${option}</button>`; });
                    htmlContent = `${mcImage}<p class="question-text">${mcQuestionText} ${audioIconHtml}</p><div class="interactive-options mc-options">${mcOptionsHtml}</div>`;
                    break;
                
                case 'interactive_word_bank': {
                    const wbQuestionText = (stepData.content_markdown || '____').replace('____', '<span class="blank-space"></span>');
                    const wbImage = stepData.image_url ? `<img src="${stepData.image_url}" alt="Pergunta" class="lesson-image">` : '';
                    
                    let optionsData = [];
                    try { 
                        const parsedOptions = JSON.parse(stepData.options || '[]');
                        optionsData = parsedOptions.map((optionText, index) => ({
                            text: optionText,
                            originalIndex: index 
                        }));
                    } catch(e) { console.error("Erro parsing opções WB:", e); }

                    for (let i = optionsData.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [optionsData[i], optionsData[j]] = [optionsData[j], optionsData[i]];
                    }
                    
                    let wbOptionsHtml = '';
                    optionsData.forEach(option => {
                        wbOptionsHtml += `<button class="interactive-option word-bank-chip" data-index="${option.originalIndex}">${option.text}</button>`;
                    });

                    htmlContent = `${wbImage}<p class="word-bank-question">${wbQuestionText} ${audioIconHtml}</p><div class="interactive-options word-bank-options">${wbOptionsHtml}</div>`;
                    break;
                }
                    
                default:
                     htmlContent = `<p>Tipo de conteúdo desconhecido: ${stepData.step_type}</p>`;
            }
            lessonContentEl.innerHTML = htmlContent; 
        } catch (renderError) {
             console.error("Erro renderStep:", renderError);
             lessonContentEl.innerHTML = "<p>Erro ao exibir passo.</p>";
        }
        updateNavControls(stepIndex); 
    }

    function updateNavControls(index) {
         if (!lessonSteps || index < 0 || index >= lessonSteps.length || !progressIndicator || !nextBtn || !prevBtn) return; 
         progressIndicator.textContent = `Passo ${index + 1} de ${lessonSteps.length}`;
         nextBtn.textContent = (index === lessonSteps.length - 1) ? 'Concluir Lição' : 'Continuar';
         prevBtn.style.display = (index === 0) ? 'none' : 'inline-block'; 
         const currentStep = lessonSteps[index];
         const isInteractive = ['interactive_yes_no', 'interactive_multiple_choice', 'interactive_word_bank'].includes(currentStep.step_type);
         
         nextBtn.disabled = isInteractive && !interactiveAnswered; 
         nextBtn.style.opacity = nextBtn.disabled ? 0.5 : 1; 
    }

    async function startLesson() {
        if (showCompletion) {
            showCompletionScreen(); 
            return; 
        }
        
        try {
            const [chapterRes, stepsRes] = await Promise.all([
                fetch(`/api/chapter/${chapterId}`), 
                fetch(`/api/lesson-steps/${lessonId}`)
            ]);
            if (!chapterRes.ok) { const errorText = await chapterRes.text(); throw new Error(`Falha Cap: ${chapterRes.status} ${errorText}`); }
            if (!stepsRes.ok) { const errorText = await stepsRes.text(); throw new Error(`Falha Steps: ${stepsRes.status} ${errorText}`); }
            
            await chapterRes.json(); 
            lessonSteps = await stepsRes.json();
            lessonSteps = Array.isArray(lessonSteps) ? lessonSteps : []; 

            if(lessonTitleEl) lessonTitleEl.textContent = ''; // Título vazio
            
            if (lessonSteps.length > 0) {
                if(lessonNavEl) lessonNavEl.classList.remove('hidden');
                renderStep(0); 
            } else { 
                 if(lessonNavEl) lessonNavEl.classList.add('hidden');
                 if(startExercisesButton) startExercisesButton.classList.remove('hidden');
                 if(lessonContentEl) lessonContentEl.innerHTML = "<p>Nenhum conteúdo encontrado.</p>";
            }
        } catch (error) { 
            console.error('Erro startLesson:', error); 
             if(lessonTitleEl) lessonTitleEl.textContent = 'Erro';
             if(lessonContentEl) lessonContentEl.innerHTML = `<p>Erro ao carregar.<br><small>${error.message || ''}</small></p>`; 
        }
    }

    // --- Event Listeners ---
     lessonContentEl.addEventListener('click', (event) => {
        const translateButton = event.target.closest('.translate-button-icon');
        const interactiveLine = event.target.closest('.interactive-line'); 
        const interactiveOption = event.target.closest('.interactive-option'); 
        const audioIcon = event.target.closest('.audio-icon');

        if (translateButton) {
             const lessonText = translateButton.closest('#lesson-content').querySelector('.lesson-step-text'); 
             if (lessonText) {
                 const translations = lessonText.querySelectorAll('.translation-text');
                 const isActive = translateButton.classList.toggle('active'); 
                 translations.forEach(el => el.classList.toggle('hidden', !isActive)); 
             }
        } 
        else if (interactiveLine && !audioIcon && !interactiveOption) { 
            const translationEl = interactiveLine.querySelector('.translation-text');
            if (translationEl) { translationEl.classList.toggle('hidden'); }
        }

        if (interactiveOption && !interactiveAnswered) { 
             interactiveAnswered = true; 
             const selectedIndex = parseInt(interactiveOption.dataset.index);
             const isCorrect = selectedIndex === currentCorrectIndex;
             
             lessonContentEl.querySelectorAll('.interactive-option').forEach(btn => {
                 btn.disabled = true;
                 if (btn.dataset.index != currentCorrectIndex && btn !== interactiveOption) { btn.style.opacity = 0.6; } else { btn.style.opacity = 1; }
             });
             
             interactiveOption.style.opacity = 1; 
             if (isCorrect) { 
                 interactiveOption.classList.add('correct');
                 const blankSpace = lessonContentEl.querySelector('.blank-space');
                 if (blankSpace) {
                     blankSpace.textContent = interactiveOption.textContent;
                 }
             } 
             else {
                 interactiveOption.classList.add('incorrect');
                 const correctOption = lessonContentEl.querySelector(`.interactive-option[data-index="${currentCorrectIndex}"]`);
                 if (correctOption) { correctOption.classList.add('correct'); correctOption.style.opacity = 1; }
             }
             setTimeout(() => { if(nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = 1; } }, 600); 
        }

        if (audioIcon) {
            const audioUrl = audioIcon.dataset.audio;
            if (audioUrl && audioUrl !== 'NULL' && audioUrl.trim() !== '') {
                if (currentAudio) {
                    currentAudio.pause();
                    document.querySelectorAll('.audio-icon.playing').forEach(icon => icon.classList.remove('playing'));
                }
                currentAudio = new Audio(audioUrl);
                currentAudio.play()
                    .then(() => { audioIcon.classList.add('playing'); })
                    .catch(e => { console.error("Erro ao tocar áudio:", e); currentAudio = null; });
                currentAudio.onended = () => { audioIcon.classList.remove('playing'); currentAudio = null; };
            } else {
                audioIcon.classList.add('no-audio');
                setTimeout(() => audioIcon.classList.remove('no-audio'), 500);
            }
        }
    });

     if (nextBtn) {
         nextBtn.addEventListener('click', () => {
             if (nextBtn.disabled) return; 
             if (currentStepIndex < lessonSteps.length - 1) {
                 currentStepIndex++;
                 renderStep(currentStepIndex);
             } else {
                 showCompletionScreen(); 
             }
          });
     }

     if (prevBtn) {
         prevBtn.addEventListener('click', () => { 
             if (currentStepIndex > 0) {
                 currentStepIndex--;
                 renderStep(currentStepIndex);
             }
          });
     }

     if (startExercisesButton) {
         // [CORRIGIDO] Este botão só deve funcionar se NÃO estivermos no ecrã de conclusão
         startExercisesButton.addEventListener('click', () => { 
            if (showCompletion) return; // Não faz nada se o ecrã de conclusão estiver visível
             if (lessonId && chapterId) {
                 window.location.href = `/exercise.html?lesson_id=${lessonId}&chapter_id=${chapterId}`; 
             } else { console.error("IDs em falta para exercícios."); }
          });
     }

    // --- Iniciar ---
    startLesson();
});