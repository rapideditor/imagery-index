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
* run `npm run build`
  * This will check the files for errors and make them pretty.
  * If you don't have Node installed, you can skip this step and we will do it for you.
* If there are no errors, submit a pull request.


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


### Sources

These are `*.json` files found under the `sources/` folder.
Each source file contains a single JSON object with information about the imagery source.

Source files look like this:

```js
{
  "id": "US-TIGER-Roads-2019",
  "type": "tms",
  "locationSet": {"include": ["us"], "exclude": ["as", "um"]},
  "country_code": "US",
  "name": "TIGER Roads 2019",
  "description": "Yellow = Public domain map data from the US Census. Red = Data not found in OpenStreetMap",
  "url": "https://{switch:a,b,c,d}.tiles.mapbox.com/styles/v1/openstreetmapus/ck0dxfa7602e61cmjk7p86749/tiles/256/{zoom}/{x}/{y}?access_token=pk.eyJ1Ijoib3BlbnN0cmVldG1hcHVzIiwiYSI6ImNpcnF4Ym43dDBoOXZmYW04bWhlNWdrY2EifQ.4SFexuTUuKkZeerO3dgtmw",
  "max_zoom": 22,
  "privacy_policy_url": "https://www.mapbox.com/legal/privacy/",
  "start_date": "2019",
  "end_date": "2019",
  "overlay": true,
  "icon": "TIGER.png"
}
```

Here are the properties that a source file can contain:

* __`id`__ - (required) A unique identifier for the imagery source
* __`type`__ - (required) Type of imagery source, one of `tms`, `wms`, or `bing`
* __`locationSet`__ - (required) Included and excluded locations for this imagery source (see below for details)
* __`name`__ - (required) Display name for this imagery source
(in English, will be sent to Transifex for translation to other languages if `i18n = true`)
* __`description`__ - (required) One line description of the imagery source
(in English, will be sent to Transifex for translation to other languages if `i18n = true`)
* __`url`__ - (required) A url template for the imagery source (see below for details)
* __`category`__ - (optional) A category for the imagery source (see below for details)
* __`min_zoom`__ - (optional) The minimum zoom that the source will return imagery (default = 0)
* __`max_zoom`__ - (optional) The maximum zoom that the source will return imagery (default = 24)
* __`permission_osm`__ - (optional) Can this imagery source be used by OpenStreetMap, one of `explicit`, `implicit`, or `no`.
* __`license`__ - (optional) The license for the imagery specified using a SPDX identifier, or `'COMMERCIAL'`"
* __`license_url`__ - (optional) A URL for the license or permissions for the imagery
* __`privacy_policy_url`__ - (optional) A URL for the privacy policy of the imagery operator
* __`best`__ - (optional) Whether this imagery is the best source for its region (default = `false`)
* __`start_date`__ - (optional) The age of the oldest imagery or data in the source, as an RFC3339 date (or leading portion of one, see below for details)
* __`end_date`__ - (optional) The age of the newest imagery or data in the source, as an RFC3339 date (or leading portion of one, see below for details)
* __`overlay`__ - (optional) `true` if tiles are transparent and can be overlaid on another source (default = `false`)
* __`icon`__ - (optional) A URL for an icon for this imagery source
* __`i18n`__ - (optional) `true` if the imagery name, description, and attribution text should be translated (default = `false`)
(automatically set to `true` for worldwide imagery sources)
* __`country_code`__ - (optional) An ISO 3166-1 alpha-2 two letter country code in uppercase.
* __`available_projections`__ - (required for `wms` sources) An Array of available projections supported by the imagery source
* __`attribution`__ - (optional) An Object containing information about attribution requirements for this imagery source (see below for details)
* __`no_tile_header`__ - (optional) An Object of key-value pairs that can be checked to indicate that a tile is missing


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


#### url

Each source must have a `url` property, containing a url template with replacement tokens. An application will replace the tokens as needed to download image tiles. Whenever possible, use `https` URLs.

Supported TMS tokens:
- `{zoom}`, `{x}`, `{y}` for Z/X/Y tile coordinates
- `{-y}` for flipped TMS-style Y coordinates
- `{switch:a,b,c}` for DNS server multiplexing
- `{apikey}` for an app specific apikey (it is the job of the application to supply this)

Example: `https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png`

Supported WMS tokens:
- `{proj}` - requested projection (e.g. `EPSG:3857`)
- `{wkid}` - Same as proj, but without the EPSG (e.g. `3857`)
- `{width}`, `{height}` - requested image dimensions (e.g. `256`, `512`)
- `{bbox}` - requested bounding box (e.g. `minX,minY,maxX,maxY`)

Example: `http://geodienste-hamburg.de/HH_WMS_Geobasisdaten?FORMAT=image/jpeg&VERSION=1.1.1&SERVICE=WMS&REQUEST=GetMap&LAYERS=13&STYLES=&SRS={proj}&WIDTH={width}&HEIGHT={height}&BBOX={bbox}`


#### category

Each source may have a `category`. The following categories are supported:

Category | Description
:------- | :----------
 `photo` | Aerial or satellite photo
 `map` | A generic map
 `historicmap` | A historic or otherwise outdated map
 `osmbasedmap` | A map based on OSM data
 `historicphoto` | A historic or otherwise outdated aerial or satellite photo
 `qa` | A map for quality assurance
 `elevation` | A map of digital terrain model, digital surface model or contour lines
 `other` | Any other type


#### start_date / end_date

Valid imagery dates may be defined with `start_date` and `end_date` properties:
```js
  "start_date": "2012",
  "end_date": "2014",
```

For simplicity, the schema allows a subset of ISO 8601 defined in [RFC 3339](http://tools.ietf.org/html/rfc3339#section-5.6) except that a partial date is allowed.

For example, `2019-04-15` may be used for a precise date, or `2019-04` for anytime during that month, or `2019` for anytime during that year.

To specify imagery taken sometime in 2019, use:
```js
"start_date": "2019",
"end_date": "2019"
```
Put another way, implementations should _round down_ a partial `start_date` and _round up_ a partial `end_date`, inferring a broadly inclusive date range.


#### attribution

Each source may have a `attribution` requirements:

```js
  "attribution": {
    "required": true,
    "url": "https://wiki.openstreetmap.org/wiki/No:Kartverket_import",
    "text": "© Kartverket"
  }
```

Here are the properties that an attribution Object may contain:

* __`required`__ - (optional) `true` if displaying attribution is required when displaying this imagery (default = `false`)
* __`url`__ - (optional) URL link to the attribution
* __`text`__ - (optional) Display text for the attribution
(in English, will be sent to Transifex for translation to other languages if `i18n = true`)
* __`html`__ - (optional) Display HTML for the attribution
(Note: HTML can not be translated)

Please supply either `text` or `html` but not both. Avoid `html` unless is really is necessary.


### Features

These are optional `.geojson` files found under the `features/` folder. Each feature file must contain a single GeoJSON `Feature` for a region where a imagery source is active. Only `Polygon` and `MultiPolygon` geometries are supported.

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

Note: A `FeatureCollection` containing a single `Feature` is ok too - the build script can handle this.

The build script will automatically generate an `id` property to match the filename.

👉 GeoJSON Protips:
* There are many online tools to create or modify `.geojson` files.
* You can draw and edit GeoJSON polygons with [geojson.io](http://geojson.io) - (Editing MultiPolygons does not work in drawing mode, but you can edit the code directly).
* You can simplify GeoJSON files with [mapshaper.org](https://mapshaper.org/)
* [More than you ever wanted to know about GeoJSON](https://macwright.org/2015/03/23/geojson-second-bite.html)


### Translations

All imagery sources with `i18n = true` support localization of the name, description, and attribution text properties.  These fields should be written in US English.

Translations are managed using the [Transifex](https://www.transifex.com/projects/p/id-editor/) platform.
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
