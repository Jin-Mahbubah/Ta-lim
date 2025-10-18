document.addEventListener('DOMContentLoaded', async () => {
    const lessonTitleEl = document.getElementById('lesson-title');
    const lessonContentEl = document.getElementById('lesson-content');
    const startExercisesButton = document.getElementById('start-exercises-button');
    const backButton = document.getElementById('back-to-lessons');

    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('lesson_id');
    const chapterId = urlParams.get('chapter_id');

    // Configura o botão "voltar" para ir para a página de lições do capítulo certo
    if (chapterId) {
        backButton.href = `lessons.html?chapter_id=${chapterId}`;
    } else {
        backButton.href = 'chapters.html'; // Fallback
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
        lessonContentEl.textContent = lesson.content;

        if (lesson.type === 'exercise') {
            lessonContentEl.classList.add('hidden');
            startExercisesButton.classList.remove('hidden');
            
            startExercisesButton.addEventListener('click', () => {
                alert(`Iniciar quiz para a lição ${lesson.id}`);
            });
        }

    } catch (error) {
        console.error('Erro ao buscar o conteúdo da lição:', error);
        lessonTitleEl.textContent = 'Erro';
        lessonContentEl.textContent = 'Não foi possível carregar o conteúdo da lição.';
    }
});