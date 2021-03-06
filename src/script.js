import "./style.scss";
import * as THREE from "three";
import gsap from "gsap";
import CANNON from "cannon";

import { Howl, Howler } from "howler";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "lil-gui";

import { lights } from "./js/lights";
import { ambientSound, soundsSetup } from "./js/sounds";
import { getDistanceFromCenter } from "./js/distance";
import { teleportDistance, move } from "./js/controls";
import { controlPad } from "./js/controlPad";
import { cameraSetup } from "./js/camera";
import { floor } from "./js/floor";
import { wallsSetup } from "./js/walls";
import { roof } from "./js/roof";
import { bushes } from "./js/bushes";
import { graves } from "./js/graves";
import { door } from "./js/door";
import { ghosts } from "./js/ghosts";
import { fogSetup } from "./js/fog";
import { bricksSetup } from "./js/bricks";
import { destructableWallSetup } from "./js/destructableWall";

import { createGhost } from "./js/ghost";
import { particlesSetup } from "./js/particles";
import { physicsSetup } from "./js/physics";

import { loaderSetup } from "./js/loader";

import { createSphere } from "./js/createSphere";
import { createBox, createBoxBody } from "./js/createBox";

import { collisionFilterGroups } from "./environments";

const { FLOOR, BRICKS, HOUSE, GHOST } = collisionFilterGroups;

var initializeDomEvents = require("threex-domevents");
var THREEx = {};
initializeDomEvents(THREE, THREEx);

//require("html-loader?interpolate=require!./index.html");

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector(".webgl");

// Scene
const scene = new THREE.Scene();

//Loader
const manager = loaderSetup();

//GLTFLoader
const loader = new GLTFLoader(manager);

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader(manager);

/**
 * House
 */

// Floor
floor({ textureLoader, scene });

// PARTICLES
const particles = particlesSetup({ scene });

/**
 * Lights
 */
lights({ intensity: 0.12, gui, scene });

gui.destroy();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio * 0.5);
});

//PHYSICS
const { defaultMaterial, plasticMaterial, world } = physicsSetup();

const { body: ghostBody, mesh: ghostMesh } = createSphere(
  0.8,
  new THREE.Vector3(0, 0, 4),
  100,
  defaultMaterial,
  2,
  4,
  world,
  scene
);

scene.remove(ghostMesh);

const ghost = createGhost({ scene });

/**
 * Camera
 */
const camera = cameraSetup({ ghost, sizes, canvas, scene });

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  powerPreference: "high-performance",
  antialiasing: false,
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor("#262837");
renderer.shadowMap.enabled = true;

//renderer.shadowMap.type = THREE.PCFShadowMap;
//renderer.physicallyCorrectLights = true;

/* document.querySelector("#toggle-shadow-btn").addEventListener("click", () => {
  renderer.shadowMap.enabled = !renderer.shadowMap.enabled;
  renderer.clear();
}); */

const domEvents = new THREEx.DomEvents(camera, canvas);

export const bricks = bricksSetup({
  ghostBody,
  textureLoader,
  defaultMaterial,
  world,
  scene,
});

const destructableWalls = [];

/* destructableWalls.push(
  destructableWallSetup({
    x: 3,
    z: 3,
    wallLenght: 6,
    wallHeight: 5,
    ghostBody,
    textureLoader,
    defaultMaterial,
    world,
    scene,
  })
);

destructableWalls.push(
  destructableWallSetup({
    x: -6,
    z: 5,
    wallLenght: 6,
    wallHeight: 5,
    ghostBody,
    textureLoader,
    defaultMaterial,
    world,
    scene,
  })
); */

//HOUSE
const house = new THREE.Group();
scene.add(house);

//WALLS
const { walls, wallsBody } = wallsSetup({
  textureLoader,
  house,
  defaultMaterial,
  world,
});

// Roof
//roof({ textureLoader, house });

// Door
//door({ textureLoader, house });

// Bushes
//bushes({ loader, scene });

// Graves
/* const gravesArray = graves({
  domEvents,
  textureLoader,
  loader,
  ghostBody,
  defaultMaterial,
  world,
  scene,
}); */

const gravesArray = [];

loader.load("models/graveyard.glb", (glb) => {
  const graveyard = glb.scene;

  graveyard.position.set(0, 0, 0);
  graveyard.scale.set(2, 2, 2);

  let i = 0;

  graveyard.traverse((el) => {
    const { name, position } = el;

    el.castShadow = true;

    if (name.includes("grave")) {
      gravesArray[i] = {};

      gravesArray[i].grave = el;

      const body = createBoxBody(
        0.8,
        0.5,
        0.6,
        position,
        100000,
        defaultMaterial,
        GHOST,
        FLOOR | BRICKS,
        world
      );

      gravesArray[i].body = body;

      gravesArray[i].floatHeight = Math.random() / 4;
      i++;
    } else if (name.includes("place")) {
      el.castShadow = false;
    }
  });

  scene.add(graveyard);
});

// Door light
const doorLight = new THREE.PointLight("#ff7d46", 1, 7);
doorLight.position.set(0, 2, 2);

doorLight.castShadow = false;

scene.add(doorLight);

// Ghosts
const { ghost1, ghost2, ghost3 } = ghosts({ scene });

// FOG
export const fog = fogSetup({ scene });

/**
 * Sounds
 */
soundsSetup();

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

let lastCalledTime = 0;
let fps = 0;

let counterFPS = [0];
let averageFPS = 0;

let loadingTime = 0;

const removeBricks = (division) =>
  bricks.map(
    ({ brick, brickBody }, i) =>
      i < bricks.length / division &&
      (scene.remove(brick), world.remove(brickBody))
  );

const removeBricksHitSound = () =>
  bricks.map(({ brickHitSound }) => brickHitSound.unload());

const calculateFPS = () => {
  const elapsedTime = clock.getElapsedTime();

  //console.log(counterFPS);

  document.querySelector(".loader").style.display !== "none" &&
    (loadingTime = elapsedTime);

  if (elapsedTime <= loadingTime) {
    if (!lastCalledTime) {
      lastCalledTime = Date.now();
      fps = 0;
      return;
    }

    let delta = (Date.now() - lastCalledTime) / 1000;
    lastCalledTime = Date.now();
    fps = 1 / delta;
    counterFPS.push(Math.round(fps));

    const sumAllFPS = counterFPS.reduce((count, value) => count + value, 0);
    averageFPS = (sumAllFPS / counterFPS.length).toFixed(2);
  } else {
    document.querySelector("#fps-counter").innerHTML = averageFPS;

    if (averageFPS > 20 && averageFPS < 30) {
      renderer.setPixelRatio(devicePixelRatio * 0.8);
      ghost.castShadow = true;

      removeBricksHitSound();
      removeBricks(2);
    } else if (averageFPS < 20) {
      renderer.setPixelRatio(devicePixelRatio * 0.5);
      ghost.castShadow = false;

      fog.far = 18;

      removeBricksHitSound();
      removeBricks(1.4);
    } else {
      renderer.setPixelRatio(devicePixelRatio);
      ghost.castShadow = true;

      fog.far = 12;
    }
  }
};

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  calculateFPS();

  ambientSound.volume(getDistanceFromCenter(ghost, teleportDistance));

  //CONTROL PAD
  if (controlPad.style.position === "absolute") {
    const moveFieldSize = 120;

    const controlPadStyle = controlPad.style;

    const controlPadY = controlPadStyle.bottom.substring(
      0,
      controlPadStyle.bottom.indexOf("px")
    );

    const controlPadX = controlPadStyle.left.substring(
      0,
      controlPad.style.left.indexOf("px")
    );

    move(
      (controlPadY - moveFieldSize / 2) / (moveFieldSize / 2) / 2,
      -(controlPadX - moveFieldSize / 2) / (moveFieldSize / 2) / 2
    );
  }

  // Update physics
  world.step(1 / 60, deltaTime, 3);

  bricks.map(({ brick, brickBody }) => {
    brick.position.copy(brickBody.position);
    brick.quaternion.copy(brickBody.quaternion);
  });

  destructableWalls.map((destructableWall) =>
    destructableWall.map(({ brick, brickBody }) => {
      brick.position.copy(brickBody.position);
      brick.quaternion.copy(brickBody.quaternion);
    })
  );

  //GHOST BODY
  ghostMesh.position.copy(ghostBody.position);
  ghostBody.sleep();

  ghostBody.position.copy(ghost.position);
  ghostBody.position.y = 0.2;

  //ghostBody.sleep();

  //CAMERA LOOK
  camera.lookAt(ghost.position);

  //WALL COLLISION
  // wallsBody.position.copy(walls.position);
  // wallsBody.quaternion.copy(walls.quaternion);

  // wallsBody.sleep();

  //GRAVE FLOATING
  gravesArray.map(({ grave, body, floatHeight }) => {
    grave.position.copy(body.position);
    //grave.quaternion.copy(body.quaternion);

    grave.position.y =
      body.position.y + floatHeight + Math.sin(elapsedTime) / 10;
  });

  particles.rotation.y = elapsedTime * 0.01;
  particles.rotation.z = elapsedTime * 0.01;

  // Ghosts
  const ghost1Angle = elapsedTime * 0.5;
  ghost1.position.x = Math.cos(ghost1Angle) * 4;
  ghost1.position.z = Math.sin(ghost1Angle) * 4;
  ghost1.position.y = Math.sin(elapsedTime * 3);

  const ghost2Angle = -elapsedTime * 0.32;
  ghost2.position.x = Math.cos(ghost2Angle) * 5;
  ghost2.position.z = Math.sin(ghost2Angle) * 5;
  ghost2.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5);

  const ghost3Angle = -elapsedTime * 0.18;
  ghost3.position.x =
    Math.cos(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.32));
  ghost3.position.z = Math.sin(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.5));
  ghost3.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5);

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
