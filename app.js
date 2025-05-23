// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Game variables
let currentPlayer = 1;
let player1Score = 0;
let player2Score = 0;
let canShoot = true;
const arrows = [];
const arrowSpeed = 0.5;

// Ground
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x228B22, 
    side: THREE.DoubleSide 
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Players
const playerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
const player1Material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const player2Material = new THREE.MeshStandardMaterial({ color: 0x0000ff });

const player1 = new THREE.Mesh(playerGeometry, player1Material);
player1.position.set(-5, 1, 0);
player1.rotation.z = Math.PI / 2;
scene.add(player1);

const player2 = new THREE.Mesh(playerGeometry, player2Material);
player2.position.set(5, 1, 0);
player2.rotation.z = -Math.PI / 2;
scene.add(player2);

// Bow for players
function createBow() {
    const bow = new THREE.Group();
    
    // Bow curve
    const curve = new THREE.EllipseCurve(
        0, 0,            // center
        0.5, 1,          // xRadius, yRadius
        0, Math.PI,      // startAngle, endAngle
        false,           // clockwise
        0                // rotation
    );
    
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    const bowCurve = new THREE.Line(geometry, material);
    bowCurve.rotation.z = Math.PI / 2;
    bow.add(bowCurve);
    
    // Bow string
    const stringGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(0, -0.5, 0)
    ]);
    const stringMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const bowString = new THREE.Line(stringGeometry, stringMaterial);
    bow.add(bowString);
    
    return bow;
}

const bow1 = createBow();
bow1.position.set(-4, 1, 0);
scene.add(bow1);

const bow2 = createBow();
bow2.position.set(4, 1, 0);
scene.add(bow2);

// Arrow function
function createArrow() {
    const arrow = new THREE.Group();
    
    // Arrow shaft
    const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = 0.5;
    arrow.add(shaft);
    
    // Arrow head
    const headGeometry = new THREE.ConeGeometry(0.1, 0.3, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.15;
    arrow.add(head);
    
    // Fletching
    const fletchingGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.05);
    const fletchingMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const fletching = new THREE.Mesh(fletchingGeometry, fletchingMaterial);
    fletching.position.y = 0.1;
    arrow.add(fletching);
    
    return arrow;
}

// Shoot arrow function
function shootArrow() {
    if (!canShoot) return;
    
    canShoot = false;
    document.getElementById('shoot-button').disabled = true;
    
    const arrow = createArrow();
    
    if (currentPlayer === 1) {
        arrow.position.set(-4, 1, 0);
        arrow.rotation.z = Math.PI / 2;
        arrow.userData = { direction: new THREE.Vector3(1, 0, 0) };
    } else {
        arrow.position.set(4, 1, 0);
        arrow.rotation.z = -Math.PI / 2;
        arrow.userData = { direction: new THREE.Vector3(-1, 0, 0) };
    }
    
    scene.add(arrow);
    arrows.push(arrow);
    
    // Check for hit
    const hitCheckInterval = setInterval(() => {
        if (currentPlayer === 1) {
            if (arrow.position.distanceTo(player2.position) < 1) {
                clearInterval(hitCheckInterval);
                player1Score++;
                document.getElementById('player1-score').textContent = `Player 1: ${player1Score}`;
                scene.remove(arrow);
                arrows.splice(arrows.indexOf(arrow), 1);
                switchPlayer();
            }
        } else {
            if (arrow.position.distanceTo(player1.position) < 1) {
                clearInterval(hitCheckInterval);
                player2Score++;
                document.getElementById('player2-score').textContent = `Player 2: ${player2Score}`;
                scene.remove(arrow);
                arrows.splice(arrows.indexOf(arrow), 1);
                switchPlayer();
            }
        }
        
        // Remove arrow if it goes out of bounds
        if (Math.abs(arrow.position.x) > 20 || Math.abs(arrow.position.y) > 10) {
            clearInterval(hitCheckInterval);
            scene.remove(arrow);
            arrows.splice(arrows.indexOf(arrow), 1);
            switchPlayer();
        }
    }, 50);
}

// Switch player function
function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    document.getElementById('turn-indicator').textContent = `Player ${currentPlayer}'s Turn`;
    canShoot = true;
    document.getElementById('shoot-button').disabled = false;
}

// Event listeners
document.getElementById('shoot-button').addEventListener('click', shootArrow);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update arrows
    arrows.forEach(arrow => {
        arrow.position.add(arrow.userData.direction.clone().multiplyScalar(arrowSpeed));
    });
    
    renderer.render(scene, camera);
}

animate();