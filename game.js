// Create the scene, camera, and renderer for Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set the camera position
camera.position.z = 5;

// Create player objects (simple cubes)
const players = {
  1: createPlayer(0x0000ff, { x: -3, y: 1, z: 0 }), // Player 1 (Blue)
  2: createPlayer(0xff0000, { x: 3, y: 1, z: 0 }),  // Player 2 (Red)
};

// Create arrows array
let arrows = [];

// Function to create a player
function createPlayer(color, position) {
  const geometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const player = new THREE.Mesh(geometry, material);
  player.position.set(position.x, position.y, position.z);
  scene.add(player);
  return player;
}

// Function to create an arrow
function createArrow(owner) {
  const geometry = new THREE.CylinderGeometry(0.05, 0.05, 2);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const arrow = new THREE.Mesh(geometry, material);
  arrow.owner = owner;
  scene.add(arrow);
  arrows.push(arrow);
  return arrow;
}

// Update arrows based on the owner
function updateArrows() {
  arrows.forEach((arrow, index) => {
    if (arrow.owner === 1) {
      arrow.position.x += 0.1; // Move right for player 1
    } else {
      arrow.position.x -= 0.1; // Move left for player 2
    }

    // Remove arrows if they go off-screen
    if (arrow.position.x > 10 || arrow.position.x < -10) {
      scene.remove(arrow);
      arrows.splice(index, 1);
    }
  });
}

// Shoot an arrow and save it to localStorage
function shootArrow(playerId) {
  const player = players[playerId];
  const arrow = createArrow(playerId);
  arrow.position.set(player.position.x, player.position.y, player.position.z);

  // Save the arrow event to localStorage
  const arrowsData = JSON.parse(localStorage.getItem('arrows')) || [];
  arrowsData.push({ owner: playerId, position: arrow.position });
  localStorage.setItem('arrows', JSON.stringify(arrowsData));
}

// Listen for keydown events to trigger shooting
document.addEventListener('keydown', (event) => {
  if (event.key === ' ') { // Spacebar to shoot for Player 1
    shootArrow(1);
  }
  if (event.key === 'Enter') { // Enter to shoot for Player 2
    shootArrow(2);
  }
});

// Sync arrows across tabs by listening for changes in localStorage
function syncArrows() {
  const storedArrows = JSON.parse(localStorage.getItem('arrows')) || [];
  
  storedArrows.forEach((arrowData) => {
    const existingArrow = arrows.find((arrow) => {
      return arrow.owner === arrowData.owner && arrow.position.equals(new THREE.Vector3(arrowData.position.x, arrowData.position.y, arrowData.position.z));
    });
    
    if (!existingArrow) {
      const newArrow = createArrow(arrowData.owner);
      newArrow.position.set(arrowData.position.x, arrowData.position.y, arrowData.position.z);
    }
  });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update arrow positions and sync data
  updateArrows();
  syncArrows();

  // Render the scene
  renderer.render(scene, camera);
}

// Start the animation loop
animate();
