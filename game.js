// Create the scene, camera, and renderer for Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set the camera position
camera.position.z = 5;

// Create players and setup their positions
const players = {
  1: createPlayer(0x0000ff, { x: -3, y: 1, z: 0 }), // Player 1 (Blue)
  2: createPlayer(0xff0000, { x: 3, y: 1, z: 0 }),  // Player 2 (Red)
};

let arrows = []; // Store arrows fired by players
let currentTurn = 1; // Track whose turn it is (1 for Player 1, 2 for Player 2)
let arrowSpeed = 0.1; // Speed at which arrows move

// Create a player (represented by a box)
function createPlayer(color, position) {
  const geometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const player = new THREE.Mesh(geometry, material);
  player.position.set(position.x, position.y, position.z);
  scene.add(player);
  return player;
}

// Create an arrow
function createArrow(owner) {
  const geometry = new THREE.CylinderGeometry(0.05, 0.05, 2);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const arrow = new THREE.Mesh(geometry, material);
  arrow.owner = owner;
  scene.add(arrow);
  arrows.push(arrow);
  return arrow;
}

// Update the position of arrows
function updateArrows() {
  arrows.forEach((arrow, index) => {
    if (arrow.owner === 1) {
      // Player 1's arrow (moving towards Player 2)
      arrow.position.x += arrowSpeed;
    } else if (arrow.owner === 2) {
      // Player 2's arrow (moving towards Player 1)
      arrow.position.x -= arrowSpeed;
    }

    // Remove arrows that go off-screen
    if (arrow.position.x > 10 || arrow.position.x < -10) {
      scene.remove(arrow);
      arrows.splice(index, 1);
    }
  });
}

// Switch turns
function switchTurn() {
  currentTurn = currentTurn === 1 ? 2 : 1;
}

// Function to shoot an arrow
function shootArrow(playerId) {
  if (currentTurn === playerId) {
    const player = players[playerId];
    const arrow = createArrow(playerId);
    arrow.position.set(player.position.x, player.position.y, player.position.z);

    // Switch turns after shooting
    switchTurn();
  }
}

// Event listener for shooting arrows
document.addEventListener('keydown', (event) => {
  if (event.key === ' ' && currentTurn === 1) {  // Spacebar for Player 1
    shootArrow(1);
  }
  if (event.key === 'Enter' && currentTurn === 2) {  // Enter for Player 2
    shootArrow(2);
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update arrow positions
  updateArrows();

  // Render the scene
  renderer.render(scene, camera);
}

// Start the animation loop
animate();
