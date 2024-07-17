import {
  createLocalStorageCheckbox,
  createLocalStorageDetails,
} from '@ud-viz/utils_browser';

import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { PlanarView } from 'itowns';
import {
  Vector3,
  Matrix3,
  Plane,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  DoubleSide,
} from 'three';

export class ClippingPlane {
  constructor(itownsView) {
    this.plane = new Plane();

    /**@type {PlanarView} */
    this.itownsView = itownsView;

    this.UI = {};

    /**@type {TransformControls} */
    this.transformControls = null;

    /**@type {Mesh} */
    this.quad = null;

    this.initUI();
    this.initQuad();
    this.initTransformControls();
    this.initCallback();
  }

  initUI() {
    this.UI.details = createLocalStorageDetails(
      'clipping_plane_local_storage_key_point_cloud_visualizer',
      'Clipping plane',
      null
    );

    this.UI.details.planeVisible = createLocalStorageCheckbox(
      'plane_visibility_key_loacal_storage',
      'Visible: ',
      this.UI.details,
      true
    );

    this.UI.details.clippingEnable = createLocalStorageCheckbox(
      'plane_enable_key_loacal_storage',
      'Enable: ',
      this.UI.details
    );
  }

  initQuad() {
    this.quad = new Mesh(
      new PlaneGeometry(),
      new MeshBasicMaterial({
        opacity: 0.5,
        transparent: true,
        side: DoubleSide,
      })
    );

    this.quad.name = 'quadOfClippingPlane';
  }

  update() {
    this.plane.normal.copy(
      new Vector3(0, 0, 1).applyNormalMatrix(
        new Matrix3().getNormalMatrix(this.quad.matrixWorld)
      )
    );
    // quad.position belongs to plane => quad.position.dot(plane.normal) = -constant
    this.plane.constant = -(
      this.plane.normal.x * this.quad.position.x +
      this.plane.normal.y * this.quad.position.y +
      this.plane.normal.z * this.quad.position.z
    );
  }

  initTransformControls() {
    this.transformControls = new TransformControls(
      this.itownsView.camera.camera3D,
      this.itownsView.mainLoop.gfxEngine.label2dRenderer.domElement
    );

    this.transformControls.addEventListener('change', this.update.bind(this));

    this.update();

    this.itownsView.scene.add(this.transformControls);

    const addButtonMode = (mode) => {
      const buttonMode = document.createElement('button');
      buttonMode.innerText = mode;
      this.UI.details.appendChild(buttonMode);

      buttonMode.onclick = () => {
        this.transformControls.setMode(mode);
      };
    };
    addButtonMode('translate');
    addButtonMode('rotate');
    addButtonMode('scale');
  }

  initCallback() {
    this.UI.details.planeVisible.addEventListener('change', (event) => {
      this.quad.visible = event.target.checked;
      if (this.quad.visible) {
        this.transformControls.attach(this.quad);
      } else {
        this.transformControls.detach();
      }
      this.transformControls.updateMatrixWorld();
      this.itownsView.notifyChange();
    });

    this.UI.details.clippingEnable.addEventListener('change', (event) => {
      this.itownsView.mainLoop.gfxEngine.renderer.localClippingEnabled =
        event.target.checked;
      this.itownsView.notifyChange();
    });
  }
}
