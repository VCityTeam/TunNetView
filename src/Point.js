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

async function buildPoint(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();

        const mapPoint = new Map();
        jsonData.mapPoint.forEach(([key, pointData]) => {
            const point = new Point(pointData.x, pointData.y, pointData.z);
            pointData.linkedPoint.forEach(lp => point.addLinkedPoint(lp));
            mapPoint.set(key, point);
        });

        return mapPoint;
    } catch (err) {
        console.error('Error reading or parsing the file:', err);
        throw err;
    }
}

function findStart(mapPoint) {
    for (const point of mapPoint) {
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