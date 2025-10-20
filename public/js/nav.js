document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.bottom-nav .nav-item');
    const currentPath = window.location.pathname; // Ex: "/chapters.html" ou "/lessons.html"

    // Primeiro, remove a classe 'active' de todos os links para começar do zero.
    navLinks.forEach(link => link.classList.remove('active'));

    // Variável para guardar o seletor do link que deve ficar ativo
    let activeLinkSelector;

    // Condições para decidir qual link deve ser ativado
    if (currentPath.includes('/dashboard.html') || currentPath === '/') {
        // Se estivermos no dashboard, o link ativo é o da casa
        activeLinkSelector = 'a[href="/dashboard.html"]';
    } else if (
        currentPath.includes('/chapters.html') ||
        currentPath.includes('/lessons.html') ||
        currentPath.includes('/lesson.html') ||
        currentPath.includes('/exercise.html')
    ) {
        // Se estivermos em qualquer página do fluxo de capítulos/lições, o link ativo é o do livro
        activeLinkSelector = 'a[href="/chapters.html"]';
    } 
    // Futuramente, pode adicionar aqui 'else if' para os outros ícones (ex: graduação, perfil)

    // Finalmente, encontra o link determinado e adiciona a classe 'active'
    if (activeLinkSelector) {
        const activeLink = document.querySelector(activeLinkSelector);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
});