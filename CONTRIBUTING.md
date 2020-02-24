## Contributing

*If you don't understand the explanation below, feel free to [post an Issue](https://github.com/ideditor/imagery-index/issues) to describe your imagery sources. That page contains some pointers to help you fill in all the info we need. You do need [a Github account](https://github.com/join) to be able to post an Issue.*

There are 2 kinds of files in this project:

* Under `sources/` there are `.json` files to describe the imagery sources
* Under `features/` there are custom `.geojson` files

### tl;dr

To add your imagery source to the index:

* Add source `.json` files under the `sources/` folder
  * Each file contains info about what the source is (slack, forum, mailinglist, facebook, etc.)
  * Each file also contains info about which locations the source is active. The locations can be country or region codes, points, or custom `.geojson` files in the `features/*` folder.
  * You can copy and change an existing file to get started.
* run `npm run test`
  * This will check the files for errors and make them pretty.
  * If you don't have Node installed, you can skip this step and we will do it for you.
* If there are no errors, submit a pull request.


### Installing

* Clone this project, for example:
  `git clone git@github.com:ideditor/imagery-index.git`
* `cd` into the project folder,
* Run `npm install` to install libraries


### Sources

These are `*.json` files found under the `sources/` folder.
Each source file contains a single JSON object with information about the imagery source.

Source files look like this:

```js
{
  "id":
  "type":
  "locationSet": { "include": ["us"] }
  "name":
  "description":
  "extendedDescription":
  "url":
}
```

Here are the properties that a source file can contain:

* __`id`__ - (required) A unique identifier for the source.
* __`type`__ - (required) Type of imagery source, one of `tms` or `wms`.
* __`locationSet`__ - (required) Where the imagery source is active (see below for details).
* __`name`__ - (required) Display name for this imagery source
(in English, will be sent to Transifex for translation to other languages)
* __`description`__ - (required) One line description of the imagery source
(in English, will be sent to Transifex for translation to other languages)
* __`extendedDescription`__ - (optional) Longer description of the imagery source
(in English, will be sent to Transifex for translation to other languages)
* __`url`__ - (required) A url template for the imagery source


#### locationSet

Each source must have a `locationSet` to define where the source is active.

```js
"locationSet": {
  "include": [ Array of locations ],   // required
  "exclude": [ Array of locations ]    // optional
}
```

The "locations" can be any of the following:
* Codes recognized by the [country-coder library](https://github.com/ideditor/country-coder#readme). These should be [ISO 3166-1 2 or 3 letter country codes or UN M.49 numeric codes](https://en.wikipedia.org/wiki/List_of_countries_by_United_Nations_geoscheme).<br/>_Example: `"de"`_
* Points as `[longitude, latitude]` coordinate pairs.  A 25km radius circle will be computed around the point.<br/>_Example: `[8.67039, 49.41882]`_
* Filenames for `.geojson` features. If you want to use your own features, you'll need to add these under the `features/` folder.  Each `Feature` must have an `id` that ends in `.geojson`.<br/>_Example: `"de-hamburg.geojson"`_<br/>Tip: You can use [geojson.io](http://geojson.io) or other tools to create these.

See [location-conflation](https://github.com/ideditor/location-conflation#readme) project for details and examples.


### Features

These are optional `*.geojson` files found under the `features/` folder. Each feature file contains a single GeoJSON `Feature` for a region where a imagery source is active.

Feature files look like this:

```js
{
  "type": "Feature",
  "id": "boston_metro.geojson",
  "properties": {},
  "geometry": {
    "type": "Polygon",
    "coordinates": [...]
  }
}
```

Note:  A `FeatureCollection` containing a single `Feature` is ok too - the build script can handle this.

There are many online tools to create or modify these `.geojson` files.
Drawing a simple shape with [geojson.io](http://geojson.io) works great.


### Building

* Just `npm run test`
  * This will check the files for errors and make them pretty.


### Translations

All imagery sources automatically support localization of the
`name`, `description`, and `extendedDescription` text.  These fields
should be written in US English.

Translations are managed using the
[Transifex](https://www.transifex.com/projects/p/id-editor/) platform.
After signing up, you can go to [iD's project page](https://www.transifex.com/projects/p/id-editor/),
select a language and click **Translate** to start translating.

The translation strings for this project are located in a resource called
[**imagery**](https://www.transifex.com/openstreetmap/id-editor/imagery/).


#### For maintainers

Transifex will automatically fetch the source file from this repository daily.
We need to manually pull down and check in the translation files whenever we
make a new release (see [RELEASE.md](RELEASE.md)).

To work with translation files,
[install the Transifex Client](https://docs.transifex.com/client/introduction) software.

The Transifex Client uses a file
[`~/.transifex.rc`](https://docs.transifex.com/client/client-configuration#-transifexrc)
to store your username and password.

Note that you can also use a
[Transifex API Token](https://docs.transifex.com/api/introduction#authentication)
in place of your username and password.  In this usage, the username is `api`
and the password is the generated API token.

Once you have installed the client and setup the `~/.transifex.rc` file, you can
use the following commands:

* `tx push -s`  - upload latest source `/i18n/en.yaml` file to Transifex
* `tx pull -a`  - download latest translation files to `/i18n/<lang>.yaml`

For convenience you can also run these commands as `npm run txpush` or `npm run txpull`.
