import { Camera, Vector3, Euler } from 'three';
import { Point } from './Point';
// Utiliser les fonctions importées

export class Cam {
    /**
     * @param {Point} startPoint
     * @param {Camera} camera3D
     * 
    */
    constructor(startPoint, mapPoint, camera3D, offset) {
        this._currentPoint = startPoint;
        this._focusPoint = null;
        this._oldPoint = null;
        this._mapPoint = mapPoint;
        this._camera = camera3D;
        this._offset = offset;

        console.log(this.currentPoint);
        this.camera.position.set(this.currentPoint.getX(), this.currentPoint.getY(), this.currentPoint.getZ());
        console.log(this.camera.position);
        this.camera.position.add(offset);
        console.log(this.camera.position);
        // this.camera.position.sub(1.5, 1.5, 0);
        //console.log(this.camera.rotation)
        //this.camera.rotation.set(new Euler(0, 0, 0, 'XYZ'));
        this.setFocus();
        this.addListener();
    }

    // Getter pour currentPoint
    get currentPoint() {
        return this._currentPoint;
    }

    // Setter pour currentPoint
    set currentPoint(point) {
        this._currentPoint = point;
    }

    // Getter pour focusPoint
    get focusPoint() {
        return this._focusPoint;
    }

    // Setter pour focusPoint
    set focusPoint(point) {
        this._focusPoint = point;
    }

    // Getter pour oldPoint
    get oldPoint() {
        return this._oldPoint;
    }

    // Setter pour oldPoint
    set oldPoint(point) {
        this._oldPoint = point;
    }

    // Getter pour mapPoint
    get mapPoint() {
        return this._mapPoint;
    }

    // Setter pour focusPoint
    set mapPoint(map) {
        this.mapPoint = map;
    }

    // Getter pour camera
    get camera() {
        return this._camera;
    }

    // Setter pour camera
    set camera(camera3D) {
        this._camera = camera3D;
    }

    // Getter pour offset
    get offset() {
        return this._offset;
    }

    // Setter pour camera
    set offset(offset) {
        this._offset = offset;
    }

    setFocus(oldPoint) {
        if (this.currentPoint && this.currentPoint.linkedPoint && this.currentPoint.linkedPoint.length > 0) {
            if (this.mapPoint.get(this.currentPoint.linkedPoint[0]) !== oldPoint || !this.currentPoint.linkedPoint.length > 1) {
                this.focusPoint = this.mapPoint.get(this.currentPoint.linkedPoint[0]);
            } else {
                this.focusPoint = this.mapPoint.get(this.currentPoint.linkedPoint[1]);
            }

        } else {
            console.warn('No linked point found to set as focus point');
        }
    }

    lookPoint(point) {
        const lookedPoint = new Vector3(point.getX(), point.getY(), point.getZ());
        lookedPoint.add(this.offset);
        console.log(lookedPoint);
        this.camera.lookAt(lookedPoint);
    }

    move() {
        this._camera.position.add(new Vector3(1.5, -1.5, 0));
    }

    addListener() {
        // Fonction fléchée pour déplacer la caméra
        const moveCamera = (startPoint, endPoint, element, offset, duration = 2000) => {
            const start = performance.now();
            const startVector = new Vector3(startPoint.getX(), startPoint.getY(), startPoint.getZ());
            const endVector = new Vector3(endPoint.getX(), endPoint.getY(), endPoint.getZ());

            const updateCounter = (timestamp) => {
                const elapsed = timestamp - start;
                const alpha = Math.min(elapsed / duration, 1);
                moveStep(startVector, endVector, alpha, offset);
                if (alpha < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    console.log(element.position);
                }
            };

            const moveStep = (startVector, endVector, alpha, offset) => {
                const nextVector = startVector.clone().lerp(endVector, alpha);
                nextVector.add(offset);
                element.position.copy(nextVector);
            };

            requestAnimationFrame(updateCounter);
        };

        // Ajout de l'écouteur d'événements pour les touches
        window.addEventListener(
            "keydown",
            (event) => {
                if (event.defaultPrevented) {
                    return; // Ne devrait rien faire si l'événement de la touche était déjà consommé.
                }

                const linkedPoint = this.currentPoint.getLinkedPoint();
                switch (event.code) {
                    case "Space":
                        this.move();
                        break;

                    case "ArrowUp":
                        console.log("ArrowUp");
                        this.lookPoint(this.focusPoint);
                        moveCamera(this.currentPoint, this.focusPoint, this.camera, this.offset);
                        this.oldPoint = this.currentPoint;
                        this.currentPoint = this.focusPoint;
                        this.setFocus(this.oldPoint);
                        this.lookPoint(this.focusPoint);
                        break;

                    case "ArrowDown":
                        console.log("ArrowDown");
                        this.lookPoint(this.oldPoint);
                        moveCamera(this.currentPoint, this.oldPoint, this.camera, this.offset);
                        this.oldPoint = this.currentPoint;
                        this.currentPoint = this.oldPoint;
                        this.setFocus(this.oldPoint);
                        this.lookPoint(this.focusPoint);
                        break;

                    case "ArrowLeft":
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

                    case "ArrowRight":
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

                    case "KeyS":
                        console.log("S");
                        this.camera.position.add(new Vector3(-1, 1, 0));
                        break;

                    case "KeyD":
                        console.log("D");
                        this.camera.position.add(new Vector3(-1, -1, 0));
                        break;

                    case "KeyW":
                        console.log("Z");
                        this.camera.position.add(new Vector3(1, -1, 0));
                        break;

                    case "KeyA":
                        console.log("Q");
                        this.camera.position.add(new Vector3(1, 1, 0));
                        break;

                    default:
                        return; // Quitter lorsque cela ne gère pas l'événement touche.
                }

                event.preventDefault();
            },
            true,
        );
    }


}







