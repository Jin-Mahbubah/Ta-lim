document.addEventListener('DOMContentLoaded', async () => {
    const chaptersList = document.getElementById('chapters-list');

    try {
        const response = await fetch('/api/chapters');
        const chapters = await response.json();
        chaptersList.innerHTML = '<h2 class="chapters-title">Capítulos</h2>';

        if (chapters.length === 0) {
            chaptersList.innerHTML += '<p>Nenhum capítulo encontrado.</p>';
            return;
        }

        chapters.forEach(chapter => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'chapter-item';
            chapterItem.textContent = `${chapter.chapter_number} - ${chapter.title}`;
            
            // Adiciona o evento de clique para navegar para a página de lições
            chapterItem.addEventListener('click', () => {
                window.location.href = `lessons.html?chapter_id=${chapter.id}`;
            });

            chaptersList.appendChild(chapterItem);
        });

    } catch (error) {
        console.error('Erro ao buscar capítulos:', error);
        chaptersList.innerHTML = '<p>Não foi possível carregar os capítulos.</p>';
    }
});