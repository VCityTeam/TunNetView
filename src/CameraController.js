import { Camera, Vector3, Euler } from 'three';
import { Point } from './Point';
// Utiliser les fonctions importées

export class CameraController {
  /**
   * @param {Point} startPoint leaf of skeleton graph
   * @param {PlanarView} itownsView
   *
   */
  constructor(startPoint, mapPoint, itownsView, offset) {
    this.currentPoint = startPoint;
    this.focusPoint = null;
    this.oldPoint = null;
    this.mapPoint = mapPoint;
    this.itownsView = itownsView;
    this.camera = itownsView.camera.camera3D;
    this.camera.fov = 90;
    this.offset = offset; // georeferenced position of layer

    console.log(this.currentPoint);
    this.camera.position.set(
      this.currentPoint.getX(),
      this.currentPoint.getY(),
      this.currentPoint.getZ()
    );
    console.log('CameraPosition', this.camera.position);
    this.camera.position.add(offset);
    console.log('CameraPosition Offseted', this.camera.position);
    this.setFocus();
    this.addListener();
  }

  setFocus(oldPoint) {
    if (
      this.currentPoint &&
      this.currentPoint.linkedPoint &&
      this.currentPoint.linkedPoint.length > 0
    ) {
      if (
        this.mapPoint.get(this.currentPoint.linkedPoint[0]) !== oldPoint ||
        this.currentPoint.linkedPoint.length <= 1
      ) {
        this.focusPoint = this.mapPoint.get(this.currentPoint.linkedPoint[0]);
      } else {
        this.focusPoint = this.mapPoint.get(this.currentPoint.linkedPoint[1]);
      }
    } else {
      console.warn('No linked point found to set as focus point');
    }

    this.lookPoint(this.focusPoint);
  }

  lookPoint(point) {
    if (!point) return;
    const lookedPoint = new Vector3(point.getX(), point.getY(), point.getZ());
    lookedPoint.add(this.offset);
    console.log('Target position', lookedPoint);
    this.camera.lookAt(lookedPoint);
    this.itownsView.notifyChange();
  }

  move() {
    this.camera.position.add(new Vector3(1.5, -1.5, 0));
  }

  moveCamera(startPoint, endPoint, element, offset, duration = 1000) {
    return new Promise((resolve) => {
      const start = performance.now();
      const startVector = new Vector3(
        startPoint.getX(),
        startPoint.getY(),
        startPoint.getZ()
      );
      const endVector = new Vector3(
        endPoint.getX(),
        endPoint.getY(),
        endPoint.getZ()
      );

      const updateCounter = (timestamp) => {
        const elapsed = timestamp - start;
        const alpha = Math.min(elapsed / duration, 1);
        moveStep(startVector, endVector, alpha, offset);
        if (alpha < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          console.log('Position camera', element.position);
          resolve();
        }
        this.itownsView.notifyChange();
      };

      const moveStep = (startVector, endVector, alpha, offset) => {
        const nextVector = startVector.clone().lerp(endVector, alpha);
        nextVector.add(offset);
        element.position.copy(nextVector);
      };

      requestAnimationFrame(updateCounter);
    });
  }

  addListener() {
    // Ajout de l'écouteur d'événements pour les touches
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.defaultPrevented) {
          return; // Ne devrait rien faire si l'événement de la touche était déjà consommé.
        }

        const linkedPoint = this.currentPoint.getLinkedPoint();
        switch (event.code) {
          case 'Space':
            this.move(); //DEBUG Function
            break;

          case 'ArrowUp':
            console.log('ArrowUp');
            this.moveCamera(
              this.currentPoint,
              this.focusPoint,
              this.camera,
              this.offset
            ).then(() => {
              this.oldPoint = this.currentPoint;
              this.currentPoint = this.focusPoint;
              this.setFocus(this.oldPoint);
            });
            break;

          case 'ArrowDown':
            console.log('ArrowDown');
            if (!this.oldPoint) {
              console.warn('NO OLD POINT REGISTER PLEASE USE ARROW UP BEFORE');
              return;
            }
            this.lookPoint(this.oldPoint);
            this.moveCamera(
              this.currentPoint,
              this.oldPoint,
              this.camera,
              this.offset
            );
            this.oldPoint = this.currentPoint;
            this.currentPoint = this.oldPoint;
            this.setFocus(this.oldPoint);
            break;

          case 'ArrowLeft':
            for (let i = 0; i < linkedPoint.length; i++) {
              let x = null;
              if (this.mapPoint.get(linkedPoint[i]) === this.focusPoint) {
                if (i - 1 < 0) {
                  x = linkedPoint.length - 1;
                } else {
                  x = i - 1;
                }
                if (x !== null) {
                  this.focusPoint = this.mapPoint.get(linkedPoint[x]);
                  this.lookPoint(this.focusPoint);
                }
                break;
              }
            }
            console.log(this.focusPoint);
            break;

          case 'ArrowRight':
            for (let i = 0; i < linkedPoint.length; i++) {
              let x = null;
              if (this.mapPoint.get(linkedPoint[i]) === this.focusPoint) {
                if (i + 1 === linkedPoint.length) {
                  x = 0;
                } else {
                  x = i + 1;
                }
                if (x !== null) {
                  this.focusPoint = this.mapPoint.get(linkedPoint[x]);
                  this.lookPoint(this.focusPoint);
                }
                break;
              }
            }
            console.log(this.focusPoint);
            break;

          case 'KeyS':
            console.log('S');
            this.camera.position.add(new Vector3(-1, 1, 0));
            break;

          case 'KeyD':
            console.log('D');
            this.camera.position.add(new Vector3(-1, -1, 0));
            break;

          case 'KeyW':
            console.log('Z');
            this.camera.position.add(new Vector3(1, -1, 0));
            break;

          case 'KeyA':
            console.log('Q');
            this.camera.position.add(new Vector3(1, 1, 0));
            break;

          default:
            return; // Quitter lorsque cela ne gère pas l'événement touche.
        }

        event.preventDefault();
      },
      true
    );
  }
}
