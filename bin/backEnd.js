/**
 * @file Sets up an Express backend server for examples, serving static files,
 * replacing HTML strings.
 */

const express = require('express');
const path = require('path');
const { stringReplace } = require('string-replace-middleware');

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
  'https://dataset-dl.liris.cnrs.fr/synthetic-cave-and-tunnel-systems/Cave/cave_sub_1_grid_size_x_1_grid_size_y_1_triangulation-3dtiles/tileset-translated-to-lyon-cathedral.json';
console.log('Displaying this cave URL', syntheticCaveUrl);

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
app.use(express.static(path.resolve(__dirname, '../')));

app.listen(PORT, (err) => {
  if (err) {
    console.error('Server could not start');
    return;
  }
  console.log('Http server listening on port', PORT);
});
