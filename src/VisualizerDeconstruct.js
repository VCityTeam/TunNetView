import { MAIN_LOOP_EVENTS } from 'itowns';
import { Scene, PointsMaterial, Box3, Raycaster, Vector3 } from 'three';
import {
  computeNearFarCamera,
  RequestAnimationFrameProcess,
} from '@ud-viz/utils_browser';

import { ClippingPlane } from './ClippingPlane';
import { TargetOrbitControlMesh } from './TargetOrbitControlMesh';
import { ViewManager } from './ViewManager';
import { LayerManager } from './LayerManager';
import { setUpCameraDefaults } from './cameraSetup';
import { setupLoadingUI, setUpSpeedControls, setUpTargetDrag } from './uiSetup';
import { Measure } from './Measure';

/**
 * @typedef {object} LayerConfig
 * @property {string} name - name of C3DTilesLayer
 * @property {object} source - C3DTilesLayer source
 * @property {string} source.url - url to the tileset.json
 */
export class VisualizerDeconstruct {
  /**
   *
   * Note: options.camera.default.quaternion is not available option since the camera
   * is initialized as pointing towards the center of the bounding box of the
   * observed 3DTiles.
   *
   * @param {import("itowns").Extent} extent - itowns extent
   * @param {Array<LayerConfig>} layerConfigs - points cloud layer params
   * @param {object} options - options
   * @param {HTMLElement} options.parentDomElement - where to append planar view domelement
   * @param {string} options.domElementClass - css class to apply to this.domElement
   * @param {Array<string>} options.c3DTilesLoadingDomElementClasses - css classes to apply to c3DTilesLoadingDomElement
   * @param {object} options.camera - options camera
   * @param {object} options.camera.default - options camera default
   * @param {object} options.camera.default.position - options camera default position
   * @param {number} options.maxSubdivisionLevel - default points cloud size
   * @param {number} options.defaultPointCloudSize - default points cloud size
   * @param {number} [options.raycasterPointsThreshold=VisualizerDeconstruct.RAYCASTER_POINTS_THRESHOLD] - raycaster points treshold
   * @param {number} [options.measure] - add measure tool
   */
  constructor(extent, layerConfigs, options = {}) {
    /** @type {Raycaster} */
    this.raycaster = new Raycaster();

    /** @type{ViewManager} */
    this.viewManager = new ViewManager(extent, options);

    /** @type {Scene} */
    this.topScene = new Scene();
    this.itownsView.mainLoop.gfxEngine.renderer.autoClear = false;
    this.itownsView.render = () => {
      this.itownsView.mainLoop.gfxEngine.renderer.clear(); // clear buffers
      this.itownsView.mainLoop.gfxEngine.renderer.render(
        this.itownsView.scene,
        this.itownsView.camera.camera3D
      ); // render scene 1
      this.itownsView.mainLoop.gfxEngine.renderer.clearDepth(); // clear depth buffer
      this.itownsView.mainLoop.gfxEngine.renderer.render(
        this.topScene,
        this.itownsView.camera.camera3D
      ); // render scene 2
    };

    /** @type {ClippingPlane} */
    this.clippingPlane = new ClippingPlane(this.itownsView);

    this.layerManager = new LayerManager(
      layerConfigs,
      this.viewManager.itownsView,
      new PointsMaterial({
        size:
          options.defaultPointCloudSize ||
          VisualizerDeconstruct.DEFAULT_POINT_SIZE,
        vertexColors: true,
        clippingPlanes: [this.clippingPlane.plane],
      })
    );

    this.targetOrbitControlsMesh = new TargetOrbitControlMesh(
      this.viewManager.orbitControls
    );
    this.topScene.add(this.targetOrbitControlsMesh.mesh);

    setUpCameraDefaults(
      this.viewManager.itownsView,
      this.viewManager.orbitControls,
      this.layerManager.layers,
      options
    );

    this.c3DTilesLoadingDomElement = setupLoadingUI(
      this.viewManager.domElement,
      this.layerManager.layers,
      this.viewManager.itownsView,
      options
    );

    // different control speed
    this.domElementSpeedControls = setUpSpeedControls(
      this.viewManager.orbitControls
    );

    // move orbit control target
    this.domElementTargetDragElement = setUpTargetDrag();

    this.viewManager.itownsView.scene.add(this.layerManager.globalBBMesh);

    /** @type {Measure} */
    this.measure = null;
    if (options.measure) {
      {
        this.measure = new Measure(
          this.viewManager.itownsView,
          this.layerManager
        );

        this.topScene.add(this.measure.group);

        window.addEventListener('keyup', (event) => {
          if (event.key == 'Escape') {
            measure.leaveMeasureMode();
          }
        });

        this.measure.update();
      }
    }

    this.viewManager.itownsView.scene.add(this.clippingPlane.quad);

    this.clippingPlane.quad.position.set(
      extent.center().x,
      extent.center().y,
      300
    );

    this.clippingPlane.quad.scale.set(1000, 1000, 1000);

    const transformControlsProcess = new RequestAnimationFrameProcess(30);

    this.clippingPlane.transformControls.addEventListener(
      'dragging-changed',
      (event) => {
        this.viewManager.orbitControls.enabled = !event.value;
      }
    );

    // need to tick the rendering when quad visible since it's necessary to render due to the transform control and the camera is not moving
    transformControlsProcess.start(() => {
      if (!this.clippingPlane.quad.visible) return;
      this.clippingPlane.transformControls.updateMatrixWorld();
      this.viewManager.itownsView.render();
    });

    // compute dynamically near and far
    this.viewManager.itownsView.addFrameRequester(
      MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE,
      () => {
        const bb = new Box3().setFromObject(this.viewManager.itownsView.scene);
        computeNearFarCamera(
          this.viewManager.itownsView.camera.camera3D,
          bb.min,
          bb.max
        );
      }
    );

    // redraw
    this.viewManager.itownsView.notifyChange(
      this.viewManager.itownsView.camera.camera3D
    );
  }

  /**
   *
   * @param {Vector3} destPosition - destination position of the camera
   * @param {Vector3} destTarget - destination target of the orbit controls
   * @param {number} duration - duration in ms
   * @returns {Promise} - promise resolving when the camera has moved
   */
  moveCamera(destPosition, destTarget, duration = 1500) {
    if (!destPosition)
      destPosition =
        this.viewManager.itownsView.camera.camera3D.position.clone();
    if (!destTarget) destTarget = this.viewManager.orbitControls.target.clone();
    const startCameraPosition =
      this.viewManager.itownsView.camera.camera3D.position.clone();
    const startCameraTargetPosition = this.orbitControls.target.clone();

    this.targetOrbitControlsMesh.visible = false;

    this.viewManager.orbitControls.enabled = false;
    const process = new RequestAnimationFrameProcess(30);

    let currentDuration = 0;

    return new Promise((resolve) => {
      process.start((dt) => {
        currentDuration += dt;
        const ratio = Math.min(Math.max(0, currentDuration / duration), 1);

        this.viewManager.itownsView.camera.camera3D.position.lerpVectors(
          startCameraPosition,
          destPosition,
          ratio
        );

        this.viewManager.orbitControls.target.lerpVectors(
          startCameraTargetPosition,
          destTarget,
          ratio
        );

        this.viewManager.orbitControls.update();

        if (ratio == 1) {
          this.viewManager.orbitControls.enabled = true;
          this.targetOrbitControlsMesh.visible = true;
          process.stop();
          resolve();
        }
      });
    });
  }

  get itownsView() {
    return this.viewManager.itownsView;
  }

  get orbitControls() {
    return this.viewManager.orbitControls;
  }

  get layers() {
    return this.layerManager.layers;
  }

  static get DEFAULT_POINT_SIZE() {
    return 0.03;
  }

  static get TARGET_LOCAL_STORAGE_KEY() {
    return 'target_local_storage_key_point_cloud_visualizer';
  }

  static get CAMERA_LOCAL_STORAGE_KEY() {
    return 'camera_local_storage_key_point_cloud_visualizer';
  }

  static get CLIPPING_PLANE_LOCAL_STORAGE_KEY() {
    return 'clipping_plane_local_storage_key_point_cloud_visualizer';
  }

  static get RAYCASTER_POINTS_THRESHOLD() {
    return 0.01;
  }
}
