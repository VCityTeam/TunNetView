import {
  PlanarView,
  C3DTilesLayer,
  C3DTilesSource,
  View,
  C3DTILES_LAYER_EVENTS,
  MAIN_LOOP_EVENTS,
} from 'itowns';
import {
  PointsMaterial,
  Box3,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  Scene,
  Color,
  Raycaster,
  Vector2,
  Vector3,
  Group,
  LineBasicMaterial,
  Object3D,
  SphereGeometry,
  Line,
  BufferGeometry,
  Plane,
  PlaneGeometry,
  DoubleSide,
  Matrix3,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  localStorageSetMatrix4,
  localStorageSetVector3,
  computeNearFarCamera,
  RequestAnimationFrameProcess,
  createLocalStorageSlider,
  createLocalStorageDetails,
  createLocalStorageCheckbox,
} from '@ud-viz/utils_browser';

import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

import { round, vector3ToLabel } from '@ud-viz/utils_shared';

/**
 * @typedef {object} LayerConfig
 * @property {string} name - name of C3DTilesLayer
 * @property {object} source - C3DTilesLayer source
 * @property {string} source.url - url to the tileset.json
 */
export class Visualizer {
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
   * @param {number} [options.raycasterPointsThreshold=Visualizer.RAYCASTER_POINTS_THRESHOLD] - raycaster points treshold
   * @param {number} [options.measure] - add measure tool
   */
  constructor(extent, layerConfigs, options = {}) {
    /** @type {Raycaster} */
    this.raycaster = new Raycaster();

    /** @type {HTMLElement} */
    this.domElement = document.createElement('div');

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

    // modify scene + renderer to have mesh rendering on the top

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

    // initialize point clouds
    this.clippingPlane = new Plane();
    const pointCloudMaterial = new PointsMaterial({
      size: options.defaultPointCloudSize || Visualizer.DEFAULT_POINT_SIZE,
      vertexColors: true,
      clippingPlanes: [this.clippingPlane],
    });

    /** @type {Array<C3DTilesLayer>} */
    this.layers = [];

    layerConfigs.forEach((params) => {
      const c3dTilesLayer = new C3DTilesLayer(
        params.name,
        {
          name: params.name,
          source: new C3DTilesSource({
            url: params.source.url,
          }),
        },
        this.itownsView
      );
      // itowns hack working to intialize point cloud material
      c3dTilesLayer.addEventListener(
        C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
        ({ tileContent }) => {
          let typePoint = false;
          tileContent.traverse((m) => {
            console.log(m.type);
            if (m.type == 'Points') {
              typePoint = true;
            }
          });
          if (typePoint) {
            // itowns is cloning the material breaking the reference on this.clippingPlane
            tileContent.traverse((child) => {
              if (child.material) child.material = pointCloudMaterial;
            });
          } else {
            // itowns is cloning the material breaking the reference on this.clippingPlane
            tileContent.traverse((child) => {
              if (child.material) child.material.side = DoubleSide;
            });
          }
        }
      );

      View.prototype.addLayer.call(this.itownsView, c3dTilesLayer);
      this.layers.push(c3dTilesLayer); // ref pointCloud layer there to make difference between C3DTilesLayer b3dm and pnts
    });

    /** @type {OrbitControls} */
    this.orbitControls = new OrbitControls(
      this.itownsView.camera.camera3D,
      this.itownsView.mainLoop.gfxEngine.label2dRenderer.domElement
    );
    // target orbit controls is a mesh
    /** @type {Mesh} */
    this.targetOrbitControlsMesh = new Mesh(
      new SphereGeometry(),
      new MeshBasicMaterial({ color: 'red' })
    );
    this.targetOrbitControlsMesh.name = 'target_oribit_controls';
    this.topScene.add(this.targetOrbitControlsMesh);
    const updateTargetMesh = () => {
      this.targetOrbitControlsMesh.position.copy(
        this.orbitControls.target.clone()
      );
      const scale =
        this.itownsView.camera.camera3D.position.distanceTo(
          this.orbitControls.target
        ) / 150;
      this.targetOrbitControlsMesh.scale.set(scale, scale, scale);
    };
    this.orbitControls.addEventListener('change', () => {
      updateTargetMesh();
      this.itownsView.notifyChange(this.itownsView.camera.camera3D);
    });

    // camera default placement
    {
      if (
        !localStorageSetMatrix4(
          this.itownsView.camera.camera3D.matrixWorld,
          Visualizer.CAMERA_LOCAL_STORAGE_KEY
        )
      ) {
        if (options.camera && options.camera.default)
          this.itownsView.camera.camera3D.position.set(
            options.camera.default.position.x,
            options.camera.default.position.y,
            options.camera.default.position.z
          );
      } else {
        this.itownsView.camera.camera3D.matrixWorld.decompose(
          this.itownsView.camera.camera3D.position,
          this.itownsView.camera.camera3D.quaternion,
          this.itownsView.camera.camera3D.scale
        );
        this.itownsView.camera.camera3D.updateProjectionMatrix();
      }

      if (
        !localStorageSetVector3(
          this.orbitControls.target,
          Visualizer.TARGET_LOCAL_STORAGE_KEY
        )
      ) {
        const listener = (layer) => {
          return;
          // const bb = new Box3().setFromObject(layer.tileContent);
          // bb.getCenter(this.orbitControls.target);
          this.orbitControls.target = layer.tileContent.position;
          this.orbitControls.update();
          this.itownsView.notifyChange(this.itownsView.camera.camera3D);
          this.layers.forEach((layer) =>
            layer.removeEventListener(
              C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
              listener
            )
          );
        };

        this.layers.forEach((layer) => {
          layer.addEventListener(
            C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
            listener
          );
        });
      }

      updateTargetMesh();

      // loading 3DTiles ui
      {
        const c3DTilesLoadingDomElement = document.createElement('div');
        if (options.c3DTilesLoadingDomElementClasses) {
          options.c3DTilesLoadingDomElementClasses.forEach((cssClass) => {
            c3DTilesLoadingDomElement.classList.add(cssClass);
          });
        }
        this.domElement.appendChild(c3DTilesLoadingDomElement);
        c3DTilesLoadingDomElement.hidden = true;

        /** @type {Map<string, Mesh>} */
        const currentLoadingBox = new Map();

        const loadingBoxId = (layer, tileId) => layer.id + tileId;

        this.layers.forEach((c3dTilesLayer) => {
          c3dTilesLayer.addEventListener(
            C3DTILES_LAYER_EVENTS.ON_TILE_REQUESTED,
            ({ metadata }) => {
              if (metadata.tileId == undefined) throw new Error('no tile id');

              const worldBox3 = metadata.boundingVolume.box.clone();

              if (metadata.transform) {
                worldBox3.applyMatrix4(metadata.transform);
              } else if (metadata._worldFromLocalTransform) {
                worldBox3.applyMatrix4(metadata._worldFromLocalTransform);
              }

              const box3Object = new Mesh(
                new BoxGeometry(),
                new MeshBasicMaterial({
                  wireframe: true,
                  wireframeLinewidth: 2,
                  color: new Color(Math.random(), Math.random(), Math.random()),
                })
              );
              box3Object.scale.copy(worldBox3.max.clone().sub(worldBox3.min));
              worldBox3.getCenter(box3Object.position);
              box3Object.updateMatrixWorld();
              this.itownsView.scene.add(box3Object);
              this.itownsView.notifyChange(this.itownsView.camera.camera3D);

              // bufferize
              currentLoadingBox.set(
                loadingBoxId(c3dTilesLayer, metadata.tileId),
                box3Object
              );
              c3DTilesLoadingDomElement.hidden = false;
            }
          );

          c3dTilesLayer.addEventListener(
            C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
            ({ tileContent }) => {
              if (
                currentLoadingBox.has(
                  loadingBoxId(c3dTilesLayer, tileContent.tileId)
                )
              ) {
                this.itownsView.scene.remove(
                  currentLoadingBox.get(
                    loadingBoxId(c3dTilesLayer, tileContent.tileId)
                  )
                );
                currentLoadingBox.delete(
                  loadingBoxId(c3dTilesLayer, tileContent.tileId)
                );
                c3DTilesLoadingDomElement.hidden = currentLoadingBox.size == 0; // nothing more is loaded
                this.itownsView.notifyChange(this.itownsView.camera.camera3D);
              }
            }
          );
        });
      }
    }

    // different control speed
    this.domElementSpeedControls = document.createElement('div');
    {
      const sliderSpeedControls = createLocalStorageSlider(
        'speed_orbit_controls',
        'Controls vitesse',
        this.domElementSpeedControls,
        {
          min: 0.01,
          max: 0.75,
          step: 'any',
          defaultValue: 0.3,
        }
      );

      const updateSpeedControls = () => {
        const speed = sliderSpeedControls.valueAsNumber;
        this.orbitControls.rotateSpeed = speed;
        this.orbitControls.zoomSpeed = speed;
        this.orbitControls.panSpeed = speed;
      };

      sliderSpeedControls.oninput = updateSpeedControls;
      updateSpeedControls();
    }

    // move orbit control target
    this.domElementTargetDragElement = document.createElement('div');
    {
      this.domElementTargetDragElement = document.createElement('div');
      this.domElementTargetDragElement.draggable = true;

      this.domElementTargetDragElement.ondragend = (event) => {
        if (event.target === this.domElementTargetDragElement) {
          const i = this.eventTo3DTilesIntersect(event);
          if (i) this.moveCamera(null, i.point, 500);
        }
      };
    }

    // box3 of point cloud
    {
      const box3PointCloud = new Box3();
      const boxMeshPointCloud = new Mesh(
        new BoxGeometry(),
        new MeshBasicMaterial({ wireframe: true })
      );
      this.itownsView.scene.add(boxMeshPointCloud);
      this.layers.forEach((c3dTilesLayer) => {
        c3dTilesLayer.addEventListener(
          C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
          () => {
            // box3PointCloud.setFromObject(c3dTilesLayer.object3d);
            box3PointCloud.expandByObject(c3dTilesLayer.object3d);
            box3PointCloud.getCenter(boxMeshPointCloud.position);
            boxMeshPointCloud.scale.copy(
              box3PointCloud.max.clone().sub(box3PointCloud.min)
            );
            boxMeshPointCloud.updateMatrixWorld();
          }
        );
      });
    }

    /** @type {HTMLElement} */
    this.measureDomElement = null;
    if (options.measure) {
      // point cloud measure
      {
        this.measureDomElement = createLocalStorageDetails(
          'measure_details',
          'Mesure'
        );

        const pathMeasureButton = document.createElement('button');
        this.measureDomElement.appendChild(pathMeasureButton);

        const parentMeasureObject = new Group();
        this.topScene.add(parentMeasureObject);

        const pointMaterial = new MeshBasicMaterial({ color: 'green' });
        const lineMaterial = new LineBasicMaterial({
          color: 0x0000ff,
          linewidth: 3,
        });

        // closure with parent scope
        /** @type {Visualizer} */
        const _this = this;

        class Label3D {
          constructor(position, value) {
            this.position = position;

            this.domElement = document.createElement('div');
            this.domElement.classList.add('label_3D');
            this.domElement.innerText = value;

            _this.domElement.appendChild(this.domElement);
          }

          dispose() {
            this.domElement.remove();
          }

          update() {
            const onScreenPosition = this.position.clone();
            onScreenPosition.project(_this.itownsView.camera.camera3D);

            // compute position on screen
            // note that this is working only when parent div of the html is 100% window size
            const widthHalf =
                _this.itownsView.mainLoop.gfxEngine.renderer.domElement
                  .clientWidth * 0.5,
              heightHalf =
                _this.itownsView.mainLoop.gfxEngine.renderer.domElement
                  .clientHeight * 0.5;
            onScreenPosition.x = onScreenPosition.x * widthHalf + widthHalf;
            onScreenPosition.y =
              -(onScreenPosition.y * heightHalf) + heightHalf;

            this.domElement.style.left = onScreenPosition.x + 'px';
            this.domElement.style.top = onScreenPosition.y + 'px';
          }
        }

        class MeasurePath {
          constructor() {
            this.object3D = new Object3D();

            parentMeasureObject.add(this.object3D);

            this.sphereMesh = [];

            this.labelDomElements = [];

            // record a frame requester
            _this.itownsView.addFrameRequester(
              MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE,
              () => {
                this.updateTransform();
              }
            );

            this.points = [];
          }

          update() {
            // reset
            while (this.object3D.children.length) {
              this.object3D.remove(this.object3D.children[0]);
            }

            for (let index = 0; index < this.points.length; index++) {
              const point = this.points[index];
              const sphere = new Mesh(new SphereGeometry(), pointMaterial);
              sphere.position.copy(point);

              this.sphereMesh.push(sphere);
              this.object3D.add(sphere);
            }

            this.labelDomElements.forEach((l) => l.dispose());
            this.labelDomElements.length = 0;

            if (this.points.length >= 2) {
              const cloneArray = this.points.map((el) => el.clone());

              const max = new Vector3(-Infinity, -Infinity, -Infinity);
              const min = new Vector3(Infinity, Infinity, Infinity);

              // compute bb to center line object to avoid blink (when geometry has values too high)
              for (let index = 0; index < cloneArray.length; index++) {
                const point = cloneArray[index];
                max.x = Math.max(point.x, max.x);
                max.y = Math.max(point.y, max.y);
                max.z = Math.max(point.z, max.z);
                min.x = Math.min(point.x, min.x);
                min.y = Math.min(point.y, min.y);
                min.z = Math.min(point.z, min.z);

                if (cloneArray[index + 1]) {
                  this.labelDomElements.push(
                    new Label3D(
                      new Vector3().lerpVectors(
                        cloneArray[index],
                        cloneArray[index + 1],
                        0.5
                      ),
                      round(
                        cloneArray[index].distanceTo(cloneArray[index + 1])
                      ) + 'm'
                    )
                  );
                }
              }

              const center = min.lerp(max, 0.5);

              cloneArray.forEach((point) => {
                point.sub(center);
              });

              const line = new Line(
                new BufferGeometry().setFromPoints(cloneArray),
                lineMaterial
              );

              line.position.copy(center);
              this.object3D.add(line);
            }

            this.updateTransform();
          }

          updateTransform() {
            this.sphereMesh.forEach((s) => {
              const scale =
                _this.itownsView.camera.camera3D.position.distanceTo(
                  s.position
                ) / 100;
              s.scale.set(scale, scale, scale);
            });

            // update labels
            this.labelDomElements.forEach((l) => l.update());

            _this.itownsView.notifyChange(_this.itownsView.camera.camera3D);
          }

          addPoint(vector) {
            this.points.push(vector);
            this.update();
          }

          dispose() {
            parentMeasureObject.remove(this.object3D);
            this.labelDomElements.forEach((l) => l.dispose());
          }
        }

        let currentMeasurePath = null;
        let modeMeasure = false;

        const updateMeasure = () => {
          pathMeasureButton.innerText = modeMeasure
            ? 'stop mesurer'
            : 'Ajouter chemin de mesure';

          if (modeMeasure) {
            _this.domElement.classList.add('cursor_add');
            if (currentMeasurePath) currentMeasurePath.dispose();
            currentMeasurePath = new MeasurePath();
          } else {
            _this.domElement.classList.remove('cursor_add');
          }
        };

        const clearMeasurePath = document.createElement('button');
        clearMeasurePath.innerText = 'Supprimer mesure';
        this.measureDomElement.appendChild(clearMeasurePath);

        const leaveMeasureMode = () => {
          if (modeMeasure) {
            modeMeasure = false;
            updateMeasure();
          }
        };

        clearMeasurePath.onclick = () => {
          if (currentMeasurePath) currentMeasurePath.dispose();
          leaveMeasureMode();
        };

        window.addEventListener('keyup', (event) => {
          if (event.key == 'Escape') {
            leaveMeasureMode();
          }
        });

        const infoPointCloudClickedDomElement = document.createElement('div');
        this.measureDomElement.appendChild(infoPointCloudClickedDomElement);

        _this.domElement.addEventListener('click', (event) => {
          const i = _this.eventTo3DTilesIntersect(event);

          if (i) {
            infoPointCloudClickedDomElement.innerText =
              'position point cliqué = ' + vector3ToLabel(i.point);

            // if measure mode add point to path
            if (modeMeasure) {
              currentMeasurePath.addPoint(i.point);
            }
          }
        });

        updateMeasure();
        pathMeasureButton.onclick = () => {
          modeMeasure = !modeMeasure;
          updateMeasure();
        };
      }
    }

    // near far
    this.clippingPlaneDetails = createLocalStorageDetails(
      Visualizer.CLIPPING_PLANE_LOCAL_STORAGE_KEY,
      'Clipping plane',
      null
    );
    {
      const quad = new Mesh(
        new PlaneGeometry(),
        new MeshBasicMaterial({
          opacity: 0.5,
          transparent: true,
          side: DoubleSide,
        })
      );
      quad.name = 'quadOfClippingPlane';
      this.itownsView.scene.add(quad);

      if (
        localStorageSetMatrix4(
          quad.matrixWorld,
          'point_cloud_visualizer_quad_matrix4'
        )
      ) {
        quad.matrixWorld.decompose(quad.position, quad.quaternion, quad.scale);
      } else {
        quad.position.set(extent.center().x, extent.center().y, 300);
      }

      quad.scale.set(1000, 1000, 1000); // TODO: do not harcode this

      const transformControlsProcess = new RequestAnimationFrameProcess(30);

      const transformControls = new TransformControls(
        this.itownsView.camera.camera3D,
        this.itownsView.mainLoop.gfxEngine.label2dRenderer.domElement
      );

      // need to tick the rendering when quad visible since it's necessary to render due to the transform control and the camera is not moving
      transformControlsProcess.start(() => {
        if (!quad.visible) return;
        transformControls.updateMatrixWorld();
        this.itownsView.render();
      });

      const updateClippingPlane = () => {
        this.clippingPlane.normal.copy(
          new Vector3(0, 0, 1).applyNormalMatrix(
            new Matrix3().getNormalMatrix(quad.matrixWorld)
          )
        );
        // quad.position belongs to plane => quad.position.dot(plane.normal) = -constant
        this.clippingPlane.constant = -(
          this.clippingPlane.normal.x * quad.position.x +
          this.clippingPlane.normal.y * quad.position.y +
          this.clippingPlane.normal.z * quad.position.z
        );
      };

      transformControls.addEventListener('change', updateClippingPlane);
      updateClippingPlane();

      this.itownsView.scene.add(transformControls);
      // gizmo mode ui
      {
        const addButtonMode = (mode) => {
          const buttonMode = document.createElement('button');
          buttonMode.innerText = mode;
          this.clippingPlaneDetails.appendChild(buttonMode);

          buttonMode.onclick = () => {
            transformControls.setMode(mode);
          };
        };
        addButtonMode('translate');
        addButtonMode('rotate');
        addButtonMode('scale');
      }
      transformControls.addEventListener('dragging-changed', (event) => {
        this.orbitControls.enabled = !event.value;
      });

      const planeVisible = createLocalStorageCheckbox(
        'plane_visibility_key_loacal_storage',
        'Visible: ',
        this.clippingPlaneDetails,
        true
      );
      const updateQuadVisibility = () => {
        quad.visible = planeVisible.checked;
        if (quad.visible) {
          transformControls.attach(quad);
        } else {
          transformControls.detach();
        }
        transformControls.updateMatrixWorld();
        this.itownsView.notifyChange();
      };
      planeVisible.onchange = updateQuadVisibility;
      updateQuadVisibility();

      const clippingEnable = createLocalStorageCheckbox(
        'plane_enable_key_loacal_storage',
        'Enable: ',
        this.clippingPlaneDetails
      );

      const updateEnable = () => {
        this.itownsView.mainLoop.gfxEngine.renderer.localClippingEnabled =
          clippingEnable.checked;
        this.itownsView.notifyChange();
      };
      clippingEnable.onchange = updateEnable;
      updateEnable();
    }

    // compute dynamically near and far
    this.itownsView.addFrameRequester(
      MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE,
      () => {
        const bb = new Box3().setFromObject(this.itownsView.scene);
        computeNearFarCamera(this.itownsView.camera.camera3D, bb.min, bb.max);
      }
    );

    // redraw
    this.itownsView.notifyChange(this.itownsView.camera.camera3D);
  }

  /**
   *
   * @param {Event} event - mouse event
   * @returns {Vector2} - mouse in screen referential
   */
  eventToMouseCoord(event) {
    const mouse = new Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    return mouse;
  }

  /**
   *
   * @param {Event} event - mouse event
   * @returns {object} - intersects object on pointcloud layers
   */
  eventTo3DTilesIntersect(event) {
    this.raycaster.setFromCamera(
      this.eventToMouseCoord(event),
      this.itownsView.camera.camera3D
    );

    let minDist = Infinity;
    let result = null;

    this.layers.forEach((layer) => {
      const intersects = this.raycaster.intersectObject(layer.object3d, true);
      if (intersects.length && intersects[0].distance < minDist) {
        minDist = intersects[0].distance;
        result = intersects[0];
      }
    });

    return result;
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
      destPosition = this.itownsView.camera.camera3D.position.clone();
    if (!destTarget) destTarget = this.orbitControls.target.clone();
    const startCameraPosition =
      this.itownsView.camera.camera3D.position.clone();
    const startCameraTargetPosition = this.orbitControls.target.clone();

    this.targetOrbitControlsMesh.visible = false;

    this.orbitControls.enabled = false;
    const process = new RequestAnimationFrameProcess(30);

    let currentDuration = 0;

    return new Promise((resolve) => {
      process.start((dt) => {
        currentDuration += dt;
        const ratio = Math.min(Math.max(0, currentDuration / duration), 1);

        this.itownsView.camera.camera3D.position.lerpVectors(
          startCameraPosition,
          destPosition,
          ratio
        );

        this.orbitControls.target.lerpVectors(
          startCameraTargetPosition,
          destTarget,
          ratio
        );

        this.orbitControls.update();

        if (ratio == 1) {
          this.orbitControls.enabled = true;
          this.targetOrbitControlsMesh.visible = true;
          process.stop();
          resolve();
        }
      });
    });
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
