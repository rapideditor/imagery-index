const colors = require('colors/safe');
const fs = require('fs');
const LocationConflation = require('@ideditor/location-conflation');
const prettyStringify = require('json-stringify-pretty-compact');
const shell = require('shelljs');

const featureCollection = require('./dist/featureCollection.json');
const sources = require('./dist/sources.json').sources;
const loco = new LocationConflation(featureCollection);

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
    'dist/legacy_imagery.geojson',
    'dist/legacy_imagery.min.geojson',
    'dist/legacy_imagery.json',
    'dist/legacy_imagery.min.json',
    'dist/legacy_imagery.xml',
    'dist/legacy_imagery.min.xml',
    'dist/featureCollection.min.json',
    'dist/sources.min.json'
  ]);

  // Save individual data files
  fs.writeFileSync('dist/featureCollection.min.json', JSON.stringify(featureCollection) );
  fs.writeFileSync('dist/sources.min.json', JSON.stringify({ sources: sources }) );

  generateCombined(sources);
  generateLegacyImageryGeojson(sources);
  generateLegacyImageryJson(sources);

  console.timeEnd(END);
  console.log('');
}


function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function iconPath(icon) {
  if (/^http(s)?/i.test(icon)) {
    return icon;
  } else {
    return `https://cdn.jsdelivr.net/gh/ideditor/imagery-index@master/dist/images/${icon}`;
  }
}
function dateString() {
  const d = new Date();
  return JSON.stringify(d)
    .replace('T', ' ')
    .replace(/\.\d+Z/, '')
    .replace(/"/g, '');
}



// `generateCombined`
// Generate a combined GeoJSON FeatureCollection
// containing all the features w/ source data stored in properties
//
// {
//   "type": "FeatureCollection",
//   "features": [
//     {
//       "type": "Feature",
//       "id": "Q183",
//       "geometry": { … },
//       "properties": {
//         "sources": {
//           "Berlin-2011": { … },
//           "Berlin-2014": { … },
//           "Berlin-2015": { … },
//           …
//         }
//       }
//     }, {
//       "type": "Feature",
//       "id": "Q31",
//       "geometry": { … },
//       "properties": {
//         "sources": {
//           "SPW2009": { … },
//           "SPW2012": { … },
//           "SPW2015": { … },
//           …
//         }
//       }
//     …
//   ]
// }
//
function generateCombined(sources) {
  process.stdout.write('📦  dist/combined.geojson  ');

  let keepFeatures = {};
  Object.keys(sources).forEach(sourceId => {
    const source = sources[sourceId];
    const feature = loco.resolveLocationSet(source.locationSet);

    let keepFeature = keepFeatures[feature.id];
    if (!keepFeature) {
      keepFeature = deepClone(feature);
      keepFeature.properties.sources = {};
      keepFeatures[feature.id] = keepFeature;
    }

    keepFeature.properties.sources[sourceId] = deepClone(source);
  });

  const combined = {
    type: 'FeatureCollection',
    features: Object.values(keepFeatures)
  };
  fs.writeFileSync('dist/combined.geojson', prettyStringify(combined) );
  fs.writeFileSync('dist/combined.min.geojson', JSON.stringify(combined) );

  process.stdout.write(colors.green('✓\n'));
}


// `generateLegacyImageryGeojson`
// Generate an editor-layer-index style `imagery.geojson`
// Each feature has its own geometry, duplicated if needed.
//
// {
//   "type": "FeatureCollection",
//   "features": [
//     {
//       "type": "Feature",
//       "properties": {
//         "id": "Berlin-2011",
//         …
//       },
//       "geometry": { … }
//     }, {
//       "type": "Feature",
//       "properties": {
//         "id": "Berlin-2014",
//         …
//       },
//       "geometry": { … }
//     },
//     …
//   ]
// }
//
function generateLegacyImageryGeojson(sources) {
  process.stdout.write('📦  dist/legacy_imagery.geojson  ');

  let keepFeatures = [];
  Object.values(sources).forEach(source => {
    const feature = loco.resolveLocationSet(source.locationSet);
    feature.id = source.id;
    feature.properties = deepClone(source);

    // convert icon url
    if (feature.properties.icon) {
      feature.properties.icon = iconPath(feature.properties.icon);
    }

    // remove locationSet
    if (source.locationSet.include) {
      // set geometry to null for worldwide sources
      if (source.locationSet.include.indexOf('001') !== -1) feature.geometry = null;
      if (source.locationSet.include.indexOf('Q2') !== -1) feature.geometry = null;
    }
    delete feature.properties.locationSet;

    // todo restore country_code?

    keepFeatures.push(feature);
  });

  const legacyGeoJSON = {
    type: 'FeatureCollection',
    meta: { generated: dateString(), version: '1.0' },
    features: keepFeatures
  };
  fs.writeFileSync('dist/legacy_imagery.geojson', prettyStringify(legacyGeoJSON) );
  fs.writeFileSync('dist/legacy_imagery.min.geojson', JSON.stringify(legacyGeoJSON) );

  process.stdout.write(colors.green('✓\n'));
}


// `generateLegacyImageryJson`
// Generate an editor-layer-index style `imagery.json`
// Each feature has its own geometry encoded in an `extent` property
//
// {
//   "type": "FeatureCollection",
//   "features": [
//     {
//       "type": "Feature",
//       "properties": {
//         "id": "Berlin-2011",
//         …
//       },
//       "geometry": { … }
//     }, {
//       "type": "Feature",
//       "properties": {
//         "id": "Berlin-2014",
//         …
//       },
//       "geometry": { … }
//     },
//     …
//   ]
// }
//
function generateLegacyImageryJson(sources) {
  process.stdout.write('📦  dist/legacy_imagery.json  ');

  let keepSources = [];
  Object.values(sources).forEach(source => {
    let obj = {};
    if (source.id)                     { obj.id = source.id; }
    if (source.type)                   { obj.type = source.type; }
    if (source.name)                   { obj.name = source.name; }
    if (source.description)            { obj.description = source.description; }
    if (source.url)                    { obj.url = source.url; }
    if (source.license_url)            { obj.license_url = source.license_url; }
    if (source.privacy_policy_url)     { obj.privacy_policy_url = source.privacy_policy_url; }
    if (source.best)                   { obj.best = source.best; }
    if (source.start_date)             { obj.start_date = source.start_date; }
    if (source.end_date)               { obj.end_date = source.end_date; }
    if (source.overlay)                { obj.overlay = source.overlay; }
    if (source.icon)                   { obj.icon = iconPath(source.icon); }
    if (source.available_projections)  { obj.available_projections = source.available_projections; }

    // todo - country_code? default?

    if (source.attribution) {
      obj.attribution = {};
      if (source.attribution.required) { obj.attribution.required = source.attribution.required; }
      if (source.attribution.url)      { obj.attribution.url = source.attribution.url; }
      if (source.attribution.text)     { obj.attribution.text = source.attribution.text; }
      if (source.attribution.html)     { obj.attribution.html = source.attribution.html; }
    }

    let extent = {};
    if (source.max_zoom)  { extent.max_zoom = source.max_zoom; }
    if (source.min_zoom)  { extent.min_zoom = source.min_zoom; }

    const feature = loco.resolveLocationSet(source.locationSet);
    if (feature.id === 'Q2') {   // whole world
      feature.geometry = null;
    }
    if (feature.geometry) {
      if (feature.geometry.type === 'Polygon') {
        extent.polygon = feature.geometry.coordinates.slice();  // copy whole polygon
      } else if (feature.geometry.type === 'MultiPolygon') {
        extent.polygon = [];
        feature.geometry.coordinates.forEach(ring => {
          extent.polygon.push(ring[0].slice());    // copy each outer ring
        });
      }
    }

    obj.extent = extent;
    keepSources.push(obj);
  });

  fs.writeFileSync('dist/legacy_imagery.json', prettyStringify(keepSources) );
  fs.writeFileSync('dist/legacy_imagery.min.json', JSON.stringify(keepSources) );

  process.stdout.write(colors.green('✓\n'));
}
