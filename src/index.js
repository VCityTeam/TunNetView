import * as proj4 from 'proj4';
import * as itowns from 'itowns';
import * as THREE from 'three';
import {
  loadMultipleJSON,
  RequestAnimationFrameProcess,
} from '@ud-viz/utils_browser';
import { LayerChoice } from '@ud-viz/widget_layer_choice';
import { C3DTiles } from '@ud-viz/widget_3d_tiles';
import { initScene } from '@ud-viz/utils_browser';
import { Visualizer } from '@ud-viz/visualizer';

import { loadCavePath } from './LoadCavePath';
import { RailControls } from './RailControls';
import { CameraController } from './CameraController';
import { buildPoint, findStart } from './Point';
import { isCameraUnderPlanar } from './utilsCamera';
import { FlyControls } from './FlyControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// The PointCloudVisualizer widget stores the current camera position within
// the local storage so that the rendering remains unchanged on scene reload.
// Inhibit this feature for the time being.
localStorage.clear();

const configs = await loadMultipleJSON([
  './assets/config/extents.json',
  './assets/config/crs.json',
  './assets/config/layer/3DTiles.json',
  './assets/config/layer/elevation.json',
  './assets/config/layer/base_maps.json',
  './assets/config/point.json',
  './assets/config/geo_offset.json',
]);

let GLOBAL_OFFSET = new THREE.Vector3();
await fetch(configs.geo_offset.url, {
  method: 'GET',
})
  .then((t) => t.text())
  .then((response) => {
    GLOBAL_OFFSET.copy(
      new THREE.Vector3(...response.split(/\s{1,}/).map(Number))
    );
  });
proj4.default.defs(configs['crs'][0].name, configs['crs'][0].transform);

/////////////////////////////////////////////////////////////////////////
// The application is build on top of the Visualizer() class

// Default size at which any point of the point cloud shall be rendered.
// This should not be a constant but it should depend on the point cloud
// bounding box size and some "density" criteria of the points within that
// bounding box.
const DEFAULT_POINT_SIZE = 0.1;

// The geographical extent is set through the configuration files
const extent = new itowns.Extent(
  configs['extents'][0].name,
  parseInt(configs['extents'][0].west),
  parseInt(configs['extents'][0].east),
  parseInt(configs['extents'][0].south),
  parseInt(configs['extents'][0].north)
);

// The point cloud that the application proposes to explore is by default
// the one designated by the 3DTiles.json asset file:
const layersConfigs = configs['3DTiles'];

///// Eventually, create the PointCloudVisualizer "application" with all
// the above parameters.
const app = new Visualizer(extent, layersConfigs, {
  parentDomElement: document.body,
  domElementClass: 'full_screen',
  defaultPointCloudSize: DEFAULT_POINT_SIZE,
  maxSubdivisionLevel: 7,
  c3DTilesLoadingDomElementClasses: ['centered', 'loading'],
  camera: {
    default: {
      position: {
        x: 1841881.83,
        y: 5175148.7,
        z: 300.0,
      },
    },
  },
  measure: true,
});

//////////////////////////////////////////////////////////////////////
// Add the layers required by the scene
// Start with the elevation layer
const isTextureFormat =
  configs['elevation']['format'] == 'image/jpeg' ||
  configs['elevation']['format'] == 'image/png';
app.itownsView.addLayer(
  new itowns.ElevationLayer(configs['elevation']['layer_name'], {
    useColorTextureElevation: isTextureFormat,
    colorTextureElevationMinZ: isTextureFormat
      ? configs['elevation']['colorTextureElevationMinZ']
      : null,
    colorTextureElevationMaxZ: isTextureFormat
      ? configs['elevation']['colorTextureElevationMaxZ']
      : null,
    source: new itowns.WMSSource({
      extent: extent,
      url: configs['elevation']['url'],
      name: configs['elevation']['name'],
      crs: extent.crs,
      heightMapWidth: 256,
      format: configs['elevation']['format'],
    }),
  })
);

// Add basemaps
configs['base_maps'].forEach((baseMapConfig) => {
  app.itownsView.addLayer(
    new itowns.ColorLayer(baseMapConfig.name, {
      updateStrategy: {
        type: itowns.STRATEGY_DICHOTOMY,
        options: {},
      },
      name: baseMapConfig.name,
      source: new itowns.WMSSource({
        extent: extent,
        name: baseMapConfig.source.name,
        url: baseMapConfig.source.url,
        version: baseMapConfig.source.version,
        crs: extent.crs,
        format: baseMapConfig.source.format,
      }),
      transparent: true,
    })
  );
});

// Add surfacic/triangulation 3D_tiles
// PointCloudVisualizer widget deals with 3DTiles that package point clouds.
// Addding 3DTiles that package triangulation/surfaces must be done
// separatly because e.g. the PointCloudVisualizer widget  doesn't require
// the setting of an ambiant light (points do not need to be lit by ambiant
// lights but are just colored vertices).
// const c3dTilesLayers = [];
// configs['3DTiles'].forEach((layerConfig) => {
//   const layer = new itowns.C3DTilesLayer(
//     layerConfig['id'],
//     {
//       name: layerConfig['id'],
//       source: new itowns.C3DTilesSource({
//         url: layerConfig['url'],
//       }),
//     },
//     app.itownsView
//   );
//   itowns.View.prototype.addLayer.call(app.itownsView, layer);
//   c3dTilesLayers.push(layer);
// });

// initScene() is here used on the sole purpose of defining an ambient light.
initScene(
  app.itownsView.camera.camera3D,
  app.itownsView.mainLoop.gfxEngine.renderer,
  app.itownsView.scene
);

const initLayerPromise = new Promise((resolve) => {
  app.itownsView.addEventListener(itowns.VIEW_EVENTS.LAYERS_INITIALIZED, () => {
    resolve();
  });
});

await loadingScreen(['TUNNETVIEW'], initLayerPromise);

/////////////////////////////////////////////////////////////////////////
// Build the ui (with the help of widgets)
const ui = document.createElement('div');
ui.classList.add('ui');
document.body.appendChild(ui);

///// Mouse speed controls
ui.appendChild(app.domElementSpeedControls);
// drag element
ui.appendChild(app.targetOrbitControlsMesh.domElement);
// measure
if (app.measure) ui.appendChild(app.measure.domElement);

// Test for keep old visualizer API
const clippingPlaneDomElement =
  app.clippingPlane && app.clippingPlane.domElement
    ? app.clippingPlane.domElement
    : app.clippingPlaneDetails
    ? app.clippingPlaneDetails
    : null;
// camera near far
if (clippingPlaneDomElement) ui.appendChild(clippingPlaneDomElement);

//////// Widget allowing to provide an URL of a 3DTiles tileset
const uiDomElement = document.createElement('div');
uiDomElement.classList.add('full_screen');
ui.appendChild(uiDomElement);

const widget3dTilesThroughURL = new C3DTiles(app.itownsView, {
  parentElement: uiDomElement,
  // We wish to use @ud-viz/widget_layer_choice for listing the layers:
  displayExistingLayers: false,
});
widget3dTilesThroughURL.domElement.setAttribute('id', 'widgets-3dtiles');

///////// Add a layer choice widget
const layerChoice = new LayerChoice(app.itownsView);
layerChoice.domElement.classList.add('widget_layer_choice');

const uiLayerChoiceDomElement = document.createElement('div');
uiLayerChoiceDomElement.classList.add('full_screen');
uiDomElement.appendChild(uiLayerChoiceDomElement);

const planarLayer = app.itownsView
  .getLayers()
  .filter((el) => el.id == 'planar')[0];

const c3dTLBuildings = app.itownsView
  .getLayers()
  .filter((el) => el.isC3DTilesLayer && el.id == 'Buildings');

planarLayer.object3d.traverse((child) => {
  if (child.material) {
    child.material.side = THREE.DoubleSide;
  }
});

/*USE   app.itownsView.addEventListener(itowns.MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE,()=>{}); if you enable itowns controls*/
app.itownsView.camera3D.addEventListener('change', () => {
  if (isCameraUnderPlanar(app.itownsView.camera3D, planarLayer, extent.crs)) {
    planarLayer.opacity = 0.2;
    c3dTLBuildings.forEach((layer) => {
      layer.opacity = 0;
    });
  } else {
    planarLayer.opacity = 1;
    c3dTLBuildings.forEach((layer) => {
      layer.opacity = 1;
    });
  }
});

const loaderCavePath = async () => {
  const offset = GLOBAL_OFFSET;
  const object = await loadCavePath(app.itownsView.scene);
  if (!offset.equals(new THREE.Vector3(0, 0, 0))) {
    object.position.add(offset);
  }
};
loaderCavePath();

layerChoice.addEventListener(LayerChoice.EVENT.FOCUS_3D_TILES, (data) => {
  const bb = new THREE.Box3().setFromObject(data.message.layerFocused.root);
  bb.getCenter(app.orbitControls.target);
  app.orbitControls.update();
});

uiLayerChoiceDomElement.appendChild(layerChoice.domElement);

const mapPoint = buildPoint(configs['point']);
const startPoint = findStart(mapPoint);

const offset = GLOBAL_OFFSET;
mapPoint.forEach((value) => {
  const geometry = new THREE.SphereGeometry(1, 32, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.scale.set(0.025, 0.025, 0.025);
  sphere.position.set(value.x, value.y, value.z);
  sphere.position.add(offset);
  app.itownsView.scene.add(sphere);
  value.bindMesh(sphere);
  app.itownsView.notifyChange();
});

const railControls = new RailControls(
  startPoint,
  mapPoint,
  app.itownsView,
  offset,
  false
);
railControls.addListeners();

const flyControls = new FlyControls(app.itownsView);
flyControls.start();

const mapControls = new Map();
mapControls.set(CameraController.CONTROLS.ORBIT_CONTROLS, app.orbitControls);
mapControls.set(CameraController.CONTROLS.RAIL_CONTROLS, railControls);
mapControls.set(CameraController.CONTROLS.FLY_CONTROLS, flyControls);

const cameraController = new CameraController(mapControls);
cameraController.disableControls();

const divCameraController = document.createElement('div');
divCameraController.id = 'div_camera_controller';
const labelChangeMode = document.createElement('label');

labelChangeMode.innerText = 'Change Mode:';
const listMode = document.createElement('ul');

const liModeOrbitsControls = document.createElement('li');
liModeOrbitsControls.innerText =
  'o: ' + CameraController.CONTROLS.ORBIT_CONTROLS;
listMode.appendChild(liModeOrbitsControls);

const liModeFlyControls = document.createElement('li');
liModeFlyControls.innerText = 'f: ' + CameraController.CONTROLS.FLY_CONTROLS;
listMode.appendChild(liModeFlyControls);

const liModeRailControls = document.createElement('li');
liModeRailControls.innerText = 'r: ' + CameraController.CONTROLS.RAIL_CONTROLS;
listMode.appendChild(liModeRailControls);

const pBinds = document.createElement('p');
divCameraController.appendChild(pBinds);

uiDomElement.appendChild(divCameraController);

cameraController.switchControls(CameraController.CONTROLS.FLY_CONTROLS);
pBinds.innerText = `Current Mode:  ${CameraController.CONTROLS.FLY_CONTROLS}
- ArrowUp: Move forward
- ArrowDown: Move backward
- ArrowLeft: Move side to left
- ArrowRight: Move side to right
- MouseMove = Rotate camera
`;

window.addEventListener('keydown', (event) => {
  if (event.key == 'r') {
    cameraController.switchControls(CameraController.CONTROLS.RAIL_CONTROLS);
    pBinds.innerText = `Current Mode:  ${CameraController.CONTROLS.RAIL_CONTROLS}
    - ArrowUp: Go to the next step
    - ArrowLeft / ArrowRight: Change the destination`;
  }
  if (event.key.toLocaleLowerCase() == 'o') {
    cameraController.switchControls(CameraController.CONTROLS.ORBIT_CONTROLS);
    pBinds.innerText = `Current Mode:  ${CameraController.CONTROLS.ORBIT_CONTROLS}
    - MouseDrag: Rotate around the target`;
  }
  if (event.key.toLocaleLowerCase() == 'f') {
    cameraController.switchControls(CameraController.CONTROLS.FLY_CONTROLS);
    pBinds.innerText = `Current Mode:  ${CameraController.CONTROLS.FLY_CONTROLS}
    - ArrowUp: Move forward
    - ArrowDown: Move backward
    - ArrowLeft: Move side to left
    - ArrowRight: Move side to right
    - MouseMove = Rotate camera
    `;
  }
});

const cameraProcess = new RequestAnimationFrameProcess(30);
let cameraMatrixWorldPreviousFrame =
  app.itownsView.camera3D.matrixWorld.clone();
cameraProcess.start(() => {
  if (
    !app.itownsView.camera3D.matrixWorld.equals(cameraMatrixWorldPreviousFrame)
  ) {
    app.itownsView.camera3D.dispatchEvent({ type: 'change' });
    cameraMatrixWorldPreviousFrame =
      app.itownsView.camera3D.matrixWorld.clone();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key == 'p') console.log(app);
});
