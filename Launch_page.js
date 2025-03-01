
// Generate blockchain background elements
function createBlockchainBackground() {
    const bg = document.getElementById('blockchainBg');
    const colors = ['rgba(153, 129, 0, 0.3)', 'rgba(153, 129, 0, 0.2)', 'rgba(153, 129, 0, 0.1)'];
    
    for (let i = 0; i < 15; i++) {
        const hexagon = document.createElement('div');
        hexagon.className = 'hexagon';
        hexagon.style.left = `${Math.random() * 100}%`;
        hexagon.style.top = `${Math.random() * 100}%`;
        hexagon.style.animationDelay = `${Math.random() * 5}s`;
        hexagon.style.background = colors[Math.floor(Math.random() * colors.length)];
        bg.appendChild(hexagon);
    }
}

// Cursor Trail Effect
const hero = document.querySelector('.hero');
const cursorTrail = document.getElementById('cursorTrail');
let mouseX = 0, mouseY = 0;
let isOverHero = false;

hero.addEventListener('mouseenter', () => {
    isOverHero = true;
    cursorTrail.style.display = 'block';
});

hero.addEventListener('mouseleave', () => {
    isOverHero = false;
    cursorTrail.style.display = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (isOverHero) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Create ripple effect
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = `${e.clientX - 5}px`;
        ripple.style.top = `${e.clientY - 5}px`;
        ripple.style.width = '10px';
        ripple.style.height = '10px';
        ripple.style.border = '2px solid rgba(255, 215, 0, 0.3)';
        ripple.style.borderRadius = '50%';
        ripple.style.animation = 'ripple 0.6s linear';
        document.body.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }
});

// Smooth cursor follow
function updateCursor() {
    if (isOverHero) {
        cursorTrail.style.left = `${mouseX - 4}px`;
        cursorTrail.style.top = `${mouseY - 4}px`;
    }
    requestAnimationFrame(updateCursor);
}

// Initially hide the trail
cursorTrail.style.display = 'none';

// Button click handler
document.getElementById('launchDapp').addEventListener('click', function() {
    window.location.href = 'https://chainballet5555.surge.sh/';
});

// Initialize effects
createBlockchainBackground();
updateCursor();

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        if(window.innerWidth <= 768) {
            e.preventDefault();
            item.classList.toggle('active');
        }
    });
});
