import { createLocalStorageDetails } from '@ud-viz/utils_browser';
import {
  Group,
  MeshBasicMaterial,
  LineBasicMaterial,
  Object3D,
  SphereGeometry,
  BufferGeometry,
  Vector3,
} from 'three';

import { MAIN_LOOP_EVENTS } from 'itowns';

export class Measure {
  constructor(itownsView, layerManager) {
    this.domElement = createLocalStorageDetails('measure_details', 'Mesure');
    this.pathButton = null;
    this.clearMeasurePathButton = null;
    this.infoPointCloudClicked = null;

    this.itownsView = itownsView;
    this.layerManager = layerManager;

    this.modeMeasure = false;

    this.currentMeasurePath = null;

    this.group = new Group();
    this.initHtml();
  }

  initHtml() {
    this.pathButton = document.createElement('button');
    this.domElement.appendChild(this.pathButton);

    this.clearMeasurePathButton = document.createElement('button');
    this.clearMeasurePathButton.innerText = 'Supprimer mesure';
    this.domElement.appendChild(this.clearMeasurePathButton);

    this.infoPointCloudClicked = document.createElement('div');
    this.domElement.appendChild(this.infoPointCloudClicked);
  }

  initCallBack(viewerDiv) {
    this.clearMeasurePathButton.onclick = () => {
      if (this.currentMeasurePath) this.currentMeasurePath.dispose();
      this.leaveMeasureMode();
    };
    this.pathButton.onclick = () => {
      this.modeMeasure = !this.modeMeasure;
      this.update();
    };

    viewerDiv.addEventListener('click', (event) => {
      const i = this.layerManager.eventTo3DTilesIntersect(event);

      if (i) {
        this.infoPointCloudClicked.innerText =
          'position point cliqué = ' + vector3ToLabel(i.point);

        // if measure mode add point to path
        if (this.modeMeasure) {
          this.currentMeasurePath.addPoint(i.point);
        }
      }
    });
  }

  initGroup() {
    this.object3D = new Group();
  }

  leaveMeasureMode() {
    if (this.modeMeasure) {
      this.modeMeasure = false;
      this.updateMeasure();
    }
  }

  update() {
    this.pathButton.innerText = this.modeMeasure
      ? 'Arreter de  mesurer'
      : 'Ajouter chemin de mesure';

    if (this.modeMeasure) {
      this.domElement.classList.add('cursor_add');
      if (this.currentMeasurePath) this.currentMeasurePath.dispose();
      this.currentMeasurePath = new MeasurePath();
    } else {
      this.domElement.classList.remove('cursor_add');
    }
  }

  addObjectInGroup() {
    const pointMaterial = new MeshBasicMaterial({ color: 'green' });
    const lineMaterial = new LineBasicMaterial({
      color: 0x0000ff,
      linewidth: 3,
    });
    const newMeasurePath = new MeasurePath(
      this.group,
      this.itownsView,
      pointMaterial,
      lineMaterial
    );
  }
}

class MeasurePath {
  constructor(parentMeasureObject, itownsView, pointMaterial, lineMaterial) {
    this.object3D = new Object3D();

    parentMeasureObject.add(this.object3D);

    this.itownsView = itownsView;

    this.pointMaterial = pointMaterial;
    this.lineMaterial = lineMaterial;

    this.sphereMesh = [];

    this.labelDomElements = [];

    // record a frame requester
    itownsView.addFrameRequester(MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE, () => {
      this.updateTransform();
    });

    this.points = [];
  }

  update() {
    // reset
    while (this.object3D.children.length) {
      this.object3D.remove(this.object3D.children[0]);
    }

    for (let index = 0; index < this.points.length; index++) {
      const point = this.points[index];
      const sphere = new Mesh(new SphereGeometry(), this.pointMaterial);
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
              round(cloneArray[index].distanceTo(cloneArray[index + 1])) + 'm'
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
        this.lineMaterial
      );

      line.position.copy(center);
      this.object3D.add(line);
    }

    this.updateTransform();
  }

  updateTransform() {
    this.sphereMesh.forEach((s) => {
      const scale =
        this.itownsView.camera.camera3D.position.distanceTo(s.position) / 100;
      s.scale.set(scale, scale, scale);
    });

    // update labels
    this.labelDomElements.forEach((l) => l.update());

    this.itownsView.notifyChange(itownsView.camera.camera3D);
  }

  addPoint(vector) {
    this.points.push(vector);
    this.update();
  }

  dispose() {
    this.object3D.removeFromParent();
    this.labelDomElements.forEach((l) => l.dispose());
  }
}

class Label3D {
  constructor(position, value) {
    this.position = position;

    this.domElement = document.createElement('div');
    this.domElement.classList.add('label_3D');
    this.domElement.innerText = value;
  }

  dispose() {
    this.domElement.remove();
  }

  update(itownsView) {
    const onScreenPosition = this.position.clone();
    onScreenPosition.project(itownsView.camera.camera3D);

    // compute position on screen
    // note that this is working only when parent div of the html is 100% window size
    const widthHalf =
        itownsView.mainLoop.gfxEngine.renderer.domElement.clientWidth * 0.5,
      heightHalf =
        itownsView.mainLoop.gfxEngine.renderer.domElement.clientHeight * 0.5;
    onScreenPosition.x = onScreenPosition.x * widthHalf + widthHalf;
    onScreenPosition.y = -(onScreenPosition.y * heightHalf) + heightHalf;

    this.domElement.style.left = onScreenPosition.x + 'px';
    this.domElement.style.top = onScreenPosition.y + 'px';
  }
}
