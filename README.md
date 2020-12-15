[![build](https://github.com/ideditor/imagery-index/workflows/build/badge.svg)](https://github.com/ideditor/imagery-index/actions?query=workflow%3A%22build%22)
[![npm version](https://badge.fury.io/js/%40ideditor%2Fimagery-index.svg)](https://badge.fury.io/js/%40ideditor%2Fimagery-index)

# imagery-index

🛰 An index of aerial and satellite imagery useful for mapping.

Play with the data here: https://ideditor.github.io/imagery-index/


### About the index

#### tl;dr

To add an imagery source to the index:

* Add source `.json` files under the `sources/` folder
  * Each file contains info about the imagery source: name, url template, license requirements
  * Each file also contains info about which locations the imagery covers. The locations can be country or region codes, or custom `.geojson` files in the `features/*` folder.
  * You can copy and change an existing file to get started.
* Run `npm run build`
  * This will check the files for errors and make them pretty.
  * If you don't have Node installed, you can skip this step and we will do it for you.
* If there are no errors, submit a pull request.

👉 See [CONTRIBUTING.md](CONTRIBUTING.md) for full details about how to add an imagery source to this index.


### Details

The goal of **imagery-index** is to collect public imagery sources useful for making maps.  We use imagery-index in the [iD editor](https://github.com/openstreetmap/iD).

This project evolved from a previous project called [editor-layer-index](https://github.com/osmlab/editor-layer-index). Thank you, editor-layer-index!

To avoid distributing redundant geojson data, imagery-index leverages several other projects:
  * [country-coder](https://github.com/ideditor/country-coder) - a dataset of the world's country and region borders.
  * [location-conflation](https://github.com/ideditor/location-conflation) - a library for defining complex geographic regions. Each `locationSet` may contain `include` and `exclude` regions.

Before: Include multiple redundant copies of a 5kb boundary of Slovakia<br/>
After: `"locationSet": {"include": ["sk"]}`

Before: Include 67kb outline of the contiguous United States<br/>
After: `"locationSet": {"include": ["us"], "exclude": ["as", "um", "alaska_hawaii.geojson"]}`

The space savings are significant:

Project | Size
------- | ----
osmlab/editor-layer-index  | 2.1Mb minified `imagery.geojson`
@ideditor/imagery-index    | 221kb features, 354kb sources (575kb total)

It's also much easier to contribute to and maintain the index.

What's not included (yet):
* historic scanned imagery from the United Kingdom.
* sources that used `wmts` or `wms_endpoint` types.


### Source files

The source files for imagery-index are stored in two kinds of files:

* Under `sources/` there are `.json` files to describe the imagery sources
* Under `features/` there are custom `.geojson` files

👉 See [CONTRIBUTING.md](CONTRIBUTING.md) for full details about how to add an imagery source to this index.


### Distributed Files

Several files are published under `dist/`.  These are generated - do not edit them.

* `dist/`
  * `featureCollection.json` - A GeoJSON FeatureCollection containing only the custom features
  * `sources.json` -  An Object containing all of the sources
  * `combined.json` -  A "join" of every GeoJSON feature with the image sources stored in a `sources` property.
  * `legacy/` - Compatible editor-layer-index style files
    * `imagery.geojson` - A GeoJSON FeatureCollection of all imagery sources (including from country-coder)
    * `imagery.json` - An Array of all imagery sources and their properties
    * `imagery.xml` - A [JOSM-compatible](https://josm.openstreetmap.de/wiki/Maps#Documentation) imagery source XML file
  * `images/` - many of the source logos can be found here

🧐: "Why use `.json` instead of `.geojson` as the file extension for generated GeoJSON files?"<br/>
🤓: "So you can `require` or `import` them as modules into other JavaScript code if you want."<br/>
🧐: "Can you give me an example?"<br/>
🤓: "Great segue!..."<br/>


### Examples

Let's create a `LocationConflation` instance and seed it with the `featureCollection.json` containing all the custom geojsons from imagery-index.  We'll grab the imagery `sources.json` too.
```js
const sources = require('@ideditor/imagery-index/dist/sources.json');
const features = require('@ideditor/imagery-index/dist/featureCollection.json');

const LocationConflation = require('@ideditor/location-conflation');
const loco = new LocationConflation(features);
```

We can use these to get info about the imagery sources.  A simple one might just be "include all of Croatia":
```js
let source = sources['dgu-dof-2011'];
source.name;
//  "dgu.hr: Croatia 2011 Aerial imagery"
source.locationSet;
//  { include: [ 'hr' ] }
let feature = loco.resolveLocationSet(source.locationSet);
```

<img width="500px" alt="Croatia Aerial Imagery 2011" src="https://raw.githubusercontent.com/ideditor/imagery-index/main/docs/images/croatia-2011.png"/>

But we're not limited only to country borders. For example in 2017, only portions of Croatia were imaged. The `locationSet` contains a custom .geojson to exclude a squarish region from the middle of the country:
```js
let source = sources['dgu-dof-2017'];
source.name;
//  "dgu.hr: Croatia 2017 Aerial imagery"
source.locationSet;
//  {include: ['hr'], exclude: ['dgu-dof-exclude-2017.geojson']}
let feature = loco.resolveLocationSet(source.locationSet);
```

<img width="500px" alt="Croatia Aerial Imagery 2017" src="https://raw.githubusercontent.com/ideditor/imagery-index/main/docs/images/croatia-2017.png"/>

In 2018, they imaged the rest of Croatia. A different .geojson file is used to exclude Croatia's outer regions:
```js
let source = sources['dgu-dof-2018'];
source.name;
//  "dgu.hr: Croatia 2018 Aerial imagery"
source.locationSet;
//  {include: ['hr'], exclude: ['dgu-dof-exclude-2018.geojson']}
let feature = loco.resolveLocationSet(source.locationSet);
```

<img width="500px" alt="Croatia Aerial Imagery 2018" src="https://raw.githubusercontent.com/ideditor/imagery-index/main/docs/images/croatia-2018.png"/>


### Interactive Viewer

Try out the interactive source viewer at https://ideditor.github.io/imagery-index/ to inspect any of the imagery sources visually and to compare them to their boundary polygons. You can also test different `locationSet` values to see what they look like.

The viewer itself is just a single .html page using:
  * A [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/api/) base layer, and
  * The raster tile code from [iD](https://github.com/openstreetmap/iD) sitting on top of it.

The code for the is in [`docs/index.html`](https://github.com/ideditor/imagery-index/blob/main/docs/index.html).

🧐: "Why use iD's `<img>`-based slippy map code instead of adding a Mapbox GL raster layer?"<br/>
😭: "[CORS is why](https://github.com/ideditor/imagery-index/issues/1). WebGL needs access to the pixels of an image in order to render it, and this can't happen unless the tile server has the necessary CORS header set. The good news is: if an imagery source works here, it will work in iD also."<br/>


### Prerequisites

* [Node.js](https://nodejs.org/) version 10 or newer
* [`git`](https://www.atlassian.com/git/tutorials/install-git/) for your platform


### Installing

* Clone this project, for example:
  `git clone git@github.com:ideditor/imagery-index.git`
* `cd` into the project folder,
* Run `npm install` to install dependencies


### Building

For contributors:
* `npm run build` - This will check the files and make them pretty

For maintainers:
* `npm run test` - Same as "build" but also checks the source code
* `npm run stats` - Generate some statistics about the file sizes
* `npm run dist` - Generate distibuted and minified files under `dist/`
* `npm run appbuild` - Generate the JavaScript bundle used by the preview site: https://ideditor.github.io/imagery-index/


### Licenses

imagery-index data files are available under the [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
See the [LICENSE.md](LICENSE.md) file for more details.

imagery-index build scripts are available separately under the [ISC License](https://opensource.org/licenses/ISC).
See the [scripts/LICENSE.md](scripts/LICENSE.md) file for more details.
