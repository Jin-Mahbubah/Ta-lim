document.addEventListener('DOMContentLoaded', async () => {
    const lessonsList = document.getElementById('lessons-list');
    const chapterTitleEl = document.getElementById('chapter-title');
    const backButton = document.getElementById('back-to-chapters');

    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('chapter_id');

    if (!chapterId) {
        chapterTitleEl.textContent = 'Erro';
        lessonsList.innerHTML = '<p>ID do capítulo não encontrado.</p>';
        return;
    }
    
    // Define o link do botão "voltar" para a página de capítulos
    backButton.href = 'chapters.html';

    // Busca o título do capítulo para mostrar no cabeçalho
    try {
        const chaptersResponse = await fetch('/api/chapters');
        const chapters = await chaptersResponse.json();
        const currentChapter = chapters.find(c => c.id == chapterId);
        if (currentChapter) {
            chapterTitleEl.textContent = currentChapter.title;
        } else {
            chapterTitleEl.textContent = `Capítulo Desconhecido`;
        }
    } catch (error) {
        console.error('Erro ao buscar título do capítulo:', error);
    }

    // Busca a lista de lições do capítulo
    try {
        const response = await fetch(`/api/lessons?chapter_id=${chapterId}`);
        const lessons = await response.json();
        const titleElement = lessonsList.querySelector('.lessons-title');
        lessonsList.innerHTML = ''; // Limpa "a carregar"
        if (titleElement) lessonsList.appendChild(titleElement);

        if (lessons.length === 0) {
            lessonsList.insertAdjacentHTML('beforeend', '<p>Nenhuma lição encontrada para este capítulo.</p>');
            return;
        }

        lessons.forEach(lesson => {
            const lessonItem = document.createElement('div');
            lessonItem.className = 'chapter-item'; // Reutiliza o estilo
            lessonItem.innerHTML = `<span>${lesson.lesson_number} - ${lesson.title}</span><i class="fas fa-chevron-right"></i>`;
            
            lessonItem.addEventListener('click', () => {
                window.location.href = `lesson.html?lesson_id=${lesson.id}&chapter_id=${chapterId}`;
            });

            lessonsList.appendChild(lessonItem);
        });

    } catch (error) {
        console.error('Erro ao buscar lições:', error);
        lessonsList.innerHTML += '<p>Não foi possível carregar as lições.</p>';
    }
});