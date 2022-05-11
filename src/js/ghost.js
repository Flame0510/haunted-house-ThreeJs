import * as THREE from "three";

export let ghost;

export const createGhost = ({ scene }) => {
  ghost = new THREE.PointLight("#ffffff", 2, 3);
  scene.add(ghost);

  return ghost;
};