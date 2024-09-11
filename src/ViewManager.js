import { PlanarView } from 'itowns';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class ViewManager {
  constructor(extent, options) {
    /** @type {HTMLElement} */
    this.domElement = document.createElement('div');
    /** @type {PlanarView} */
    this.itownsView;
    this.orbitControls;

    this.initView(extent, options);
    this.setupOrbitControls(extent);
  }

  initView(extent, options) {
    /**
     * `this.domElement` has be added to the DOM in order to compute its dimension
     * this is necessary because the itowns.PlanarView need these dimension in order to be initialized correctly
     */
    if (options.parentDomElement instanceof HTMLElement) {
      options.parentDomElement.appendChild(this.domElement);
    } else {
      document.body.appendChild(this.domElement);
    }

    if (options.domElementClass)
      this.domElement.classList.add(options.domElementClass);

    /** @type {PlanarView} */
    this.itownsView = new PlanarView(this.domElement, extent, {
      maxSubdivisionLevel: options.maxSubdivisionLevel || 2,
      noControls: true,
    });
  }

  setupOrbitControls(extent) {
    /** @type {OrbitControls} */
    this.orbitControls = new OrbitControls(
      this.itownsView.camera.camera3D,
      this.itownsView.mainLoop.gfxEngine.label2dRenderer.domElement
    );
    this.orbitControls.target.copy(extent.center().toVector3().clone());
    this.orbitControls.addEventListener('change', () => {
      this.itownsView.notifyChange(this.itownsView.camera.camera3D);
    });
  }
}
