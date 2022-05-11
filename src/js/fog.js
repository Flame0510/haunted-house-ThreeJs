import * as THREE from "three";

export const fog = ({ scene }) => {
  const fog = new THREE.Fog("#262837", 1, 15);
  scene.fog = fog;
};