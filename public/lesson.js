document.addEventListener('DOMContentLoaded', async () => {
    const lessonTitleEl = document.getElementById('lesson-title');
    const lessonContentEl = document.getElementById('lesson-content');
    const startExercisesButton = document.getElementById('start-exercises-button');
    const backButton = document.getElementById('back-to-lessons');

    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('lesson_id');
    const chapterId = urlParams.get('chapter_id');

    if (chapterId) {
        backButton.href = `lessons.html?chapter_id=${chapterId}`;
    } else {
        backButton.href = 'chapters.html';
    }

    if (!lessonId) {
        lessonTitleEl.textContent = 'Erro';
        lessonContentEl.textContent = 'ID da lição não encontrado.';
        return;
    }

    try {
        const response = await fetch(`/api/lesson/${lessonId}`);
        if (!response.ok) throw new Error('Falha ao buscar a lição');
        
        const lesson = await response.json();

        lessonTitleEl.textContent = lesson.title;

        // Usa a biblioteca "marked" para converter o texto em HTML formatado
        if (lesson.content) {
            lessonContentEl.innerHTML = marked.parse(lesson.content);
        }
        
        startExercisesButton.classList.remove('hidden');
        
        startExercisesButton.addEventListener('click', () => {
            window.location.href = `exercise.html?lesson_id=${lessonId}&chapter_id=${chapterId}`;
        });

    } catch (error) {
        console.error('Erro ao buscar o conteúdo da lição:', error);
        lessonTitleEl.textContent = 'Erro';
        lessonContentEl.textContent = 'Não foi possível carregar o conteúdo da lição.';
    }
});