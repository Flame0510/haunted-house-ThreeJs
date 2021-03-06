import * as THREE from "three";
import gsap from "gsap";

import { camera } from "./camera";
import { ghost } from "./ghost";
import { fog } from "../script";

import { Howl } from "howler";

const horrorHit = new Howl({
  src: ["sounds/horror-hit.mp3"],
  html5: true,
});

export const teleportDistance = 18;

let isTeleporting = false;

export const move = (forwardVelocity = 0, leftVelocity = 0) => {
  let direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  document.querySelector(".loader").style.display === "none" &&
    gsap.to(".help", {
      opacity: 0,
      display: "none",

      duration: 0.5,
    });

  const outmapMessage = document.querySelector(".outmap-message-container");

  const teleport = ({ x, z }) => {
    !isTeleporting && horrorHit.play();

    isTeleporting = true;

    gsap
      .timeline({ onComplete: () => (isTeleporting = false) })
      .to(
        fog,
        {
          far: 1,
          duration: 1,
        },
        0
      )
      .to(
        outmapMessage,
        {
          display: "flex",
          opacity: 1,
          delay: 0.2,
          duration: 1,
        },
        0
      )
      .to(
        ghost.position,
        {
          x,
          z,
          duration: 0,
        },
        0
      )
      .to(
        fog,
        {
          far: 12,
          duration: 1,
        },
        1
      )
      .to(
        outmapMessage,
        {
          display: "none",
          opacity: 0,
          duration: 1,
        },
        1
      );
  };

  switch (true) {
    case ghost.position.z < -teleportDistance:
      teleport({ x: -ghost.position.x, z: teleportDistance - 4 });
      break;

    case ghost.position.z > teleportDistance:
      teleport({ x: -ghost.position.x, z: -teleportDistance + 4 });
      break;

    case ghost.position.x < -teleportDistance:
      teleport({ x: teleportDistance - 4, z: -ghost.position.z });
      break;

    case ghost.position.x > teleportDistance:
      teleport({ x: -teleportDistance + 4, z: -ghost.position.z });
      break;

    default:
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
  }
};
