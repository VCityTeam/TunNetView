import { Camera, Vector3 } from 'three';
// Utiliser les fonctions importées

export class Cam {
    /**
     * @param {Vector3} startPoint
     * @param {Camera} camera3D
     * 
    */
    constructor(startPoint, camera3D) {
        this._currentPoint = startPoint; // Convention pour indiquer une propriété privée
        this._focusPoint = null; // Convention pour indiquer une propriété privée
        this._camera = camera3D; // Convention pour indiquer une propriété privée


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

    addListener() {
        window.addEventListener(

            "keydown",
            function (event) {
                if (event.defaultPrevented) {
                    return; // Ne devrait rien faire si l'événement de la touche était déjà consommé.
                }

                switch (event.key) {
                    case "Space":
                        console.log("Coucou");
                        cam.move();
                        break;
                    case "ArrowUp":
                        // Déplacement de currentPoint to focusPoint
                        cam.currentPoint = cam.focusPoint();
                        cam.setFocus();
                        break;
                    case "ArrowLeft":
                        // Faire quelque chose pour la touche "left arrow" pressée.
                        break;
                    case "ArrowRight":
                        // Faire quelque chose pour la touche "right arrow" pressée.
                        break;
                    default:
                        return; // Quitter lorsque cela ne gère pas l'événement touche.
                }

                // Annuler l'action par défaut pour éviter qu'elle ne soit traitée deux fois.
                event.preventDefault();
            },
            true,
        );
    }

    move() {
        this._camera.position.add(new Vector3(0, 5, 0));

    }
}




