const colors = require('colors/safe');
const fs = require('fs');
const LocationConflation = require('@ideditor/location-conflation');
const prettyStringify = require('json-stringify-pretty-compact');
const shell = require('shelljs');
const xmlbuilder2 = require('xmlbuilder2');

const sources = require('../dist/sources.json');
const featureCollection = require('../dist/featureCollection.json');
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
    'dist/combined.json',
    'dist/combined.min.json',
    'dist/legacy/imagery.geojson',
    'dist/legacy/imagery.min.geojson',
    'dist/legacy/imagery.json',
    'dist/legacy/imagery.min.json',
    'dist/legacy/imagery.xml',
    'dist/legacy/imagery.min.xml',
    'dist/featureCollection.min.json',
    'dist/sources.min.json'
  ]);

  // Save individual data files
  fs.writeFileSync('dist/featureCollection.min.json', JSON.stringify(featureCollection) );
  fs.writeFileSync('dist/sources.min.json', JSON.stringify(sources) );

  generateCombined();
  generateLegacyImageryGeojson();
  generateLegacyImageryJson();
  generateLegacyImageryXml();

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
    return `https://cdn.jsdelivr.net/gh/ideditor/imagery-index@main/dist/images/${icon}`;
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
function generateCombined() {
  process.stdout.write('📦  dist/combined.json  ');

  let keepFeatures = {};
  Object.keys(sources).forEach(sourceId => {
    const source = sources[sourceId];
    const feature = loco.resolveLocationSet(source.locationSet).feature;

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
  fs.writeFileSync('dist/combined.json', prettyStringify(combined) );
  fs.writeFileSync('dist/combined.min.json', JSON.stringify(combined) );

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
function generateLegacyImageryGeojson() {
  process.stdout.write('📦  dist/legacy/imagery.geojson  ');

  let keepFeatures = [];
  Object.values(sources).forEach(source => {
    const feature = loco.resolveLocationSet(source.locationSet).feature;
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

    keepFeatures.push(feature);
  });

  const legacyGeoJSON = {
    type: 'FeatureCollection',
    meta: { generated: dateString(), version: '1.0' },
    features: keepFeatures
  };
  fs.writeFileSync('dist/legacy/imagery.geojson', prettyStringify(legacyGeoJSON) );
  fs.writeFileSync('dist/legacy/imagery.min.geojson', JSON.stringify(legacyGeoJSON) );

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
function generateLegacyImageryJson() {
  process.stdout.write('📦  dist/legacy/imagery.json  ');

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
    if (source.country_code)           { obj.country_code = source.country_code; }
    if (source.available_projections)  { obj.available_projections = source.available_projections; }

    // todo - default?

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

    const feature = loco.resolveLocationSet(source.locationSet).feature;
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

  fs.writeFileSync('dist/legacy/imagery.json', prettyStringify(keepSources) );
  fs.writeFileSync('dist/legacy/imagery.min.json', JSON.stringify(keepSources) );

  process.stdout.write(colors.green('✓\n'));
}


// `generateLegacyImageryXml`
// Generate an editor-layer-index style `imagery.xml`
// Like `imagery.geojson` but XML for JOSM.
// https://josm.openstreetmap.de/wiki/Maps#Documentation
//
// <?xml version='1.0' encoding='utf-8'?>
// <imagery>
//   <entry>
//     <id>Berlin-2011</id>
//     <name>Berlin aerial photography 2011</name>
//     …
//     <shape>
//       <point lon="13.2953" lat="52.392"/>
//       <point lon="13.295" lat="52.4008"/>
//       …
//     </shape>
//   </entry>
//     …
// </imagery>
//
function generateLegacyImageryXml() {
  process.stdout.write('📦  dist/legacy/imagery.xml  ');

  let root = xmlbuilder2.create({ version: '1.0', encoding: 'UTF-8' });
  let imagery = root.ele('imagery');

  Object.values(sources).forEach(source => {
    let entry = imagery.ele('entry');

    if (source.overlay)      { entry.att('overlay', true);  }
    if (source.best)         { entry.att('eli-best', true); }

    if (source.name)         { entry.ele('name').txt(source.name); }
    if (source.id)           { entry.ele('id').txt(source.id); }
    if (source.category)     { entry.ele('category').txt(source.category); }
    if (source.type)         { entry.ele('type').txt(source.type); }
    if (source.description)  { entry.ele('description').txt(source.description); }
    if (source.url)          { entry.ele('url').txt(source.url); }
    if (source.max_zoom)     { entry.ele('max-zoom').txt(source.max_zoom); }
    if (source.min_zoom)     { entry.ele('min-zoom').txt(source.min_zoom); }
    if (source.license_url)  { entry.ele('permission-ref').txt(source.license_url); }
    if (source.icon)         { entry.ele('icon').txt(iconPath(source.icon)); }
    if (source.country_code) { entry.ele('country_code').txt(iconPath(source.country_code)); }

    // todo - default?

    if (source.start_date) {
      let date = entry.ele('date');
      if (source.end_date && source.end_date === source.start_date) {
        date.txt(source.start_date);
      } else {
        date.txt(source.start_date + ';' + (source.end_date || '-'));
      }
    }

    if (source.attribution) {
      if (source.attribution.url)  { entry.ele('attribution-url').txt(source.attribution.url); }
      if (source.attribution.text) { entry.ele('attribution-text').txt(source.attribution.text); }
    }

    // gather projections
    if (source.available_projections) {
      let projections = entry.ele('projections');
      source.available_projections.forEach(proj => projections.ele('code').txt(proj));
    }

    // gather bounds and polygon shapes
    const feature = loco.resolveLocationSet(source.locationSet).feature;
    if (feature.geometry && feature.id !== 'Q2') {   // Q2 = whole world
      let bounds = entry.ele('bounds');

      let rings = [];  // gather shapes (outer rings)
      if (feature.geometry.type === 'Polygon') {
        rings = feature.geometry.coordinates.slice();  // copy whole polygon
      } else if (feature.geometry.type === 'MultiPolygon') {
        rings = [];
        feature.geometry.coordinates.forEach(ring => {
          rings.push(ring[0].slice());    // copy each outer ring
        });
      }

      let minLat = -90, maxLat = 90, minLon = -180, maxLon= 180;
      rings.forEach(ring => {
        let shape = bounds.ele('shape');
        ring.forEach(point => {
          shape.ele('point').att('lat', point[1]).att('lon', point[0]);
          if (minLon < point[0])  { minLon = point[0]; }
          if (maxLon > point[0])  { maxLon = point[0]; }
          if (minLat < point[1])  { minLat = point[1]; }
          if (maxLat > point[1])  { maxLat = point[1]; }
        })
      });

      bounds
        .att('min-lat', minLat)
        .att('min-lon', minLon)
        .att('max-lat', maxLat)
        .att('max-lon', maxLon);
    }
  });

  fs.writeFileSync('dist/legacy/imagery.xml', root.end({ prettyPrint: true }) );
  fs.writeFileSync('dist/legacy/imagery.min.xml', root.end() );

  process.stdout.write(colors.green('✓\n'));
}
