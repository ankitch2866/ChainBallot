// Initialize blockchain background
function createBlockchainBackground() {
    const bg = document.getElementById('blockchainBg');
    const colors = ['rgba(153, 129, 0, 0.3)', 'rgba(153, 129, 0, 0.2)', 'rgba(153, 129, 0, 0.1)'];
    
    for (let i = 0; i < 20; i++) {
        const hexagon = document.createElement('div');
        hexagon.className = 'hexagon';
        hexagon.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 5}s;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
        `;
        bg.appendChild(hexagon);
    }
}

// Cursor Trail Effect
const hero = document.querySelector('.hero');
const cursorTrail = document.getElementById('cursorTrail');
let mouseX = 0, mouseY = 0;
let isOverHero = false;

hero.addEventListener('mouseenter', () => isOverHero = true);
hero.addEventListener('mouseleave', () => isOverHero = false);

document.addEventListener('mousemove', (e) => {
    if (isOverHero) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            left: ${e.clientX - 5}px;
            top: ${e.clientY - 5}px;
            width: 10px;
            height: 10px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            border-radius: 50%;
            animation: ripple 0.6s linear;
        `;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
});

// Smooth cursor follow
function updateCursor() {
    if (isOverHero) {
        cursorTrail.style.cssText = `
            left: ${mouseX - 4}px;
            top: ${mouseY - 4}px;
        `;
    }
    requestAnimationFrame(updateCursor);
}

// Navigation and Mobile Menu
const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
let scrollTimer = null;

// Scroll handler
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (scrollTimer) clearTimeout(scrollTimer);
    navbar.classList.toggle('scrolled', currentScroll > 100);
    scrollTimer = setTimeout(() => navbar.classList.remove('scrolling'), 150);
});

// Mobile menu handlers
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.2, rootMargin: '0px' });

document.querySelectorAll('.about, .features, .feature-card').forEach(element => {
    observer.observe(element);
});

// 3D hover effect for about text
document.querySelector('.about-text')?.addEventListener('mousemove', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    e.currentTarget.style.setProperty('--mouse-x', `${(centerX - x) / 20}deg`);
    e.currentTarget.style.setProperty('--mouse-y', `${(y - centerY) / 20}deg`);
});

document.querySelector('.about-text')?.addEventListener('mouseleave', (e) => {
    e.currentTarget.style.setProperty('--mouse-x', '0deg');
    e.currentTarget.style.setProperty('--mouse-y', '0deg');
});

// Launch DApp button
document.getElementById('launchDapp')?.addEventListener('click', () => {
    window.location.href = 'https://chainballot2866.surge.sh/';
});

// Initialize effects
createBlockchainBackground();
updateCursor();
