document.addEventListener('DOMContentLoaded', async () => {
    const lessonTitleEl = document.getElementById('lesson-title');
    const lessonContentEl = document.getElementById('lesson-content');
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

    if (chapterId) {
        backButton.href = `/lessons.html?chapter_id=${chapterId}`;
    }
    if (!lessonId) {
        lessonTitleEl.textContent = 'Erro: ID da lição não encontrado.';
        return;
    }

    function renderStep(stepIndex) {
        const stepData = lessonSteps[stepIndex];
        lessonContentEl.innerHTML = ''; 

        let htmlContent = '';
        const hasImage = stepData.image_url ? `<img src="${stepData.image_url}" alt="Ilustração da lição" class="lesson-image">` : '';

        if (stepData.content_type === 'intro_box' || stepData.content_type === 'grammar_box') {
            const boxClass = stepData.content_type === 'intro_box' ? 'intro-box' : 'grammar-box';
            htmlContent = `<div class="${boxClass}">${marked.parse(stepData.content_markdown)}</div>`;
        
        } else if (stepData.content_type === 'vocabulary') {
            const [arabic, portuguese] = stepData.content_markdown.split('|').map(s => s.trim());
            htmlContent = `
                ${hasImage}
                <div class="lesson-text">
                    <div class="dialogue-line speaker-1" style="align-self: center; max-width: 100%;">
                        <p class="arabic-text">${arabic} <i class="fas fa-volume-up audio-icon"></i></p>
                        <p class="translation-text hidden">${portuguese}</p>
                    </div>
                </div>
                <button class="translate-button">Mostrar Tradução</button>
            `;

        } else if (stepData.content_type === 'dialogue') {
            const lines = stepData.content_markdown.split('---');
            let dialogueHtml = '';
            lines.forEach((line, index) => {
                const [arabic, portuguese] = line.split('|').map(s => s.trim());
                const speakerClass = (index % 2 === 0) ? 'speaker-1' : 'speaker-2'; // Alterna entre falante 1 e 2
                dialogueHtml += `
                    <div class="dialogue-line ${speakerClass}">
                        <p class="arabic-text">${arabic} <i class="fas fa-volume-up audio-icon"></i></p>
                        <p class="translation-text hidden">${portuguese}</p>
                    </div>
                `;
            });
            htmlContent = `
                ${hasImage}
                <div class="lesson-text">${dialogueHtml}</div>
                <button class="translate-button">Mostrar/Ocultar Todas</button>
            `;
        }
        
        lessonContentEl.innerHTML = htmlContent;
        updateNavControls(stepIndex);
    }

    function updateNavControls(stepIndex) {
        // ... (código igual ao anterior)
        progressIndicator.textContent = `Passo ${stepIndex + 1} de ${lessonSteps.length}`;
        prevBtn.style.visibility = (stepIndex === 0) ? 'hidden' : 'visible';
        nextBtn.textContent = (stepIndex === lessonSteps.length - 1) ? 'Concluir Lição' : 'Continuar';
    }

    lessonContentEl.addEventListener('click', (event) => {
        // Lógica para o botão "Mostrar/Ocultar Todas"
        if (event.target.classList.contains('translate-button')) {
            const lessonText = event.target.parentElement.querySelector('.lesson-text');
            const translations = lessonText.querySelectorAll('.translation-text');
            const isCurrentlyHidden = translations[0].classList.contains('hidden');

            translations.forEach(translationEl => {
                translationEl.classList.toggle('hidden', !isCurrentlyHidden);
            });
        }
        
        // Lógica para o clique em cada balão de diálogo individual
        const dialogueLine = event.target.closest('.dialogue-line');
        if (dialogueLine) {
            const translationEl = dialogueLine.querySelector('.translation-text');
            if (translationEl) {
                translationEl.classList.toggle('hidden');
            }
        }
    });

    // ... (O resto do código, com nextBtn, prevBtn e startLesson, continua igual)
    nextBtn.addEventListener('click', () => {
        if (currentStepIndex < lessonSteps.length - 1) {
            currentStepIndex++;
            renderStep(currentStepIndex);
        } else {
            lessonContentEl.classList.add('hidden');
            lessonNavEl.classList.add('hidden');
            startExercisesButton.classList.remove('hidden');
            lessonTitleEl.textContent = 'Lição Concluída!';
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
        }
    });

    async function startLesson() {
        try {
            const lessonInfoResponse = await fetch(`/api/lesson/${lessonId}`);
            const lessonInfo = await lessonInfoResponse.json();
            lessonTitleEl.textContent = lessonInfo.title;

            const stepsResponse = await fetch(`/api/lesson-steps/${lessonId}`);
            lessonSteps = await stepsResponse.json();

            if (lessonSteps && lessonSteps.length > 0) {
                lessonNavEl.classList.remove('hidden');
                renderStep(currentStepIndex);
            } else {
                lessonNavEl.classList.add('hidden');
                startExercisesButton.classList.remove('hidden');
                lessonContentEl.innerHTML = "<p>Nenhum conteúdo encontrado para esta lição.</p>";
            }
        } catch (error) {
            console.error('Erro ao carregar a lição:', error);
            lessonTitleEl.textContent = 'Erro ao carregar';
            lessonContentEl.innerHTML = '<p>Não foi possível carregar o conteúdo da lição. Tente novamente mais tarde.</p>';
        }
    }

    startLesson();
});