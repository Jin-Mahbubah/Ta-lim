document.addEventListener('DOMContentLoaded', async () => {
    const chaptersList = document.getElementById('chapters-list');
    if (!chaptersList) return;

    try {
        const response = await fetch('/api/chapters');
        if (!response.ok) throw new Error('Falha ao carregar capítulos');
        const chapters = await response.json();

        const titleElement = chaptersList.querySelector('.chapters-title');
        chaptersList.innerHTML = '';
        if (titleElement) chaptersList.appendChild(titleElement);

        if (chapters.length === 0) {
            chaptersList.insertAdjacentHTML('beforeend', '<p>Nenhum capítulo encontrado.</p>');
        } else {
            chapters.forEach(chapter => {
                const chapterItem = document.createElement('a');
                chapterItem.className = 'chapter-item';
                chapterItem.href = `/lessons.html?chapter_id=${chapter.id}`; 
                chapterItem.innerHTML = `<span>${chapter.chapter_number} - ${chapter.title}</span><i class="fas fa-chevron-right"></i>`;
                chaptersList.appendChild(chapterItem);
            });
        }
    } catch (error) {
        console.error('Erro ao buscar capítulos:', error);
        chaptersList.innerHTML += '<p>Não foi possível carregar os capítulos.</p>';
    }
});