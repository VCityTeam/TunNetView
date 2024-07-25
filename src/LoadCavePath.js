import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export function loadCavePath(scene) {
    return new Promise((resolve) => {
        // instantiate a loader
        const loader = new OBJLoader();
        // load a resource
        loader.load(
            // resource URL
            '../demo/axe_median/skel.sdp.scaled.obj',
            // called when resource is loaded
            function (object) {

                scene.add(object);
                resolve(object);
            },
            // called when loading is in progresses
            function (xhr) {

                console.log((xhr.loaded / xhr.total * 100) + '% loaded');

            },
            // called when loading has errors
            function (error) {

                console.log('An error happened');

            }

        );

    })
}    