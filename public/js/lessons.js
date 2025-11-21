document.addEventListener('DOMContentLoaded', async () => {
    const lessonsListEl = document.getElementById('lessons-list');
    const chapterTitleEl = document.getElementById('chapter-title');
    const backButton = document.getElementById('back-to-chapters');

    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('chapter_id');

    if (!chapterId) {
        chapterTitleEl.textContent = 'Erro de Capítulo';
        lessonsListEl.innerHTML = '<p>ID do capítulo não encontrado.</p>';
        return;
    }
    
    // Garante que o botão voltar vai para a lista de capítulos
    backButton.href = '/chapters.html'; 

    try {
        const [lessonsResponse, chaptersResponse] = await Promise.all([
            fetch(`/api/lessons?chapter_id=${chapterId}`),
            fetch('/api/chapters') 
        ]);

        if (!lessonsResponse.ok) throw new Error('Falha ao carregar lições.');
        if (!chaptersResponse.ok) throw new Error('Falha ao carregar capítulos.');

        const lessons = await lessonsResponse.json();
        const allChapters = await chaptersResponse.json();
        
        const currentChapter = allChapters.find(c => c.id == chapterId);
        if (currentChapter) {
            chapterTitleEl.textContent = `${currentChapter.chapter_number} - ${currentChapter.title}`;
        }

        const lessonsTitle = lessonsListEl.querySelector('h2');
        lessonsListEl.innerHTML = '';
        if(lessonsTitle) lessonsListEl.appendChild(lessonsTitle);

        if (lessons.length === 0) {
            lessonsListEl.insertAdjacentHTML('beforeend', '<p>Nenhuma lição encontrada.</p>');
        } else {
            // Ordenar lições pelo número para garantir a ordem correta
            lessons.sort((a, b) => a.lesson_number - b.lesson_number);

            lessons.forEach(lesson => {
                const lessonItem = document.createElement('a');
                lessonItem.className = 'lesson-item'; 
                lessonItem.href = `/lesson.html?lesson_id=${lesson.id}&chapter_id=${chapterId}`;
                
                // [CORREÇÃO FINAL] Apenas o texto, sem ícone de seta
                lessonItem.innerHTML = `<span class="lesson-text">${lesson.lesson_number} - ${lesson.title}</span>`;
                
                lessonsListEl.appendChild(lessonItem);
            });
        }

    } catch (error) {
        console.error('Erro ao carregar lições:', error);
        lessonsListEl.innerHTML += '<p>Não foi possível carregar.</p>';
        chapterTitleEl.textContent = 'Erro';
    }
});