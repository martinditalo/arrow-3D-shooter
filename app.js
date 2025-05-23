
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

// Ground with texture
const groundTexture = new THREE.CanvasTexture(createGrassTexture());
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ map: groundTexture })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Skybox
const skyTexture = new THREE.CanvasTexture(createSkyTexture());
scene.background = skyTexture;

// ========== CHARACTERS ==========
const createHuman = (color, xPos) => {
    const group = new THREE.Group();
    group.position.set(xPos, 0, 0);
    
    // Body (torso)
    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.5, 0.4),
        new THREE.MeshStandardMaterial({ color })
    );
    torso.position.y = 1;
    torso.castShadow = true;
    group.add(torso);
    
    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xFFE0BD })
    );
    head.position.y = 1.8;
    head.castShadow = true;
    group.add(head);
    
    // Legs
    const legGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const leftLeg = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x0000AA }));
    leftLeg.position.set(-0.2, 0.4, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x0000AA }));
    rightLeg.position.set(0.2, 0.4, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    
    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.3);
    const leftArm = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: 0xFFE0BD }));
    leftArm.position.set(-0.5, 1.2, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: 0xFFE0BD }));
    rightArm.position.set(0.5, 1.2, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    
    return group;
};

const createBow = (xPos) => {
    const group = new THREE.Group();
    group.position.set(xPos, 1.3, 0);
    
    // Bow curve
    const bowCurve = new THREE.EllipseCurve(0, 0, 0.5, 1, 0, Math.PI, false, 0);
    const bowPoints = bowCurve.getPoints(50);
    const bowGeometry = new THREE.BufferGeometry().setFromPoints(bowPoints);
    const bowLine = new THREE.Line(
        bowGeometry,
        new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 3 })
    );
    bowLine.rotation.z = Math.PI/2;
    group.add(bowLine);
    
    // Bow string
    const stringGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(0, -0.5, 0)
    ]);
    const stringMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    const bowString = new THREE.Line(stringGeometry, stringMaterial);
    group.add(bowString);
    
    return { group, string: bowString };
};

const player1 = createHuman(0xFF3333, -5);
const player2 = createHuman(0x3333FF, 5);
const bow1 = createBow(-4.5);
const bow2 = createBow(4.5);
scene.add(player1, player2, bow1.group, bow2.group);

// ========== ARROWS ==========
const arrows = [];
const createArrow = () => {
    const group = new THREE.Group();
    
    // Shaft
    const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    shaft.position.y = 0.4;
    shaft.rotation.z = Math.PI/2;
    group.add(shaft);
    
    // Head
    const head = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.15, 16),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    head.position.set(0.4, 0.4, 0);
    group.add(head);
    
    // Fletching
    const fletching = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, 0.07),
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
let isDrawing = false;
let drawStartTime = 0;
let drawPower = 0;
const maxPower = 100;
const scores = [0, 0];

// Set initial camera
setCamera(currentPlayer);

// Mouse controls
document.addEventListener('mousedown', startDrawing);
document.addEventListener('mouseup', releaseArrow);
document.addEventListener('touchstart', startDrawing);
document.addEventListener('touchend', releaseArrow);

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

function startDrawing(e) {
    if (!canShoot || isDrawing) return;
    e.preventDefault();
    
    isDrawing = true;
    drawStartTime = Date.now();
    document.getElementById('power-container').style.display = 'block';
    
    // Animate bow string
    animateBowString();
}

function animateBowString() {
    if (!isDrawing) return;
    
    const elapsed = Date.now() - drawStartTime;
    drawPower = Math.min(maxPower, elapsed / 10);
    document.getElementById('power-bar').style.width = `${drawPower}%`;
    
    // Pull bow string
    const bow = currentPlayer === 1 ? bow1 : bow2;
    const pullDistance = drawPower / 100 * 0.5;
    bow.string.geometry.setFromPoints([
        new THREE.Vector3(0, 0.5 - pullDistance, 0),
        new THREE.Vector3(0, -0.5 + pullDistance, 0)
    ]);
    bow.string.geometry.verticesNeedUpdate = true;
    
    requestAnimationFrame(animateBowString);
}

function releaseArrow(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    isDrawing = false;
    document.getElementById('power-container').style.display = 'none';
    
    // Reset bow string
    const bow = currentPlayer === 1 ? bow1 : bow2;
    bow.string.geometry.setFromPoints([
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(0, -0.5, 0)
    ]);
    
    if (drawPower < 10) { // Minimum power
        canShoot = true;
        return;
    }
    
    canShoot = false;
    shootArrow(drawPower);
}

function shootArrow(power) {
    const arrow = createArrow();
    const speed = 0.1 + (power / maxPower * 0.3);
    
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
        speed: speed
    });
}

function updateArrows() {
    arrows.forEach((arrow, index) => {
        arrow.obj.position.x += arrow.direction * arrow.speed;
        
        // Check hit
        const target = currentPlayer === 1 ? player2 : player1;
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
    }, 1000);
}

// ========== UTILITIES ==========
function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base green
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add grass blades
    ctx.strokeStyle = '#2E8B57';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const height = 2 + Math.random() * 5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 2, y - height);
        ctx.stroke();
    }
    
    return canvas;
}

function createSkyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1E90FF');
    gradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.5;
        const size = 20 + Math.random() * 30;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas;
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