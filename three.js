import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Group, Easing, Tween } from '@tweenjs/tween.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';



// Initialize Three.js Scene
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#000000', 15, 18); // #232323
// scene.background = new THREE.Color('#000000');

// // XY plane (default GridHelper)
// const gridXY = new THREE.GridHelper(50, 50, 0x888888, 0x444444);
// scene.add(gridXY);

// // XZ plane (rotate so it's vertical)
// const gridXZ = new THREE.GridHelper(50, 50, 0x888888, 0x444444);
// gridXZ.rotation.x = Math.PI / 2;
// scene.add(gridXZ);

// // YZ plane (rotate so it's vertical the other way)
// const gridYZ = new THREE.GridHelper(50, 50, 0x888888, 0x444444);
// gridYZ.rotation.z = Math.PI / 2;
// scene.add(gridYZ);

// // Also add axes helper
// const axesHelper = new THREE.AxesHelper(10);
// scene.add(axesHelper);

// Environment Setup
const rgbeLoader = new RGBELoader();
rgbeLoader.load('envs/qwantani_dusk_2_puresky_1k.hdr', (texture) => {
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.environment = texture;
    scene.background = new THREE.Color(0x000000); // keep black bg
});


// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;
camera.position.y = 7;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("bg"), alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.15;  // try between 0.4 – 1.0
renderer.outputColorSpace = THREE.SRGBColorSpace;


// Orbit control Setup
const controls = new OrbitControls(camera, renderer.domElement);
// controls.enabled = false;
// const Flycontrols = new FlyControls(camera, renderer.domElement);
let useFly = false;
// window.addEventListener("keydown", (e) => {
//   if (e.key.toLowerCase() === "l") {
//     useFly = !useFly;
//     orbitControls.enabled = !useFly;
//     console.log(`Switched to ${useFly ? "Fly" : "Orbit"} controls`);
//   }
// });

// // Settings
// Flycontrols.movementSpeed = 20;     // Speed of movement
// Flycontrols.rollSpeed = Math.PI / 6; // How fast you roll with Q/E
// Flycontrols.dragToLook = true;     // Click+drag to look around
// Flycontrols.autoForward = false;   // Move only when pressing W


// Loader setup
const manager = new THREE.LoadingManager();
const loader = new GLTFLoader(manager);
const group = new Group()

document.body.appendChild(renderer.domElement);
controls.enablePan = false;
controls.enableZoom = false;
controls.enableRotate = false;
var clock = new THREE.Clock();

// Adding Light
const keyLight = new THREE.DirectionalLight(0xffffff, 2);
keyLight.position.set(5, 10, 7);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

// const directionalLight = new THREE.DirectionalLight(0x404040, 30);
// directionalLight.position.z = 1;
// directionalLight.position.y = 3;
// const backDirectionalLight = new THREE.DirectionalLight(0x404040, 30);
// backDirectionalLight.position.z = -1;
// backDirectionalLight.position.y = 3;
// scene.add(directionalLight);
// scene.add(backDirectionalLight)
// const light = new THREE.AmbientLight(0x404040, 5); // soft white light
// scene.add( light );


// Adding Man
var manModel;
var skeleton;
var mixer;
var actions = {};
var currentAction;
var teamClones = [];
var teamMixers = [];

// Define how far everything should travel
const zStart = 0;     // starting Z
const zEnd = -10;   // deep in fog

let scrollProgress = 0;
const scrollObjects = []; // everything that should move into fog

// Loader Stuff
const loaderDiv = document.getElementById('loader');
const loadingText = document.getElementById('loading-text');

// Progress updates
manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const percent = Math.round((itemsLoaded / itemsTotal) * 100);
    loadingText.textContent = `Loading... ${percent}%`;
};

// 4. set the spans with the queried HTML DOM elements
let cameraDirection = new THREE.Vector3()
let camPositionSpan = document.querySelector("#position");
let camLookAtSpan = document.querySelector("#lookingAt");

// All resources loaded
manager.onLoad = function () {
    // Fade out
    loaderDiv.classList.add("hidden");
};

// After fade, remove from DOM
loaderDiv.addEventListener("transitionend", () => {
    if (loaderDiv.classList.contains("hidden")) {
        loaderDiv.style.display = "none";
    }
});

function isMobile() {
    return window.innerWidth <= 1024; // Updated to include tablets
}

window.addEventListener("scroll", () => {
    if (!isMobile()) return;

    const maxScroll = document.body.scrollHeight - window.innerHeight;
    scrollProgress = window.scrollY / maxScroll; // 0 → 1
});


// loader.load('models/physical.glb', function(gltf) {
loader.load('models/NewRig.glb', function (gltf) {
    mixer = new THREE.AnimationMixer(gltf.scene);
    for (let anim of gltf.animations) {
        let action = mixer.clipAction(anim);
        actions[anim.name] = action;
    }

    manModel = gltf.scene;
    gltf.scene.position.y = -7;

    // Access the scene and set its scale
    gltf.scene.scale.set(6, 6, 6);

    // Material Set
    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.material.needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(gltf.scene)

    // let animAction = actions['Appear'];
    let animAction = actions['Idle'];
    currentAction = animAction
    animAction.clampWhenFinished = true;
    animAction.setLoop(THREE.LoopRepeat);
    animAction.play();

    scrollObjects.push(manModel);
}, undefined, function (error) {
    console.error(error);
});


// Adding Chair
var chair;

loader.load('models/chair.glb', function (gltf) {
    chair = gltf.scene;
    chair.position.z = -15;
    chair.position.y = -7;
    buttonTweenSettings.objects.chair.object = chair.position;
    scene.add(chair);
});

// Adding Table
var table;
loader.load('models/table.glb', function (gltf) {
    table = gltf.scene;
    table.position.z = 30;
    table.position.y = -7;
    buttonTweenSettings.objects.table.object = table.position;
    scene.add(gltf.scene);
});

// Adding Apple
var apple;
loader.load('models/apple.glb', function (gltf) {
    apple = gltf.scene;
    apple.position.z = 0;
    apple.position.y = 5;
    buttonTweenSettings.objects.apple.object = apple.position;
    scene.add(gltf.scene);
});

// Adding Dumbell
var dumbell;
loader.load('models/dumbell.glb', function (gltf) {
    dumbell = gltf.scene;
    dumbell.position.z = 0;
    dumbell.position.y = 5;
    buttonTweenSettings.objects.dumbell.object = dumbell.position;
    scene.add(gltf.scene);
});

// Reduce brightness by scaling environment intensity
scene.traverse((child) => {
    if (child.isMesh && child.material.isMeshStandardMaterial) {
        child.material.envMapIntensity = 0.1; // scale down reflection strength
    }
});


// Handle Window Resize
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Re-run transition logic to update visibility based on new screen size
    // We pass the currentAction name. We need to store it properly.
    // In main.js 'currentAction' is the page name. In three.js we rely on 'transition' param.
    // We can infer the current state from the last called transition or just re-trigger it if we had state.
    // For now, let's just ensure if we switch to desktop, things become visible.
    if (!isMobile()) {
        if (manModel) manModel.visible = true;
        if (chair) chair.visible = true;
        if (table) table.visible = true;
        if (apple) apple.visible = true;
        if (dumbell) dumbell.visible = true;
        teamClones.forEach(clone => clone.visible = true);
    } else {
        if (lastTransitionParam !== 'home') {
            if (manModel) manModel.visible = false;
            if (chair) chair.visible = false;
            if (table) table.visible = false;
            if (apple) apple.visible = false;
            if (dumbell) dumbell.visible = false;
            teamClones.forEach(clone => clone.visible = false);
        }
    }
});

let lastTransitionParam = 'home'; // Default

var buttonTweenSettings = {
    home: {
        model: { position: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 3, z: 12 } },
        anim: 'Idle',
        loop: true,
    },
    mental: {
        model: { position: { x: -5, y: 0, z: 0 } },
        camera: { position: { x: -10, y: 0, z: 5 } },
        anim: 'Sitting',
        miscObjs: ['chair'],
    },
    mentalHealth: {
        model: { position: { x: -5, y: 0, z: 0 } },
        camera: { position: { x: -10, y: 0, z: 0 } },
        anim: 'Sitting',
        miscObjs: ['chair']
    },
    learning: {
        model: { position: { x: -8, y: 0, z: 0 } },
        camera: { position: { x: -12, y: 0, z: 5 } },
        anim: 'Learn',
        miscObjs: ['table', 'chair']
    },
    physical: {
        model: { position: { x: 0, y: 2, z: 0 } },
        camera: { position: { x: 0, y: 6, z: 9 } },
        anim: 'BackDouble'
    },
    fitness: {
        model: { position: { x: 0, y: 3.6, z: 5.2 } },
        camera: { position: { x: -4.5, y: 5.3, z: 8.8 } },
        anim: 'Dumbell',
        miscObjs: ['dumbell']
    },
    nutrition: {
        model: { position: { x: -6.2, y: 1.3, z: 4.6 } },
        camera: { position: { x: 6.6, y: 4.4, z: 11.7 } },
        anim: 'Apple',
        miscObjs: ['apple']
    },
    about: {
        model: { position: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 5, z: 20 } },
        anim: 'Idle'
    },
    team: {
        model: { position: { x: 13, y: 0, z: 0 } },
        camera: { position: { x: -7, y: 3, z: 13 } },
        anim: 'Idle',
    },
    events: {
        model: { position: { x: -15, y: 0, z: 0 } },
        camera: { position: { x: 7, y: 3, z: 10 } },
        anim: 'Run',
        loop: true,
    },
    sponsorship: {
        model: { position: { x: -15, y: 0, z: 0 } },
        camera: { position: { x: 7, y: 3, z: 10 } },
        anim: 'SitDownTable',
        miscObjs: ['table', 'chair'],
    },
    objects: {
        chair: {
            object: chair,
            position: { x: 0, y: -7, z: 0 },
            default: { x: 0, y: -7, z: -15 }
        },
        table: {
            object: table,
            position: { x: 0, y: -7, z: 0 },
            default: { x: 0, y: -7, z: 30 }
        },
        apple: {
            object: apple,
            position: { x: 0, y: -7, z: 0 },
            default: { x: 0, y: 5, z: 0 }
        },
        dumbell: {
            object: dumbell,
            position: { x: 0, y: -7, z: 0 },
            default: { x: 0, y: 5, z: 0 }
        }
    }
}

function transition(param) {
    lastTransitionParam = param;
    var settings = buttonTweenSettings[param];
    let animAction = actions[settings.anim];
    if (currentAction != animAction) {
        // if(settings.anim == "DodgeBackInPlace"){

        // }
        console.log(settings.anim);
        animAction.reset();
        animAction.clampWhenFinished = true;
        if (settings.loop) {
            animAction.setLoop(THREE.LoopRepeat);
        }
        else {
            animAction.setLoop(THREE.LoopOnce);
        }
        animAction.play();
        currentAction.crossFadeTo(animAction, 0.5, true);
        currentAction = animAction;
    }

    if (settings.miscObjs) {
        for (const obj of settings.miscObjs) {
            let item = buttonTweenSettings.objects[obj];
            group.add(new Tween(item.object).to(item.position, 500).easing(Easing.Quadratic.Out).start());
        };

        for (const obj in buttonTweenSettings.objects) {
            if (!settings.miscObjs.includes(obj)) {
                let item = buttonTweenSettings.objects[obj];
                group.add(new Tween(item.object).to(item.default, 500).easing(Easing.Quadratic.In).start());
            }
        }
    }
    else {
        for (const obj in buttonTweenSettings.objects) {
            let item = buttonTweenSettings.objects[obj];
            group.add(new Tween(item.object).to(item.default, 500).easing(Easing.Quadratic.In).start());
        }
    }

    const camManTween = new Tween(camera.position).to(settings.camera.position, 500).easing(Easing.Quadratic.InOut).start();
    const controlTween = new Tween(controls.target).to(settings.model.position, 500).easing(Easing.Quadratic.InOut).onUpdate((pos) => { controls.target.set(pos.x, pos.y, pos.z); }).start();

    group.add(controlTween);
    group.add(camManTween);

    if (param === 'team' && teamClones.length === 0 && manModel) {
        // Spawn 2 clones with arc configuration
        const clonesConfig = [
            { xOffset: -3.5, zOffset: +1.5, rotateY: 0.3 }, // Left
            { xOffset: 3.5, zOffset: +1.5, rotateY: -0.5 }  // Right
        ];

        clonesConfig.forEach((config) => {
            const clone = SkeletonUtils.clone(manModel);
            clone.position.copy(manModel.position);
            clone.rotation.copy(manModel.rotation);
            clone.scale.copy(manModel.scale);

            // Create mixer
            const mixer = new THREE.AnimationMixer(clone);

            // Play Idle
            const idleAction = actions['Idle'];
            if (idleAction) {
                const clip = idleAction.getClip();
                const action = mixer.clipAction(clip);
                action.play();
            }

            scene.add(clone);

            // Clone materials for independent fading
            clone.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.opacity = 1;
                }
            });

            teamClones.push(clone);
            teamMixers.push(mixer);

            // Tween Position (Arc)
            const targetPos = {
                x: manModel.position.x + config.xOffset,
                y: manModel.position.y,
                z: manModel.position.z + config.zOffset
            };

            group.add(new Tween(clone.position)
                .to(targetPos, 1000)
                .easing(Easing.Quadratic.Out)
                .start());

            // Tween Rotation (Face Center)
            const targetRot = { y: manModel.rotation.y + config.rotateY };
            group.add(new Tween(clone.rotation)
                .to(targetRot, 1000)
                .easing(Easing.Quadratic.Out)
                .start());
        });

    } else if (param !== 'team' && teamClones.length > 0) {
        // Cleanup all clones
        const clonesToRemove = [...teamClones];
        teamClones = []; // Clear global array immediately
        teamMixers = [];

        clonesToRemove.forEach((clone) => {
            let opacity = { value: 1 };
            group.add(new Tween(opacity)
                .to({ value: 0 }, 500)
                .easing(Easing.Quadratic.Out)
                .onUpdate(() => {
                    clone.traverse((child) => {
                        if (child.isMesh) {
                            child.material.opacity = opacity.value;
                        }
                    });
                })
                .onComplete(() => {
                    scene.remove(clone);
                    clone.traverse((child) => {
                        if (child.isMesh) {
                            child.geometry.dispose();
                            child.material.dispose();
                        }
                    });
                })
                .start());
        });
    }

    // Mobile Visibility Logic
    if (isMobile()) {
        if (param !== 'home') {
            // Hide model and props on mobile for non-home pages
            if (manModel) manModel.visible = false;
            if (chair) chair.visible = false;
            if (table) table.visible = false;
            if (apple) apple.visible = false;
            if (dumbell) dumbell.visible = false;
            // Also hide team clones if any (though they should be cleaned up by logic above)
            teamClones.forEach(clone => clone.visible = false);
        } else {
            // Show model on home
            if (manModel) manModel.visible = true;
            // Props are hidden by default position usually, but ensure visibility is true so they can appear if needed
            if (chair) chair.visible = true;
            if (table) table.visible = true;
            if (apple) apple.visible = true;
            if (dumbell) dumbell.visible = true;
        }
    } else {
        // Desktop/Tablet: Ensure everything is visible
        if (manModel) manModel.visible = true;
        if (chair) chair.visible = true;
        if (table) table.visible = true;
        if (apple) apple.visible = true;
        if (dumbell) dumbell.visible = true;
        teamClones.forEach(clone => clone.visible = true);
    }
}

window.transition = transition;

animate();
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    if (teamMixers.length > 0) {
        teamMixers.forEach(m => m.update(delta));
    }

    group.update();

    // Scroll fade for mobile
    // if (isMobile()) {
    //   scrollObjects.forEach(obj => {
    //     const targetZ = zStart + (zEnd - zStart) * scrollProgress;
    //     obj.position.z += (targetZ - obj.position.z) * 0.1; // lerp
    //   });
    // }


    if (window.innerWidth <= 1024) {
        const targetZ = 12 + scrollProgress * 15; // from z=20 to z=35
        camera.position.z += (targetZ - camera.position.z) * 0.1; // lerp smoothing
    }

    // 5. calculate and display the vector values on screen
    // this copies the camera's unit vector direction to cameraDirection
    camera.getWorldDirection(cameraDirection)
    // scale the unit vector up to get a more intuitive value
    cameraDirection.set(cameraDirection.x * 100, cameraDirection.y * 100, cameraDirection.z * 100)
    // update the onscreen spans with the camera's position and lookAt vectors
    camPositionSpan.innerHTML = `Position: (${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)})`;
    camLookAtSpan.innerHTML = `LookAt: (${(camera.position.x + cameraDirection.x).toFixed(1)}, ${(camera.position.y + cameraDirection.y).toFixed(1)}, ${(camera.position.z + cameraDirection.z).toFixed(1)})`;
    if (useFly) {
        Flycontrols.update(0.01);
    }
    else {
        controls.update();
    }
    renderer.render(scene, camera);
}