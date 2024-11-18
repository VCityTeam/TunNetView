/**
 * @file Sets up an Express backend server for examples, serving static files,
 * replacing HTML strings.
 */

const express = require('express');
const path = require('path');
const { stringReplace } = require('string-replace-middleware');
const { spawn } = require('child-process-promise');
const fs = require('node:fs');
const buildPoint = require('./buildPoint');

console.log(
  `
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░           ░░░░░░░░░░░░░░░░░░░░    ░░░░░   ░░░░░░░░░░░░░░   ░░░   ░░░░░░░░░   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒   ▒▒▒   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒   ▒▒▒▒▒▒▒   ▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
▒▒▒▒▒   ▒▒▒▒▒   ▒▒   ▒   ▒   ▒▒▒   ▒   ▒▒   ▒▒▒▒   ▒▒▒▒▒    ▒  ▒▒▒   ▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒   ▒▒▒▒▒    ▒
▓▓▓▓▓   ▓▓▓▓▓   ▓▓   ▓▓   ▓▓   ▓   ▓▓   ▓   ▓▓  ▓▓▓   ▓▓▓▓   ▓▓▓▓▓▓   ▓▓▓   ▓▓▓▓   ▓▓  ▓▓▓   ▓▓▓   ▓▓ ▓▓   ▓
▓▓▓▓▓   ▓▓▓▓▓   ▓▓   ▓▓   ▓▓   ▓   ▓▓▓  ▓   ▓         ▓▓▓▓   ▓▓▓▓▓▓▓   ▓   ▓▓▓▓▓   ▓         ▓▓▓   ▓  ▓▓   ▓
▓▓▓▓▓   ▓▓▓▓▓   ▓▓   ▓▓   ▓▓   ▓   ▓▓▓▓  ▓  ▓  ▓▓▓▓▓▓▓▓▓▓▓   ▓ ▓▓▓▓▓▓     ▓▓▓▓▓▓   ▓  ▓▓▓▓▓▓▓▓▓▓  ▓  ▓     ▓
█████   ███████      █    ██   █   ██████   ███     ███████   ████████   ███████   ███     ████    ████    █
████████████████████████████████████████████████████████████████████████████████████████████████████████████
`
);

/**
 * The environment mode.
 *
 * @type {string}
 */
const syntheticCaveUrl =
  process.env.SYNTHETIC_CAVE_URL ||
  'http://graphiqueetimage.liris.cnrs.fr:8001/tilesets/';
console.log('Displaying this cave URL', syntheticCaveUrl);

(async () => {
  const urlSkeleton = `${syntheticCaveUrl}/skeleton.sdp`;
  const pathFileSkeleton = path.resolve(__dirname, '../skeleton.sdp');
  console.log('Start fetching', urlSkeleton);
  const response = await fetch(urlSkeleton);
  console.log(`${urlSkeleton} fetched`);
  const body = await response.text();
  console.log('Start writing file:', pathFileSkeleton);
  fs.writeFile(pathFileSkeleton, body, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`${pathFileSkeleton} is writed`);
    }
  });

  const pathFileSkeletonObj = path.resolve(
    __dirname,
    '../public/assets/model/skeleton.obj'
  );
  console.log('Convert', pathFileSkeleton, 'to obj here', pathFileSkeletonObj);
  await spawn('python3', [
    path.resolve(__dirname, './convert_sdp_to_obj.py'),
    pathFileSkeleton,
    pathFileSkeletonObj,
  ]);

  console.log(`${pathFileSkeletonObj} is created`);

  const mapPoint = await buildPoint(pathFileSkeletonObj);

  // Create an object containing both mapPoint and startPoint
  const dataToWrite = {
    mapPoint: [...mapPoint],
  };

  // Convert to .json and write to the file
  fs.writeFileSync(
    path.resolve(__dirname, '../public/assets/config/point.json'),
    JSON.stringify(dataToWrite),
    'utf-8'
  );
})();

/**
 * @type {number}
 */
const PORT = process.env.PORT || 8000;

/**
 * Express application instance.
 *
 * @type {object}
 */
const app = new express();

// Apply string replacements for different values in HTML responses
app.use(
  stringReplace(
    {
      SYNTHETIC_CAVE_URL: syntheticCaveUrl,
    },
    {
      contentTypeFilterRegexp: /^application\/json/,
    }
  )
);

// Serve static files
app.use(express.static(path.resolve(__dirname, '../public')));

app.listen(PORT, (err) => {
  if (err) {
    console.error('Server could not start');
    return;
  }
  console.log('Http server listening on port', PORT);
});
