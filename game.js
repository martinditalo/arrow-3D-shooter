const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set up Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Player setup
let player1, player2;
let arrowObjects = [];
let arrows = [];

// Create player (simple cubes for now)
function createPlayer(color, position) {
    const geometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const player = new THREE.Mesh(geometry, material);
    player.position.set(position.x, position.y, position.z);
    scene.add(player);
    return player;
}

player1 = createPlayer(0x0000ff, { x: -5, y: 1, z: 0 });
player2 = createPlayer(0xff0000, { x: 5, y: 1, z: 0 });

// Arrow creation (simple cylinder for now)
function createArrow(owner, direction, position) {
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const arrow = new THREE.Mesh(geometry, material);
    arrow.rotation.z = Math.PI / 2;
    arrow.position.set(position.x, position.y, position.z);
    arrow.owner = owner;
    scene.add(arrow);
    return arrow;
}

// Setup the socket connection
const socket = io();

// Listen for the shooting event
socket.on('shoot', (data) => {
    // Create an arrow for the other player
    const arrow = createArrow(data.owner, data.direction, data.position);
    arrows.push(arrow);
});

// Move the arrow based on its direction
function updateArrows() {
    arrows.forEach((arrow, index) => {
        if (arrow.owner === 1) {
            arrow.position.x += 0.1;  // Move right for player 1
        } else {
            arrow.position.x -= 0.1;  // Move left for player 2
        }

        // Check for collision (simplified logic)
        if (arrow.position.x > 5 || arrow.position.x < -5) {
            scene.remove(arrow);  // Remove the arrow after it goes out of bounds
            arrows.splice(index, 1);
        }
    });
}

// Handle key events (shooting arrows)
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {  // Player 1 shoots
        shootArrow(player1, 'right');
    }
    if (event.key === 'Space') {  // Player 2 shoots
        shootArrow(player2, 'left');
    }
});

// Send shoot command to other player
function shootArrow(owner, direction) {
    const position = owner.position.clone();
    socket.emit('shoot', { owner: owner === player1 ? 1 : 2, direction, position });
}

// Camera movement
camera.position.z = 10;

// Game loop
function animate() {
    requestAnimationFrame(animate);
    updateArrows();
    renderer.render(scene, camera);
}

// Start the game loop
animate();
