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
    let currentStep = 0;

    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('lesson_id');
    const chapterId = urlParams.get('chapter_id');

    if (chapterId) { backButton.href = `lessons.html?chapter_id=${chapterId}`; }
    if (!lessonId) { lessonTitleEl.textContent = 'Erro: ID da lição não encontrado.'; return; }

    startExercisesButton.addEventListener('click', () => {
        if (lessonId && chapterId) {
            window.location.href = `exercise.html?lesson_id=${lessonId}&chapter_id=${chapterId}`;
        }
    });

    function showStep(stepIndex) {
        lessonSteps.forEach((step, index) => step.classList.toggle('active', index === stepIndex));
        progressIndicator.textContent = `Passo ${stepIndex + 1} de ${lessonSteps.length}`;
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.textContent = (stepIndex === lessonSteps.length - 1) ? 'Concluir Lição' : 'Continuar';
    }

    nextBtn.addEventListener('click', () => {
        if (currentStep < lessonSteps.length - 1) {
            currentStep++;
            showStep(currentStep);
        } else {
            lessonNavEl.classList.add('hidden');
            lessonContentEl.classList.add('hidden');
            startExercisesButton.classList.remove('hidden');
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    });

    function speak(text) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'ar-SA'; u.rate = 0.8; window.speechSynthesis.speak(u); }
    const renderer = new marked.Renderer();
    const originalListItem = renderer.listitem.bind(renderer);
    renderer.listitem = (text) => {
        if (typeof text !== 'string') { return originalListItem(text); }
        const parts = text.split('|').map(p => p.trim());
        if (parts.length < 2) { return originalListItem(text); }
        const [arabic, translit, portuguese] = parts;
        let html = `<span class="arabic-word">${arabic}</span><i class="fas fa-volume-up audio-icon" data-text-to-speak="${arabic}"></i>`;
        if (translit) { html += `<span class="translit hidden">(${translit})</span><button class="toggle-translit">T</button>`; }
        if (portuguese) { html += ` - <span class="portuguese">${portuguese}</span>`; }
        return `<li>${html}</li>`;
    };
    marked.setOptions({ renderer });
    lessonContentEl.addEventListener('click', function(event) { if (event.target.classList.contains('audio-icon')) { speak(event.target.getAttribute('data-text-to-speak')); } if (event.target.classList.contains('toggle-translit')) { const t = event.target.previousElementSibling; if (t) t.classList.toggle('hidden'); } });

    try {
        const response = await fetch(`/api/lesson/${lessonId}`);
        const lesson = await response.json();
        lessonTitleEl.textContent = lesson.title;

        if (lesson.content) {
            const fullHtml = marked.parse(lesson.content);
            const stepsHtml = fullHtml.split('<hr>');
            lessonContentEl.innerHTML = '';
            stepsHtml.forEach(htmlFragment => { if (htmlFragment.trim() === '') return; const stepDiv = document.createElement('div'); stepDiv.className = 'lesson-step'; stepDiv.innerHTML = htmlFragment; lessonContentEl.appendChild(stepDiv); });
            lessonSteps = Array.from(lessonContentEl.children);
            
            if (lessonSteps.length > 0) {
                lessonNavEl.classList.remove('hidden');
                showStep(currentStep);
            } else {
                startExercisesButton.classList.remove('hidden');
            }
        } else {
            startExercisesButton.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Erro:', error);
        lessonTitleEl.textContent = 'Erro ao carregar';
    }
});