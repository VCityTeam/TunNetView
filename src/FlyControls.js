import { Euler, Vector2, Vector3 } from 'three';
import { PlanarView } from 'itowns';
import { RequestAnimationFrameProcess } from '@ud-viz/utils_browser';

/**
 * @classdesc Provides free-fly controls for a camera using mouse and keyboard input.
 */
export class FlyControls {
  /**
   * @param {PlanarView} view - The camera to control.
   */
  constructor(view) {
    this.camera = view.camera.camera3D;
    this.camera.rotation.reorder('ZYX');

    this.domElement = view.domElement;
    this.itownsView = view;
    this.isLocked = false;

    this.speed = 1;
    this.mouseSensitivity = 1;

    this.translateAxis = new Vector3();
    this._enabled = true;

    this.listeners = {};

    this.process = new RequestAnimationFrameProcess(30);
  }

  start() {
    this.addListeners();
    this.process.start((dt) => {
      this.moveCamera(dt);
      this.itownsView.notifyChange(this.camera);
    });
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(value) {
    this._enabled = value;
    if (value) {
      this.process.pause = false;
      this.addListeners();
    } else {
      this.process.pause = true;

      this.removeListeners();
    }
  }

  addListeners() {
    this.listeners['click'] = () => {
      this.domElement.requestPointerLock();
    };
    this.domElement.addEventListener('click', this.listeners['click']);

    this.listeners['pointerlockchange'] = () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    };
    document.addEventListener(
      'pointerlockchange',
      this.listeners['pointerlockchange']
    );

    this.listeners['mousemove'] = (event) => {
      if (this.isLocked === false) return;

      this.camera.rotation.x -= event.movementY / 500;
      this.camera.rotation.z -= event.movementX / 500;
    };
    this.domElement.addEventListener('mousemove', this.listeners['mousemove']);

    this.listeners['keydown'] = (event) => {
      if (['ArrowUp', 'z', 'w'].includes(event.key)) {
        this.translateAxis.z = -1;
      }
      if (['ArrowDown', 's'].includes(event.key)) {
        this.translateAxis.z = 1;
      }
      if (['ArrowLeft', 'a', 'q'].includes(event.key)) {
        this.translateAxis.x = -1;
      }
      if (['ArrowRight', 'd'].includes(event.key)) {
        this.translateAxis.x = 1;
      }
      if (['Shift'].includes(event.key)) {
        this.speed = 3;
      }
    };
    this.domElement.addEventListener('keydown', this.listeners['keydown']);

    this.listeners['keyup'] = (event) => {
      if (event.key == 'Shift') {
        this.speed = 1;
      } else {
        this.translateAxis.set(0, 0, 0);
      }
    };
    this.domElement.addEventListener('keyup', this.listeners['keyup']);
  }

  removeListeners() {
    this.domElement.removeEventListener('click', this.listeners['click']);
    document.removeEventListener(
      'pointerlockchange',
      this.listeners['pointerlockchange']
    );
    this.domElement.removeEventListener(
      'mousemove',
      this.listeners['mousemove']
    );
    this.domElement.removeEventListener('keydown', this.listeners['keydown']);
    this.domElement.removeEventListener('keyup', this.listeners['keyup']);
  }
  moveCamera() {
    this.camera.translateOnAxis(this.translateAxis, this.speed);
  }
}
