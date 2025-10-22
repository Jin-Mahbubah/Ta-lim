document.addEventListener('DOMContentLoaded', async () => {
    const lessonsListEl = document.getElementById('lessons-list');
    const chapterTitleEl = document.getElementById('chapter-title');
    const backButton = document.getElementById('back-to-chapters');

    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('chapter_id');

    if (!chapterId) {
        chapterTitleEl.textContent = 'Erro de Capítulo';
        lessonsListEl.innerHTML = '<p>ID do capítulo não encontrado na URL.</p>';
        return;
    }
    
    // ALTERAÇÃO: Garantir que o botão voltar tem caminho absoluto
    backButton.href = '/chapters.html'; 

    try {
        // Busca as lições e os capítulos em paralelo
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
            chapterTitleEl.textContent = `${currentChapter.chapter_number} - ${currentChapter.title}`; // Mostra número e título
        } else {
            chapterTitleEl.textContent = 'Capítulo Desconhecido';
        }

        // Limpa a mensagem "Carregando..." do título da lista de lições
        const lessonsTitle = lessonsListEl.querySelector('.lessons-title'); // Seleciona pelo H2 original
        lessonsListEl.innerHTML = ''; // Limpa tudo
        if(lessonsTitle) lessonsListEl.appendChild(lessonsTitle); // Readiciona o H2

        if (lessons.length === 0) {
            lessonsListEl.insertAdjacentHTML('beforeend', '<p>Nenhuma lição encontrada para este capítulo.</p>');
        } else {
            lessons.forEach(lesson => {
                const lessonItem = document.createElement('a'); // Usa <a> para ser clicável
                lessonItem.className = 'chapter-item'; // Reutiliza o estilo dos cartões
                // ALTERAÇÃO: Link agora usa caminho absoluto "/"
                lessonItem.href = `/lesson.html?lesson_id=${lesson.id}&chapter_id=${chapterId}`; 
                lessonItem.innerHTML = `<span>${lesson.lesson_number} - ${lesson.title}</span><i class="fas fa-chevron-right"></i>`;
                
                lessonsListEl.appendChild(lessonItem);
            });
        }

    } catch (error) {
        console.error('Erro ao carregar a página de lições:', error);
        if (lessonsListEl) { // Verifica se lessonsListEl existe antes de modificar
             lessonsListEl.innerHTML += '<p>Não foi possível carregar as lições.</p>';
        }
       if (chapterTitleEl) {
            chapterTitleEl.textContent = 'Erro de Carregamento';
       }
    }
});