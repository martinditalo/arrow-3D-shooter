// ========== SETUP ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// ========== GAME OBJECTS ==========
// Ground
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Players
const createPlayer = (color, xPos) => {
    const player = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 2, 32),
        new THREE.MeshStandardMaterial({ color })
    );
    player.position.set(xPos, 1, 0);
    player.rotation.z = xPos > 0 ? -Math.PI/2 : Math.PI/2;
    return player;
};

const player1 = createPlayer(0xff0000, -5); // Red player
const player2 = createPlayer(0x0000ff, 5);  // Blue player
scene.add(player1, player2);

// Arrows
const arrows = [];
const createArrow = () => {
    const arrow = new THREE.Group();
    
    // Shaft
    const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    shaft.position.y = 0.5;
    arrow.add(shaft);
    
    // Arrowhead
    const head = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.3, 16),
        new THREE.MeshStandardMaterial({ color: 0x696969 })
    );
    head.position.y = 1.15;
    arrow.add(head);
    
    return arrow;
};

// ========== GAME LOGIC ==========
let currentPlayer = 1;
let canShoot = true;
const scores = [0, 0];

document.getElementById('shoot-btn').addEventListener('click', shootArrow);

function shootArrow() {
    if (!canShoot) return;
    canShoot = false;
    
    const arrow = createArrow();
    arrow.position.x = currentPlayer === 1 ? -4 : 4;
    arrow.position.y = 1;
    arrow.rotation.z = currentPlayer === 1 ? Math.PI/2 : -Math.PI/2;
    
    scene.add(arrow);
    arrows.push({
        obj: arrow,
        direction: currentPlayer === 1 ? 1 : -1,
        speed: 0.2
    });
}

function updateArrows() {
    arrows.forEach((arrow, index) => {
        arrow.obj.position.x += arrow.direction * arrow.speed;
        
        // Check hit
        const target = currentPlayer === 1 ? player2 : player1;
        if (arrow.obj.position.distanceTo(target.position) < 1) {
            scores[currentPlayer-1]++;
            document.getElementById(`score${currentPlayer}`).textContent = scores[currentPlayer-1];
            scene.remove(arrow.obj);
            arrows.splice(index, 1);
            switchPlayer();
        }
        
        // Check out of bounds
        if (Math.abs(arrow.obj.position.x) > 15) {
            scene.remove(arrow.obj);
            arrows.splice(index, 1);
            switchPlayer();
        }
    });
}

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    document.getElementById('current-player').textContent = currentPlayer;
    canShoot = true;
}

// ========== ANIMATION LOOP ==========
function animate() {
    requestAnimationFrame(animate);
    updateArrows();
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});