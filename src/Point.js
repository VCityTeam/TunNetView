export class Point {
    constructor(x, y, z) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.z = parseFloat(z);
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

    addLinkedPoint(int) {
        this.linkedPoint.push(parseInt(int));
    }
}

export async function buildPoint(jsonData) {

    const mapPoint = new Map();
    jsonData.points.forEach((pointData) => {
        const id = pointData[0];
        const p = pointData[1];
        const point = new Point(Number(p.x), Number(p.y), Number(p.z));
        p.linkedPoint.forEach(lp => point.addLinkedPoint(lp));
        mapPoint.set(id, point);
    });

    return mapPoint;

}


export function findStart(mapPoint) {
    for (const point of mapPoint.values()) {
        if (point.getLinkedPoint().length === 1) {
            return point;
        }
    }
}


// Usage example:
/*(async () => {
    const mapPoint = await buildPoint('path/to/point.json');
    const startPoint = findStart(mapPoint);
    console.log(`Start Point: (${startPoint.getX()}, ${startPoint.getY()}, ${startPoint.getZ()})`);
})();
*/