import { Mesh, SphereGeometry, MeshBasicMaterial } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class TargetOrbitControlMesh {
  constructor(orbitControls) {
    /**@type {OrbitControls} */
    this.orbitControls = orbitControls;

    /** @type {Mesh} */
    this.mesh = new Mesh(
      new SphereGeometry(),
      new MeshBasicMaterial({ color: 'red' })
    );

    this.mesh.name = 'target_orbit_controls';

    this.orbitControls.addEventListener('change', () => {
      this.update();
    });

    this.update();
  }

  update() {
    this.mesh.position.copy(this.orbitControls.target.clone());
    const scale =
      this.orbitControls.object.position.distanceTo(this.orbitControls.target) /
      150;
    this.mesh.scale.set(scale, scale, scale);
    this.mesh.updateMatrixWorld();
  }
}
