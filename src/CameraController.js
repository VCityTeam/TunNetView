import { Camera, Vector3 } from 'three';
import { Point } from './Point';
// Utiliser les fonctions importées

export class Cam {
    /**
     * @param {Point} startPoint
     * @param {Camera} camera3D
     * 
    */
    constructor(startPoint, mapPoint, camera3D) {
        this._currentPoint = startPoint;
        this._focusPoint = null;
        this._mapPoint = mapPoint;
        this._camera = camera3D;


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

    setFocus() {
        if (this.currentPoint && this.currentPoint.linkedPoint && this.currentPoint.linkedPoint.length > 0) {
            this.focusPoint = this.currentPoint.linkedPoint[0];
        } else {
            console.warn('No linked point found to set as focus point');
        }
    }

    move() {
        this._camera.position.add(new Vector3(20, 20, 20));
    }

    addListener() {
        // console.log("addlist");
        window.addEventListener(
            "keydown",
            (event) => {
                if (event.defaultPrevented) {
                    return; // Ne devrait rien faire si l'événement de la touche était déjà consommé.
                }
                // console.log("Event");
                switch (event.code) {
                    case "Space":
                        // console.log("Space");
                        this.move();
                        break;
                    case "ArrowUp":
                        // console.log("ArrowUp");
                        // Déplacement de currentPoint to focusPoint
                        this.currentPoint = this.mapPoint.get(this.focusPoint);
                        this.setFocus();
                        break;
                    case "ArrowLeft":
                        // console.log("ArrowLeft");
                        // Faire quelque chose pour la touche "left arrow" pressée.
                        break;
                    case "ArrowRight":
                        // console.log("ArrowRight");
                        // Faire quelque chose pour la touche "right arrow" pressée.
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




