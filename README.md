
# imagery-index

🛰 An index of aerial and satellite imagery useful for mapping.

Play with the source files here: https://ideditor.github.io/imagery-index/


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


#### Source files

The source files for this index are stored in two kinds of files:

* Under `sources/` there are `.json` files to describe the imagery sources
* Under `features/` there are custom `.geojson` files


#### Distributed Files

Several files are published under `dist/`.  These are generated - do not edit them.

* `dist/`
  * `featureCollection.json` - All of the custom GeoJSON features.
  * `sources.json` -  All of the sources.
  * `combined.json` -  A "join" of every GeoJSON feature with the image sources stored in a `sources` property.
  * `legacy/` - Compatible editor-layer-index style files.
    * `imagery.geojson` - A GeoJSON featureCollection of all imagery sources
    * `imagery.json` -  An Array of all imagery sources
    * `imagery.xml` -  JOSM compatible imagery source XML
  * `images/` - many of the source logos can be found here

🧐: "Why use `.json` instead of `.geojson` for the file extension for generated GeoJSON files?"
🤓: "So you can `require` or `import` them as modules into other JavaScript code if you want."

```js
const LocationConflation = require('@ideditor/location-conflation');
const featureCollection = require('@ideditor/imagery-index/dist/featureCollection.json');
const loco = new LocationConflation(featureCollection);
const feature = loco.resolveLocationSet({include: ['hr'], exclude: ['dgu-dof-exclude-2017.geojson']});
```
<img width="600px" alt="Croatia Custom GeoJSON" src="https://raw.githubusercontent.com/ideditor/imagery-index/master/docs/images/croatia-custom-geojson.png"/>


#### Prerequisites

* [Node.js](https://nodejs.org/) version 10 or newer
* [`git`](https://www.atlassian.com/git/tutorials/install-git/) for your platform


#### Installing

* Clone this project, for example:
  `git clone git@github.com:ideditor/imagery-index.git`
* `cd` into the project folder,
* Run `npm install` to install dependencies


#### Building

For contributors:
* `npm run build` - This will check the files and make them pretty

For maintainers:
* `npm run test` - Same as "build" but also checks the source code
* `npm run stats` - Generate some statistics about the file sizes
* `npm run dist` - Generate distibuted and minified files under `dist/`
* `npm run appbuild` - Generate the JavaScript bundle for the preview site
https://ideditor.github.io/imagery-index/


### License

imagery-index is available under the [ISC License](https://opensource.org/licenses/ISC).
See the [LICENSE.md](LICENSE.md) file for more details.
