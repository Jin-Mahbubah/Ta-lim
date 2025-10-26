document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.bottom-nav .nav-item');
    const currentPath = window.location.pathname; 

    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    if (currentPath.includes('/chapters.html') || currentPath.includes('/lessons.html') || currentPath.includes('/lesson.html') || currentPath.includes('/exercise.html')) {
        const courseLink = document.querySelector('a[href="/chapters.html"]');
        if (courseLink) {
            courseLink.classList.add('active');
        }
    } else if (currentPath.includes('/index.html') || currentPath.includes('/dashboard.html') || currentPath === '/') {
        // Aponta para index.html ou dashboard.html, o que for o seu principal
        const homeLink = document.querySelector('a[href="/index.html"]') || document.querySelector('a[href="/dashboard.html"]');
         if (homeLink) {
            homeLink.classList.add('active');
        }
    }
});