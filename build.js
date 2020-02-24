const calcArea = require('@mapbox/geojson-area');
const colors = require('colors/safe');
const fs = require('fs');
const glob = require('glob');
const LocationConflation = require('@ideditor/location-conflation');
const path = require('path');
const precision = require('geojson-precision');
const prettyStringify = require('json-stringify-pretty-compact');
const rewind = require('geojson-rewind');
const shell = require('shelljs');
const Validator = require('jsonschema').Validator;
const YAML = require('js-yaml');

const geojsonSchema = require('./schema/geojson.json');
const featureSchema = require('./schema/feature.json');
const sourceSchema = require('./schema/source.json');

let v = new Validator();
v.addSchema(geojsonSchema, 'http://json.schemastore.org/geojson.json');

buildAll();


function buildAll() {
  const START = '🏗   ' + colors.yellow('Building data...');
  const END = '👍  ' + colors.green('data built');

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
  const features = collectFeatures();
  const featureCollection = { type: 'FeatureCollection', features: features };
  fs.writeFileSync('dist/featureCollection.json', prettyStringify(featureCollection, { maxLength: 9999 }));

  // Sources
  const sources = collectSources(tstrings, featureCollection);
  fs.writeFileSync('dist/sources.json', prettyStringify({ sources: sort(sources) }, { maxLength: 9999 }));
  fs.writeFileSync('i18n/en.yaml', YAML.safeDump({ en: sort(tstrings) }, { lineWidth: -1 }) );

  console.timeEnd(END);
}


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
      console.error(colors.red(`Error - ${jsonParseError.message} in:`));
      console.error('  ' + colors.yellow(file));
      process.exit(1);
    }

    let feature = precision(rewind(parsed, true), 5);
    let fc = feature.features;

    // A FeatureCollection with a single feature inside (geojson.io likes to make these).
    if (feature.type === 'FeatureCollection' && Array.isArray(fc) && fc.length === 1) {
      feature = fc[0];
    }

    // warn if this feature is so small it would better be represented as a point.
    let area = calcArea.geometry(feature.geometry) / 1e6;   // m² to km²
    area = Number(area.toFixed(2));
    if (area < 2000) {
      console.warn(colors.yellow(`Warning - small area (${area} km²).  Use a point 'includeLocation' instead.`));
      console.warn('  ' + colors.yellow(file));
    }

    // use the filename as the feature.id
    const id = path.basename(file).toLowerCase();
    feature.id = id;

    // sort properties
    let obj = {};
    if (feature.type)       { obj.type = feature.type; }
    if (feature.id)         { obj.id = feature.id; }
    if (feature.properties) { obj.properties = feature.properties; }
    if (feature.geometry)   { obj.geometry = feature.geometry; }
    feature = obj;

    validateFile(file, feature, featureSchema);
    prettifyFile(file, feature, contents);

    if (files[id]) {
      console.error(colors.red('Error - Duplicate filenames: ') + colors.yellow(id));
      console.error('  ' + colors.yellow(files[id]));
      console.error('  ' + colors.yellow(file));
      process.exit(1);
    }
    features.push(feature);
    files[id] = file;

    process.stdout.write(colors.green('✓'));
  });

  process.stdout.write(' ' + Object.keys(files).length + '\n');

  return features;
}


function collectSources(tstrings, featureCollection) {
  let sources = {};
  let files = {};
  const loco = new LocationConflation(featureCollection);
  process.stdout.write('📦  Sources: ');

  glob.sync('sources/**/*.json').forEach(file => {
    let contents = fs.readFileSync(file, 'utf8');

    let source;
    try {
      source = JSON.parse(contents);
    } catch (jsonParseError) {
      console.error(colors.red(`Error - ${jsonParseError.message} in:`));
      console.error('  ' + colors.yellow(file));
      process.exit(1);
    }

    // // sort properties and array values
    // let obj = {};
    // if (source.id)    { obj.id = source.id; }
    // if (source.type)  { obj.type = source.type; }

    // if (source.locationSet) {
    //   obj.locationSet = {};
    //   if (source.locationSet.include) { obj.locationSet.include = source.locationSet.include; }
    //   if (source.locationSet.exclude) { obj.locationSet.exclude = source.locationSet.exclude; }
    // }

    // if (source.languageCodes)       { obj.languageCodes = source.languageCodes.sort(); }
    // if (source.name)                { obj.name = source.name; }
    // if (source.description)         { obj.description = source.description; }
    // if (source.extendedDescription) { obj.extendedDescription = source.extendedDescription; }
    // if (source.url)                 { obj.url = source.url; }
    // if (source.signupUrl)           { obj.signupUrl = source.signupUrl; }
    // if (source.contacts)            { obj.contacts = source.contacts; }
    // if (source.order)               { obj.order = source.order; }
    // if (source.events)              { obj.events = source.events; }
    // source = obj;

    validateFile(file, source, sourceSchema);

    (source.locationSet.include || []).forEach(location => {
      if (!loco.validateLocation(location)) {
        console.error(colors.red('Error - Invalid include location: ') + colors.yellow(location));
        console.error('  ' + colors.yellow(file));
        process.exit(1);
      }
    });

    (source.locationSet.exclude || []).forEach(location => {
      if (!loco.validateLocation(location)) {
        console.error(colors.red('Error - Invalid exclude location: ') + colors.yellow(location));
        console.error('  ' + colors.yellow(file));
        process.exit(1);
      }
    });

    prettifyFile(file, source, contents);

    let sourceId = source.id;
    if (files[sourceId]) {
      console.error(colors.red('Error - Duplicate source id: ') + colors.yellow(sourceId));
      console.error('  ' + colors.yellow(files[sourceId]));
      console.error('  ' + colors.yellow(file));
      process.exit(1);
    }

    sources[sourceId] = source;
    files[sourceId] = file;

    // collect translation strings for this source
    tstrings[sourceId] = {
      name: source.name,
      description: source.description
    };

    if (source.extendedDescription) {
      tstrings[sourceId].extendedDescription = source.extendedDescription;
    }

    process.stdout.write(colors.green('✓'));
  });

  process.stdout.write(' ' + Object.keys(files).length + '\n');

  return sources;
}


function validateFile(file, source, schema) {
  const validationErrors = v.validate(source, schema).errors;
  if (validationErrors.length) {
    console.error(colors.red('Error - Schema validation:'));
    console.error('  ' + colors.yellow(file + ': '));
    validationErrors.forEach(error => {
      if (error.property) {
        console.error('  ' + colors.yellow(error.property + ' ' + error.message));
      } else {
        console.error('  ' + colors.yellow(error));
      }
    });
    process.exit(1);
  }
}


function prettifyFile(file, object, contents) {
  const pretty = prettyStringify(object, { maxLength: 100 });
  if (pretty !== contents) {
    fs.writeFileSync(file, pretty);
  }
}


// Returns an object with sorted keys and sorted values.
// (This is useful for file diffing)
function sort(obj) {
  let sorted = {};
  Object.keys(obj).sort().forEach(k => {
    sorted[k] = Array.isArray(obj[k]) ? obj[k].sort() : obj[k];
  });
  return sorted;
}
