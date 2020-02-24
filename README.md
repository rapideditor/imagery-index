
# imagery-index

🛰 An index of aerial and satellite imagery useful for mapping.


### About the index

#### tl;dr

To add an imagery source to the index:

* Add source `.json` files under the `sources/` folder
  * Each file contains info about the imagery source: name, url template, license requirements
  * Each file also contains info about which locations the imagery covers. The locations can be country or region codes, points, or custom `.geojson` files in the `features/*` folder.
  * You can copy and change an existing file to get started.
* Run `npm run test`
  * This will check the files for errors and make them pretty.
  * If you don't have Node installed, you can skip this step and we will do it for you.
* If there are no errors, submit a pull request.

:point_right: See [CONTRIBUTING.md](CONTRIBUTING.md) for full details about how to add an imagery source to this index.


#### Source files

The source files for this index are stored in two kinds of files:

* Under `sources/` there are `.json` files to describe the imagery sources
* Under `features/` there are custom `.geojson` files


#### Distributed Files

Several files are published under `dist/`.  These are generated - do not edit them.

* todo


#### Prerequisites

* [Node.js](https://nodejs.org/) version 10 or newer
* [`git`](https://www.atlassian.com/git/tutorials/install-git/) for your platform


#### Installing

* Clone this project, for example:
  `git clone git@github.com:ideditor/imagery-index.git`
* `cd` into the project folder,
* Run `npm install` to install libraries


#### Building

* Just `npm run test`
  * This will check the files for errors and make them pretty.


### License

imagery-index is available under the [ISC License](https://opensource.org/licenses/ISC).
See the [LICENSE.md](LICENSE.md) file for more details.
