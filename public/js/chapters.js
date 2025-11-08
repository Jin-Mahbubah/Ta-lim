document.addEventListener('DOMContentLoaded', async () => {
    const chaptersList = document.getElementById('chapters-list');
    if (!chaptersList) return;

    try {
        const response = await fetch('/api/chapters');
        if (!response.ok) throw new Error('Falha ao carregar capítulos');
        const chapters = await response.json();

        const titleElement = chaptersList.querySelector('h2'); // Mudado para h2
        chaptersList.innerHTML = '';
        if (titleElement) chaptersList.appendChild(titleElement);

        if (chapters.length === 0) {
            chaptersList.insertAdjacentHTML('beforeend', '<p>Nenhum capítulo encontrado.</p>');
        } else {
            chapters.forEach(chapter => {
                const chapterItem = document.createElement('a'); 
                chapterItem.className = 'chapter-item';
                chapterItem.href = `/lessons.html?chapter_id=${chapter.id}`;
                
                // [CORREÇÃO] Adicionadas as classes que o style.css espera
                chapterItem.innerHTML = `
                    <span class="chapter-number">${chapter.chapter_number}</span>
                    <span class="chapter-title">${chapter.title}</span>
                    <i class="fas fa-chevron-right chapter-icon"></i>
                `;
                
                chaptersList.appendChild(chapterItem);
            });
        }
    } catch (error) {
        console.error('Erro ao buscar capítulos:', error);
        chaptersList.innerHTML += '<p>Não foi possível carregar os capítulos.</p>';
    }
});