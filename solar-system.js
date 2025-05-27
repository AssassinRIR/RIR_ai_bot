// solar-system.js
const canvas = document.getElementById('solar-system-bg');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Colors and sizes based on the image
const orbitScale = 0.9;
const sunScale = 1.1;
const planets = [
    { radius: 12, orbit: 60 * orbitScale, color: '#ffe066', speed: 0.018, angle: 0 }, // Mercury (yellow)
    { radius: 18, orbit: 110 * orbitScale, color: '#ffcc80', speed: 0.014, angle: 1 }, // Venus (orange)
    { radius: 13, orbit: 160 * orbitScale, color: '#40a9ff', speed: 0.012, angle: 2 }, // Earth (blue)
    { radius: 10, orbit: 210 * orbitScale, color: '#bdbdbd', speed: 0.010, angle: 3 }, // Mars (gray/white)
    { radius: 10, orbit: 260 * orbitScale, color: '#ffd600', speed: 0.008, angle: 4 }, // Jupiter (yellow)
    { radius: 13, orbit: 310 * orbitScale, color: '#ff3d00', speed: 0.007, angle: 5 }, // Saturn (red/orange)
    { radius: 15, orbit: 370 * orbitScale, color: '#00b0ff', speed: 0.006, angle: 6 }, // Uranus (light blue)
    { radius: 15, orbit: 420 * orbitScale, color: '#2979ff', speed: 0.005, angle: 7 }, // Neptune (blue)
];

let speedMultiplier = 1;
window.addEventListener('solarSystemSpeed', (e) => {
    speedMultiplier = e.detail.fast ? 3 : 1;
});

function drawSolarSystem() {
    // Background
    ctx.fillStyle = '#050000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Draw orbits
    ctx.save();
    ctx.strokeStyle = 'rgba(77, 72, 72, 0.48)';
    ctx.lineWidth = 1;
    planets.forEach(planet => {
        ctx.beginPath();
        ctx.arc(cx, cy, planet.orbit, 0, 2 * Math.PI);
        ctx.stroke();
    });
    ctx.restore();

    // Draw sun
    const sunRadius = 32 * sunScale;
    const sunGradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, sunRadius);
    sunGradient.addColorStop(0, '#fffbe6');
    sunGradient.addColorStop(0.5, '#ffe066');
    sunGradient.addColorStop(1, '#fff200');
    ctx.beginPath();
    ctx.arc(cx, cy, sunRadius, 0, 2 * Math.PI);
    ctx.fillStyle = sunGradient;
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw planets
    planets.forEach(planet => {
        planet.angle += planet.speed * speedMultiplier;
        const px = cx + Math.cos(planet.angle) * planet.orbit;
        const py = cy + Math.sin(planet.angle) * planet.orbit;
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, planet.radius, 0, 2 * Math.PI);
        ctx.fillStyle = planet.color;
        ctx.shadowColor = planet.color;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    });
}

function animate() {
    drawSolarSystem();
    requestAnimationFrame(animate);
}
animate(); 