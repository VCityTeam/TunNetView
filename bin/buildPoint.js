const fs = require('fs');
const readline = require('readline');
const path = require('path');
const buildPoint = require('./buildPoint');
class Point {
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

module.exports = function buildPoint(filePath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const mapPoint = new Map();
    let lineNumber = 0;

    rl.on('line', (line) => {
      lineNumber++;
      let parsLine = line.split(' ');

      if (parsLine[0] === 'v') {
        let point = new Point(parsLine[1], parsLine[2], parsLine[3]);
        mapPoint.set(lineNumber, point);
      } else if (parsLine[0] === 'l') {
        let key1 = parseInt(parsLine[1]);
        let key2 = parseInt(parsLine[2]);

        if (mapPoint.has(key1)) {
          mapPoint.get(key1).addLinkedPoint(key2);
        } else {
          console.error(`Key ${key1} does not exist in mapPoint.`);
        }
      }
    });

    rl.on('close', () => {
      console.log('Finished reading file.');
      resolve(mapPoint);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
};
