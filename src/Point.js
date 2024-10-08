export class Point {
  constructor(x, y, z) {
    this.x = parseFloat(x);
    this.y = parseFloat(y);
    this.z = parseFloat(z);
    this.mesh;
    this.linkedPoint = [];
  }

  getX() {
    return this.x;
  }

  getY() {
    return this.y;
  }

  getZ() {
    return this.z;
  }

  getLinkedPoint() {
    return this.linkedPoint;
  }

  bindMesh(mesh) {
    this.mesh = mesh;
  }

  addLinkedPoint(int) {
    this.linkedPoint.push(parseInt(int));
  }
}

export function buildPoint(jsonData) {
  const mapPoint = new Map();
  jsonData.mapPoint.forEach((pointData) => {
    const id = pointData[0];
    const p = pointData[1];
    const point = new Point(Number(p.x), Number(p.y), Number(p.z));
    p.linkedPoint.forEach((lp) => point.addLinkedPoint(lp));
    mapPoint.set(id, point);
  });

  return mapPoint;
}

/**
 * Return the point which will be the start and where the camera will be placed in the world.
 * @example
 * (async () => {
 *  const mapPoint = buildPoint('path/to/point.json');
 *  const startPoint = findStart(mapPoint);
 *  console.log(`Start Point: (${startPoint.getX()}, ${startPoint.getY()}, ${startPoint.getZ()})`);
 *  })();
 * @param mapPoint - Map object containing points.
 * @returns Returning the first point where the linked points array has a length of 1.
 */
export function findStart(mapPoint) {
  for (const point of mapPoint.values()) {
    if (point.getLinkedPoint().length === 1) {
      return point;
    }
  }
}
