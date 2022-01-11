const chalk = require('chalk');
const fs = require('fs');
const glob = require('glob');
const LocationConflation = require('@ideditor/location-conflation').default;
const path = require('path');
const geojsonPrecision = require('geojson-precision');
const geojsonRewind = require('@mapbox/geojson-rewind');
const shell = require('shelljs');
const stringify = require('@aitodotai/json-stringify-pretty-compact');
const Validator = require('jsonschema').Validator;
const YAML = require('js-yaml');

const geojsonSchema = require('../schema/geojson.json');
const featureSchema = require('../schema/feature.json');
const sourceSchema = require('../schema/source.json');

let v = new Validator();
v.addSchema(geojsonSchema, 'http://json.schemastore.org/geojson.json');

buildAll();


function buildAll() {
  const START = '🏗   ' + chalk.yellow('Building data...');
  const END = '👍  ' + chalk.green('data built');

  console.log('');
  console.log(START);
  console.time(END);

  // Start clean
  shell.rm('-f', [
    'dist/featureCollection.json',
    'dist/sources.json',
    'i18n/en.yaml'
  ]);

  // Features
  let tstrings = {};   // translation strings
  const features = collectFeatures().sort((a,b) => a.id.localeCompare(b.id));
  const featureCollection = { type: 'FeatureCollection', features: features };
  fs.writeFileSync('dist/featureCollection.json', stringify(featureCollection, { maxLength: 99999 }) + '\n');

  // Sources
  const sources = collectSources(tstrings, featureCollection);
  fs.writeFileSync('dist/sources.json', stringify(sortObject(sources), { maxLength: 99999 }) + '\n');
  fs.writeFileSync('i18n/en.yaml', YAML.dump({ en: { imagery: sortObject(tstrings) } }, { lineWidth: -1 }) );

  console.timeEnd(END);
  console.log('');
}


//
// `collectFeatures`
// Gather all the features from `features/**/*.geojson`
//
function collectFeatures() {
  let features = [];
  let files = {};
  process.stdout.write('📦  Features: ');

  glob.sync('features/**/*.geojson').forEach(file => {
    const contents = fs.readFileSync(file, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(contents);
    } catch (jsonParseError) {
      console.error(chalk.red(`Error - ${jsonParseError.message} in:`));
      console.error('  ' + chalk.yellow(file));
      process.exit(1);
    }

    let feature = geojsonPrecision(geojsonRewind(parsed, true), 4);
    let fc = feature.features;

    // A FeatureCollection with a single feature inside (geojson.io likes to make these).
    if (feature.type === 'FeatureCollection' && Array.isArray(fc) && fc.length === 1) {
      feature = fc[0];
    }

    // use the filename as the feature.id
    const id = path.basename(file).toLowerCase();
    feature.id = id;

    // sort properties
    let obj = {};
    if (feature.type)       { obj.type = feature.type; }
    if (feature.id)         { obj.id = feature.id; }
    if (feature.properties) {
      obj.properties = feature.properties;
      delete obj.properties.id;  // to prevent possiblity of conflicting ids
    } else {
      obj.properties = {};
    }

    if (feature.geometry) {
      if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
        console.error(chalk.red('Error - Feature type must be "Polygon" or "MultiPolygon" in:'));
        console.error('  ' + chalk.yellow(file));
        process.exit(1);
      }
      if (!feature.geometry.coordinates) {
        console.error(chalk.red('Error - Feature missing coordinates in:'));
        console.error('  ' + chalk.yellow(file));
        process.exit(1);
      }
      obj.geometry = {
        type: feature.geometry.type,
        coordinates: feature.geometry.coordinates
      };
    }

    feature = obj;

    validateFile(file, feature, featureSchema);
    prettifyFile(file, feature, contents);

    if (files[id]) {
      console.error(chalk.red('Error - Duplicate filenames: ') + chalk.yellow(id));
      console.error('  ' + chalk.yellow(files[id]));
      console.error('  ' + chalk.yellow(file));
      process.exit(1);
    }
    features.push(feature);
    files[id] = file;

    process.stdout.write(chalk.green('✓'));
  });

  process.stdout.write(' ' + Object.keys(files).length + '\n');

  return features;
}


//
// `collectSources`
// Gather all the sources from `sources/**/*.json`
//
function collectSources(tstrings, featureCollection) {
  let sources = {};
  let files = {};
  const loco = new LocationConflation(featureCollection);
  process.stdout.write('📦  Sources: ');

  glob.sync('sources/**/*.json').forEach(file => {
    const contents = fs.readFileSync(file, 'utf8');
    let source;
    try {
      source = JSON.parse(contents);
    } catch (jsonParseError) {
      console.error(chalk.red(`Error - ${jsonParseError.message} in:`));
      console.error('  ' + chalk.yellow(file));
      process.exit(1);
    }

    // Cleanup the source files to be consistent.
    // Reorder properties and sort array values.
    let obj = {};
    obj.id = source.id;
    obj.type = source.type;

    // locationSet
    obj.locationSet = {};
    obj.locationSet.include = source.locationSet.include;
    if (source.locationSet.exclude) {
      obj.locationSet.exclude = source.locationSet.exclude;
    }
    // force `i18n = true` for worldwide sources
    if (source.locationSet.include.indexOf('001') !== -1) source.i18n = true;
    if (source.locationSet.include.indexOf('Q2') !== -1) source.i18n = true;

    if (source.country_code)        { obj.country_code = source.country_code.toUpperCase(); }
    if (source.name)                { obj.name = source.name; }
    if (source.description)         { obj.description = source.description; }
    if (source.url)                 { obj.url = source.url; }
    if (source.category)            { obj.category = source.category; }
    if (source.min_zoom)            { obj.min_zoom = source.min_zoom; }
    if (source.max_zoom)            { obj.max_zoom = source.max_zoom; }
    if (source.permission_osm)      { obj.permission_osm = source.permission_osm; }
    if (source.license)             { obj.license = source.license; }
    if (source.license_url)         { obj.license_url = source.license_url; }
    if (source.privacy_policy_url)  { obj.privacy_policy_url = source.privacy_policy_url; }
    if (source.best)                { obj.best = source.best; }
    if (source.start_date)          { obj.start_date = source.start_date; }
    if (source.end_date)            { obj.end_date = source.end_date; }
    if (source.overlay)             { obj.overlay = source.overlay; }
    if (source.icon)                { obj.icon = source.icon; }
    if (source.i18n)                { obj.i18n = source.i18n; }

    if (source.available_projections)  {
      let unique = [...new Set(source.available_projections)];
      obj.available_projections = unique.sort(sortProjections);
    }

    if (source.attribution) {
      obj.attribution = {};
      if (source.attribution.required) { obj.attribution.required = source.attribution.required; }
      if (source.attribution.url)      { obj.attribution.url = source.attribution.url; }
      if (source.attribution.text)     { obj.attribution.text = source.attribution.text; }
      if (source.attribution.html)     { obj.attribution.html = source.attribution.html; }
    }

    if (source.no_tile_header) {
      obj.no_tile_header = sortObject(source.no_tile_header);
    }

    source = obj;
    validateFile(file, source, sourceSchema);

    // check locationSet
    try {
      const resolved = loco.resolveLocationSet(source.locationSet);
      if (!resolved.feature.geometry.coordinates.length || !resolved.feature.properties.area) {
        throw new Error(`locationSet ${resolved.id} resolves to an empty feature.`);
      }
    } catch (err) {
      console.error(chalk.red(`Error - ${err.message} in:`));
      console.error('  ' + chalk.yellow(file));
      process.exit(1);
    }

    prettifyFile(file, source, contents);

    const sourceId = source.id;
    if (files[sourceId]) {
      console.error(chalk.red('Error - Duplicate source id: ') + chalk.yellow(sourceId));
      console.error('  ' + chalk.yellow(files[sourceId]));
      console.error('  ' + chalk.yellow(file));
      process.exit(1);
    }

    sources[sourceId] = source;
    files[sourceId] = file;

    // Collect translation strings for some sources..
    if (source.i18n) {
      tstrings[sourceId] = { name: source.name };
      if (source.description) {
        tstrings[sourceId].description = source.description;
      }
      if (source.attribution && source.attribution.text) {
        tstrings[sourceId].attribution = { text: source.attribution.text };
      }
    }

    process.stdout.write(chalk.green('✓'));
  });

  process.stdout.write(' ' + Object.keys(files).length + '\n');

  return sources;
}


function validateFile(file, source, schema) {
  const validationErrors = v.validate(source, schema).errors;
  if (validationErrors.length) {
    console.error(chalk.red('Error - Schema validation:'));
    console.error('  ' + chalk.yellow(file + ': '));
    validationErrors.forEach(error => {
      if (error.property) {
        console.error('  ' + chalk.yellow(error.property + ' ' + error.message));
      } else {
        console.error('  ' + chalk.yellow(error));
      }
    });
    process.exit(1);
  }
}


function prettifyFile(file, object, contents) {
  const pretty = stringify(object, { maxLength: 100 }) + '\n';
  if (pretty !== contents) {
    fs.writeFileSync(file, pretty);
  }
}


// Returns an object with sorted keys and sorted values.
// (This is useful for file diffing)
function sortObject(obj) {
  let sorted = {};
  Object.keys(obj).sort().forEach(k => {
    sorted[k] = Array.isArray(obj[k]) ? obj[k].sort() : obj[k];
  });
  return sorted;
}

function sortProjections(a, b) {
  const aId = parseInt(a.replace('EPSG:', ''), 10);
  const bId = parseInt(b.replace('EPSG:', ''), 10);
  return aId - bId;
}
