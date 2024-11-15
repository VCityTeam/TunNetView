import { Camera, Vector3, MathUtils } from 'three';
import { Point } from './Point';

/**
 * @classdesc representing a camera controller for navigating a 3D scene.
 */
export class RailControls {
  /**
   *
   * @param {Point} startPoint - initial point in the skeleton graph.
   * @param {Map<string, Point>} mapPoint - all points in the graph.
   * @param {PlanarView} itownsView - iTowns view.
   * @param {Vector3} offset - georeferenced position offset of the layer.
   */
  constructor(startPoint, mapPoint, itownsView, offset, enabled = true) {
    /** @type {Point} current point where the camera is located */
    this.currentPoint = startPoint;

    /** @type {Point|null}*/
    this.focusPoint = null;

    /** @type {Point|null}*/
    this.previousPoint = null;

    /** @type {Map<string, Point>}*/
    this.mapPoint = mapPoint;

    /** @type {PlanarView}*/
    this.itownsView = itownsView;

    /** @type {Camera} */
    this.camera = itownsView.camera.camera3D;

    // Set the field of view to 90 degrees
    this.camera.fov = 90;

    /** @type {Vector3} georeferenced position offset of the layer */
    this.offset = offset;

    /** @type {boolean} Flag if the camera is moving */
    this.cameraIsMoving = false;

    /** @type {boolean} Flag if the controls is enabled */
    this.enabled = enabled;

    this.setFocus();

    if (enabled) {
      this.setCameraPositionToCurrentPoint();
    }
  }

  /**
   * Sets the camera position to the current point with an offset.
   */
  setCameraPositionToCurrentPoint() {
    // Set initial camera position
    this.camera.position.set(
      this.currentPoint.getX(),
      this.currentPoint.getY(),
      this.currentPoint.getZ()
    );
    this.camera.position.add(this.offset);
  }

  /**
   * Set the focus point for the camera.
   * @param {Point} [previousPoint] - previous focus point.
   * @returns {Promise} A promise that resolves when the camera has finished looking at the new focus point.
   */
  setFocus(previousPoint) {
    if (
      this.currentPoint &&
      this.currentPoint.linkedPoint &&
      this.currentPoint.linkedPoint.length > 0
    ) {
      if (
        this.mapPoint.get(this.currentPoint.linkedPoint[0]) !== previousPoint ||
        this.currentPoint.linkedPoint.length <= 1
      ) {
        this.focusPoint = this.mapPoint.get(this.currentPoint.linkedPoint[0]);
      } else {
        this.focusPoint = this.mapPoint.get(this.currentPoint.linkedPoint[1]);
      }
    } else {
      console.warn('No linked point found to set as focus point');
    }
  }

  /**
   * Make the camera look at a specific point.
   * @param {Point} point - The point to look at.
   * @param {number} [speedRotation=0.25] - The speed of the camera rotation.
   * @returns {Promise} A promise that resolves when the camera has finished rotating.
   */
  lookPoint(point, speedRotation = 0.25) {
    if (!point) return;
    this.cameraIsMoving = true;
    return new Promise((resolve) => {
      const now = performance.now();
      const startRotation = this.camera.quaternion.clone();
      const lookedPoint = new Vector3(point.getX(), point.getY(), point.getZ());
      lookedPoint.add(this.offset);
      const tempCameraObject = this.camera.clone();
      tempCameraObject.lookAt(lookedPoint);
      const endRotation = tempCameraObject.quaternion;
      const angleSE = MathUtils.radToDeg(startRotation.angleTo(endRotation));
      const duration = angleSE / speedRotation;
      const updateCounter = (timestamp) => {
        const elapsed = timestamp - now;
        const alpha = Math.min(elapsed / duration, 1);
        const newRotation = startRotation
          .clone()
          .slerp(endRotation.clone(), alpha);
        this.camera.quaternion.copy(newRotation);
        if (alpha < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          this.cameraIsMoving = false;
          this.updatePointColors(0x0000ff);
          resolve();
        }
        this.itownsView.notifyChange();
      };

      requestAnimationFrame(updateCounter);
    });
  }

  /**
   * Move the camera from one point to another.
   * @param {Point} startPoint - The starting point.
   * @param {Point} endPoint - The ending point.
   * @param {Object3D} element - The element to move (usually the camera).
   * @param {Vector3} offset - The offset to apply to the movement.
   * @param {number} [duration=500] - The duration of the movement in milliseconds.
   * @returns {Promise} A promise that resolves when the camera has finished moving.
   */
  moveCamera(startPoint, endPoint, element, offset, duration = 500) {
    this.cameraIsMoving = true;
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
          this.updatePointColors(0xffff00);
          this.cameraIsMoving = false;
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

  /**
   * Add keyboard event listeners for camera control.
   */
  addListener() {
    window.addEventListener(
      'keydown',
      (event) => {
        if (!this.enabled) return;
        if (event.defaultPrevented) {
          return;
        }

        const linkedPoint = this.currentPoint.getLinkedPoint();
        switch (event.code) {
          case 'ArrowUp':
            this.handleArrowUp();
            break;
          case 'ArrowLeft':
            this.handleArrowLeft(linkedPoint);
            break;
          case 'ArrowRight':
            this.handleArrowRight(linkedPoint);
            break;
          default:
            return;
        }

        event.preventDefault();
      },
      true
    );
  }

  /**
   * Handle the 'ArrowUp' key press event.
   */
  handleArrowUp() {
    if (this.cameraIsMoving) return;
    this.focusPoint.mesh.material.opacity = 0.1;
    this.moveCamera(
      this.currentPoint,
      this.focusPoint,
      this.camera,
      this.offset
    ).then(() => {
      this.focusPoint.mesh.material.opacity = 1;
      this.previousPoint = this.currentPoint;
      this.currentPoint = this.focusPoint;
      this.setFocus(this.previousPoint);
      this.lookPoint(this.focusPoint);
    });
  }

  /**
   * Handle the 'ArrowLeft' key press event.
   * @param {Array<Point>} linkedPoint - Array of linked points.
   */
  handleArrowLeft(linkedPoint) {
    if (this.cameraIsMoving) return;
    this.rotateFocus(linkedPoint, -1);
  }

  /**
   * Handle the 'ArrowRight' key press event.
   * @param {Array<Point>} linkedPoint - Array of linked points.
   */
  handleArrowRight(linkedPoint) {
    if (this.cameraIsMoving) return;
    this.rotateFocus(linkedPoint, 1);
  }

  /**
   * Rotate the focus point.
   * @param {Array<Point>} linkedPoint - Array of linked points.
   * @param {number} direction - Direction of rotation (-1 for left, 1 for right).
   */
  rotateFocus(linkedPoint, direction) {
    for (let i = 0; i < linkedPoint.length; i++) {
      if (this.mapPoint.get(linkedPoint[i]) === this.focusPoint) {
        let x = (i + direction + linkedPoint.length) % linkedPoint.length;
        this.focusPoint = this.mapPoint.get(linkedPoint[x]);
        this.lookPoint(this.focusPoint);
        break;
      }
    }
  }

  /**
   * Update the colors of the linked points.
   * @param {number} [defaultColor=0xffff00] - The default color for non-focus points.
   */
  updatePointColors(defaultColor = 0xffff00) {
    this.currentPoint.linkedPoint.forEach((iNeighbourPoint) => {
      const point = this.mapPoint.get(iNeighbourPoint);
      point.mesh.material.color.set(
        point === this.focusPoint ? 0x00ff00 : defaultColor
      );
    });
  }

  update() {
    this.setCameraPositionToCurrentPoint();
    this.setFocus();
    this.lookPoint(this.focusPoint);
  }
}
