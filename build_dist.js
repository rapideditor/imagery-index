const colors = require('colors/safe');
const fs = require('fs');
const LocationConflation = require('@ideditor/location-conflation');
const prettyStringify = require('json-stringify-pretty-compact');
const shell = require('shelljs');

const featureCollection = require('./dist/featureCollection.json');
const sources = require('./dist/sources.json').sources;

buildAll();


function buildAll() {
  const START = '🏗   ' + colors.yellow('Building dist...');
  const END = '👍  ' + colors.green('dist built');

  console.log('');
  console.log(START);
  console.time(END);

  // Start clean
  shell.rm('-f', [
    'dist/combined.geojson',
    'dist/combined.min.geojson',
    'dist/featureCollection.min.json',
    'dist/sources.min.json'
  ]);

  const combined = generateCombined(sources, featureCollection);

  // Save individual data files
  fs.writeFileSync('dist/combined.geojson', prettyStringify(combined) );
  fs.writeFileSync('dist/combined.min.geojson', JSON.stringify(combined) );
  fs.writeFileSync('dist/featureCollection.min.json', JSON.stringify(featureCollection) );
  fs.writeFileSync('dist/sources.min.json', JSON.stringify({ sources: sources }) );

  console.timeEnd(END);
}


function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}


// Generate a combined GeoJSON FeatureCollection
// containing all the features w/ sources stored in properties
//
// {
//   type: 'FeatureCollection',
//   features: [
//     {
//       type: 'Feature',
//       id: 'Q117',
//       geometry: { ... },
//       properties: {
//         'area': 297118.3,
//         'sources': {
//           'osm-gh-facebook': { ... },
//           'osm-gh-twitter': { ... },
//           'talk-gh': { ... }
//         }
//       }
//     }, {
//       type: 'Feature',
//       id: 'Q1019',
//       geometry: { ... },
//       properties: {
//         'area': 964945.85,
//         'sources': {
//           'osm-mg-facebook': { ... },
//           'osm-mg-twitter': { ... },
//           'talk-mg': { ... }
//         }
//       }
//     },
//     ...
//   ]
// }
//
function generateCombined(sources, featureCollection) {
  let keepFeatures = {};
  const loco = new LocationConflation(featureCollection);

  Object.keys(sources).forEach(resourceId => {
    const resource = sources[resourceId];
    const feature = loco.resolveLocationSet(resource.locationSet);

    let keepFeature = keepFeatures[feature.id];
    if (!keepFeature) {
      keepFeature = deepClone(feature);
      keepFeature.properties.sources = {};
      keepFeatures[feature.id] = keepFeature;
    }

    keepFeature.properties.sources[resourceId] = deepClone(resource);
  });

  return { type: 'FeatureCollection', features: Object.values(keepFeatures) };
}
