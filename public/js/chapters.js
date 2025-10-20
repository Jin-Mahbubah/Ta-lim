document.addEventListener('DOMContentLoaded', async () => {
    // ALTERAÇÃO: A lógica de navegação foi removida daqui para usar o nav.js
    const chaptersList = document.getElementById('chapters-list');

    try {
        const response = await fetch('/api/chapters');
        if (!response.ok) throw new Error('Falha na resposta da rede');
        
        const chapters = await response.json();

        const titleElement = chaptersList.querySelector('.chapters-title');
        chaptersList.innerHTML = '';
        if (titleElement) chaptersList.appendChild(titleElement);

        if (chapters.length === 0) {
            chaptersList.insertAdjacentHTML('beforeend', '<p>Nenhum capítulo encontrado.</p>');
        } else {
            chapters.forEach(chapter => {
                const chapterItem = document.createElement('div');
                chapterItem.className = 'chapter-item';
                chapterItem.innerHTML = `<span>${chapter.chapter_number} - ${chapter.title}</span><i class="fas fa-chevron-right"></i>`;
                
                chapterItem.addEventListener('click', () => {
                    // Navega para a página de lições com o ID do capítulo
                    window.location.href = `lessons.html?chapter_id=${chapter.id}`;
                });
                chaptersList.appendChild(chapterItem);
            });
        }
    } catch (error) {
        console.error('Erro ao buscar capítulos:', error);
        chaptersList.innerHTML += '<p>Não foi possível carregar os capítulos.</p>';
    }
});