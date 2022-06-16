import * as THREE from "three";
import gsap from "gsap";

import { camera, controls } from "./camera.js";
import { ghost } from "./ghost.js";

export const move = (forwardVelocity = 0, leftVelocity = 0) => {
  let direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  gsap.to(ghost.position, {
    x:
      ghost.position.x +
      forwardVelocity * direction.x +
      leftVelocity * direction.z,
    z:
      ghost.position.z +
      forwardVelocity * direction.z -
      leftVelocity * direction.x,
  });
};
