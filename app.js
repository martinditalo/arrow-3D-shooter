// BASIC SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;
camera.position.y = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LIGHTS
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// GROUND
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// PLAYERS
const player1 = createPlayer(0xff0000, -5);
const player2 = createPlayer(0x0000ff, 5);
scene.add(player1);
scene.add(player2);

function createPlayer(color, xPos) {
    const player = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 2, 32),
        new THREE.MeshStandardMaterial({ color })
    );
    player.position.x = xPos;
    player.position.y = 1;
    player.rotation.z = xPos > 0 ? -Math.PI/2 : Math.PI/2;
    return player;
}

// GAME LOGIC
let currentPlayer = 1;
let canShoot = true;

document.getElementById('shoot-button').addEventListener('click', shootArrow);

function shootArrow() {
    if (!canShoot) return;
    canShoot = false;
    
    const arrow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    arrow.position.y = 1;
    arrow.position.x = currentPlayer === 1 ? -4 : 4;
    arrow.rotation.z = currentPlayer === 1 ? Math.PI/2 : -Math.PI/2;
    
    scene.add(arrow);
    
    const direction = currentPlayer === 1 ? 1 : -1;
    const speed = 0.1;
    
    function animateArrow() {
        arrow.position.x += direction * speed;
        
        // Check hit
        const target = currentPlayer === 1 ? player2 : player1;
        if (arrow.position.distanceTo(target.position) < 1) {
            updateScore();
            scene.remove(arrow);
            switchPlayer();
            return;
        }
        
        // Check out of bounds
        if (Math.abs(arrow.position.x) > 20) {
            scene.remove(arrow);
            switchPlayer();
            return;
        }
        
        requestAnimationFrame(animateArrow);
    }
    
    animateArrow();
}

function updateScore() {
    const scoreElement = currentPlayer === 1 ? 
        document.getElementById('player1-score') : 
        document.getElementById('player2-score');
    scoreElement.textContent = parseInt(scoreElement.textContent) + 1;
}

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    document.getElementById('turn-indicator').textContent = `Player ${currentPlayer}'s Turn`;
    canShoot = true;
}

// WINDOW RESIZE
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// RENDER LOOP
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();