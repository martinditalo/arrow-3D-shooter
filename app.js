// ========== SETUP ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Camera setup
let currentCamera;
const camera1 = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const camera2 = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 5);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Ground
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ========== CHARACTERS ==========
const createHuman = (color, xPos) => {
    const group = new THREE.Group();
    group.position.set(xPos, 0, 0);
    
    // Body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32),
        new THREE.MeshStandardMaterial({ color })
    );
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xFFE0BD })
    );
    head.position.y = 1.8;
    head.castShadow = true;
    group.add(head);
    
    // Arms
    const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const leftArm = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: 0xFFE0BD }));
    leftArm.position.set(-0.4, 1.2, 0);
    leftArm.rotation.z = Math.PI/2;
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: 0xFFE0BD }));
    rightArm.position.set(0.4, 1.2, 0);
    rightArm.rotation.z = -Math.PI/2;
    rightArm.castShadow = true;
    group.add(rightArm);
    
    // Bow
    const bowCurve = new THREE.EllipseCurve(0, 0, 0.5, 1, 0, Math.PI, false, 0);
    const bowPoints = bowCurve.getPoints(50);
    const bowGeometry = new THREE.BufferGeometry().setFromPoints(bowPoints);
    const bowLine = new THREE.Line(
        bowGeometry,
        new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 3 })
    );
    bowLine.rotation.z = Math.PI/2;
    bowLine.position.set(xPos > 0 ? -0.7 : 0.7, 1.3, 0);
    scene.add(bowLine);
    
    return { group, bow: bowLine };
};

const player1 = createHuman(0xff0000, -5);
const player2 = createHuman(0x0000ff, 5);
scene.add(player1.group, player2.group);

// ========== ARROWS ==========
const arrows = [];
const createArrow = () => {
    const group = new THREE.Group();
    
    // Shaft
    const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    shaft.position.y = 0.4;
    shaft.rotation.z = Math.PI/2;
    group.add(shaft);
    
    // Head
    const head = new THREE.Mesh(
        new THREE.ConeGeometry(0.07, 0.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    head.position.set(0.4, 0.4, 0);
    group.add(head);
    
    // Fletching
    const fletching = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide })
    );
    fletching.position.set(-0.4, 0.4, 0);
    fletching.rotation.z = Math.PI/2;
    group.add(fletching);
    
    return group;
};

// ========== GAME LOGIC ==========
let currentPlayer = 1;
let canShoot = true;
const scores = [0, 0];

// Set initial camera
setCamera(currentPlayer);

document.getElementById('shoot-btn').addEventListener('click', shootArrow);

function setCamera(playerNum) {
    if (playerNum === 1) {
        camera1.position.set(-7, 2, 0);
        camera1.lookAt(-5, 1.5, 0);
        currentCamera = camera1;
    } else {
        camera2.position.set(7, 2, 0);
        camera2.lookAt(5, 1.5, 0);
        currentCamera = camera2;
    }
}

function shootArrow() {
    if (!canShoot) return;
    canShoot = false;
    document.getElementById('shoot-btn').disabled = true;
    
    const arrow = createArrow();
    if (currentPlayer === 1) {
        arrow.position.set(-4.5, 1.3, 0);
        arrow.rotation.z = Math.PI/2;
    } else {
        arrow.position.set(4.5, 1.3, 0);
        arrow.rotation.z = -Math.PI/2;
    }
    
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
        const target = currentPlayer === 1 ? player2.group : player1.group;
        if (arrow.obj.position.distanceTo(target.position) < 1.5) {
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
    setCamera(currentPlayer);
    
    // Brief delay before allowing next shot
    setTimeout(() => {
        canShoot = true;
        document.getElementById('shoot-btn').disabled = false;
    }, 1000);
}

// ========== ANIMATION LOOP ==========
function animate() {
    requestAnimationFrame(animate);
    updateArrows();
    renderer.render(scene, currentCamera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    currentCamera.aspect = window.innerWidth / window.innerHeight;
    currentCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});