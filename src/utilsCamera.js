import * as THREE from 'three';
import * as itowns from 'itowns';

/**
 * Compute relative elevation from ground of a Object3D
 *
 * @param {THREE.Object3D} object3D - object3D
 * @param {itowns.TiledGeometryLayer} tileLayer - tile layer used to compute elevation
 * @param {string} [crs=EPSG:3946] - coordinates referential system
 * @returns {number} - relative elevation
 */
function computeRelativeElevationFromGround(
  object3D,
  tileLayer,
  crs = 'EPSG:3946'
) {
  const parentGOWorldPos = new THREE.Vector3();

  if (object3D.parent) {
    parentGOWorldPos.setFromMatrixPosition(object3D.parent.matrixWorld);
  } else {
    parentGOWorldPos.setFromMatrixPosition(object3D.matrixWorld);
  }

  const goWorldPos = new THREE.Vector3();
  goWorldPos.setFromMatrixPosition(object3D.matrixWorld);

  goWorldPos.z = 10000; // cant be under the ground

  const elevation = itowns.DEMUtils.getElevationValueAt(
    tileLayer,
    new itowns.Coordinates(crs, goWorldPos),
    1 // PRECISE_READ_Z
  );

  return elevation - parentGOWorldPos.z;
}

/**
 * The function `isCameraUnderPlanar` determines if a 3D camera is positioned under a planar layer
 * based on their relative elevation from the ground.
 * @param {THREE.Camera} camera3D - camera3D object used in a 3D rendering environment.
 * @param {itowns.PlanarLayer} planarLayer - Flat surface or layer in a 3D environment, such as the ground level or a horizontal plane.
 * @param {string} crs - CRS stands for Coordinate Reference System.
 * @returns {boolean}  It returns `true` if the camera is under the planar layer, and `false` otherwise.
 */
export function isCameraUnderPlanar(camera3D, planarLayer, crs) {
  return computeRelativeElevationFromGround(camera3D, planarLayer, crs) > 0;
}

///////////////////////////////////////////////////////////////////////
// When getting close to subterranean objects, hide other objects.
// Because this PointCloudVisualizer based application is dedicated/specific
// to visualizing 3DTileset of tunnels and caves the geometric structures
// of interest will (most often) be subterrenean. This pauses the difficulty
// of having to deal with either viewing the terrain (and hidding the
// subterranean structures of interest) or viewing the subterranean
// structures (while visually setting aside the terrain).
// The empirical balance (between terrain and subterranean structure) we
// use uses a distance criteria and goes:
// * when we get close "enough" to the subterranean strucutre we want to
//   facilitate the view of the tileset by automatically making the natural
//   terrain transparent.
// * when getting away far "enough" from the tileset when want to privilege
//   the viewing of the terrain and thus to restore the inital value of
//   the opacity of the terrain.

export function isCameraInsideZoneOfInterest(app) {
  // Consider the first point cloud managed by the PointCloudVisualizer
  // and compute the center of its bounding box.
  if (typeof app.layers[0] === 'undefined') {
    console.log('Unfound point cloud.');
    return false;
  }
  if (typeof app.layers[0].root === 'undefined') {
    console.log('Unfound rootTile.');
    return false;
  }
  const rootTile = app.layers[0].root;
  const rootTilePosition = rootTile.position;
  const rootTileBox = rootTile.boundingVolume.box;
  const boxMin = rootTileBox.min.clone();
  const boxMax = rootTileBox.max.clone();
  const boxCenter = boxMin.add(boxMax).multiplyScalar(1 / 2);
  boxCenter.add(rootTilePosition);

  // Define some notion of the size/dimensions of the bounding box of the
  // tileset:
  const boxDiagonal = boxMax.sub(rootTileBox.min).length();

  // When we are close enough (using some empirical criteria) when change
  // the opacity of the terrain layer
  const cameraPosition = app.orbitControls.object.position;
  const closeEnough = cameraPosition.distanceTo(boxCenter) - boxDiagonal;

  if (closeEnough < 0) {
    return true;
  }
  return false;
}
