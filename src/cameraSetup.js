import {
  localStorageSetMatrix4,
  localStorageSetVector3,
} from '@ud-viz/utils_browser';
import { C3DTILES_LAYER_EVENTS } from 'itowns';
import { Vector3 } from 'three';

import { Visualizer } from './Visualizer';

export function setUpCameraDefaults(
  itownsView,
  orbitControls,
  layers,
  options
) {
  const camera3D = itownsView.camera.camera3D;
  if (
    !localStorageSetMatrix4(
      camera3D.matrixWorld,
      Visualizer.CAMERA_LOCAL_STORAGE_KEY
    )
  ) {
    if (options.camera && options.camera.default)
      camera3D.position.set(
        options.camera.default.position.x,
        options.camera.default.position.y,
        options.camera.default.position.z
      );
  } else {
    camera3D.matrixWorld.decompose(
      camera3D.position,
      camera3D.quaternion,
      camera3D.scale
    );
    camera3D.updateProjectionMatrix();
  }

  if (
    !localStorageSetVector3(
      orbitControls.target,
      Visualizer.TARGET_LOCAL_STORAGE_KEY
    )
  ) {
    const listener = (layer) => {
      const bb = layer.tileContent.boundingVolume.box;
      const center = bb.getCenter(new Vector3());
      const target = layer.tileContent.position.clone().add(center.clone());
      orbitControls.target.copy(target);
      orbitControls.update();
      itownsView.notifyChange(camera3D);
      layers.forEach((layer) =>
        layer.removeEventListener(
          C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
          listener
        )
      );
    };

    layers.forEach((layer) => {
      layer.addEventListener(
        C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
        listener
      );
    });
  }
}
