document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const indicator = document.querySelector('.glass-indicator');

    function updateIndicator(activeLink) {
        if (!indicator || !activeLink) return;
        indicator.style.width = `${activeLink.offsetWidth}px`;
        indicator.style.left = `${activeLink.offsetLeft}px`;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            updateIndicator(link);
        });
    });

    // Inicializar indicador en la pestaña activa por defecto
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
        setTimeout(() => updateIndicator(activeLink), 100);
    }

    // Ajustar en cambio de tamaño de pantalla
    window.addEventListener('resize', () => {
        const currentActive = document.querySelector('.nav-link.active');
        updateIndicator(currentActive);
    });
});