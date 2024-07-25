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
        // console.log("addlist");
        window.addEventListener(
            "keydown",
            (event) => {
                if (event.defaultPrevented) {
                    return; // Ne devrait rien faire si l'événement de la touche était déjà consommé.
                }
                console.log(event.code);
                const linkedPoint = this.currentPoint.getLinkedPoint();
                switch (event.code) {
                    case "Space":
                        // console.log("Space");
                        this.move();
                        break;
                    case "ArrowUp":
                        console.log("ArrowUp");

                        const element = this.camera;

                        console.log(element.position);
                        // Déplacement de currentPoint to focusPoint
                        const duration = 2000; // Durée de 2 secondes (2000 ms)
                        const start = performance.now();
                        const currentPoint = this.currentPoint;
                        const focusPoint = this.focusPoint;
                        const startVector = new Vector3(currentPoint.getX(), currentPoint.getY(), currentPoint.getZ());
                        const endVector = new Vector3(focusPoint.getX(), focusPoint.getY(), focusPoint.getZ());
                        const offset = this.offset;
                        this.lookPoint(focusPoint);
                        console.log("StartVector :", startVector);
                        console.log("endVector :", endVector);

                        const updateCounter = (timestamp) => {
                            const elapsed = timestamp - start;
                            const alpha = Math.min(elapsed / duration, 1);
                            moveStep(startVector, endVector, alpha, offset);
                            if (alpha < 1) {
                                requestAnimationFrame(updateCounter);
                            } else {
                                console.log(element.position);
                                console.log("currentPoint : ", this.currentPoint);
                                console.log("focusPoint : ", this.focusPoint);
                                const oldPoint = this.currentPoint;
                                this.currentPoint = this.focusPoint;
                                console.log("oldPoint : ", oldPoint);
                                console.log("currentPoint : ", this.currentPoint);
                                console.log("focusPoint : ", this.focusPoint);
                                this.setFocus(oldPoint);
                                this.lookPoint(focusPoint);
                                console.log("oldPoint : ", oldPoint);
                                console.log("currentPoint : ", this.currentPoint);
                                console.log("focusPoint : ", this.focusPoint);
                            }
                        }

                        const moveStep = (startVector, endVector, alpha, offset) => {
                            const nextVector = startVector.clone().lerp(endVector, alpha);
                            nextVector.add(offset);
                            element.position.copy(nextVector);
                            // console.log(element.position);
                        }


                        requestAnimationFrame(updateCounter);
                        break;
                    case "ArrowLeft":
                        // console.log("ArrowLeft");
                        // Faire quelque chose pour la touche "left arrow" pressée.
                        for (let i = 0; i < linkedPoint.length; i++) {
                            let x = null;
                            if (this.mapPoint.get(linkedPoint[i]) === this.focusPoint) {
                                if (i - 1 < 0) {
                                    x = linkedPoint.length - 1;
                                } else {
                                    x = i - 1;
                                }
                                if (x !== null) {
                                    this.focusPoint = this.mapPoint.get(linkedPoint[x])
                                    this.lookPoint(this.focusPoint);
                                }
                                break;
                            }
                        }
                        console.log(this.focusPoint);
                        break;
                    case "ArrowRight":
                        // console.log("ArrowRight");
                        // Faire quelque chose pour la touche "right arrow" pressée.

                        for (let i = 0; i < linkedPoint.length; i++) {
                            let x = null;
                            if (this.mapPoint.get(linkedPoint[i]) === this.focusPoint) {
                                if (i + 1 === linkedPoint.length) {
                                    x = 0;
                                } else {
                                    x = i + 1;
                                }
                                if (x !== null) {
                                    this.focusPoint = this.mapPoint.get(linkedPoint[x])
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
                        // console.log("Reste");
                        return; // Quitter lorsque cela ne gère pas l'événement touche.
                }

                // Annuler l'action par défaut pour éviter qu'elle ne soit traitée deux fois.
                event.preventDefault();
            },
            true,
        );
    }

}







