document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.bottom-nav .nav-item');
    const currentPath = window.location.pathname; // ex: "/chapters.html"

    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // CORRIGIDO: Lógica mais robusta
    if (currentPath.includes('/chapters.html') || currentPath.includes('/lessons.html') || currentPath.includes('/lesson.html') || currentPath.includes('/exercise.html')) {
        // Ativa o link que aponta para /chapters.html
        const courseLink = document.querySelector('a[href="/chapters.html"]');
        if (courseLink) {
            courseLink.classList.add('active');
        }
    } else if (currentPath.includes('/dashboard.html') || currentPath === '/') {
        // Ativa o link que aponta para /dashboard.html (ou /)
        const homeLink = document.querySelector('a[href="/dashboard.html"]') || document.querySelector('a[href="/"]');
         if (homeLink) {
            homeLink.classList.add('active');
        }
    }
    // Adicionar 'else if' para os outros links (graduação, perfil) aqui no futuro
});