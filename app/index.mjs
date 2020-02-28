import LocationConflation from '@ideditor/location-conflation';
export { LocationConflation };

import { select as d3_select } from 'd3';
import { geoScaleToZoom } from '../node_modules/iD/modules/geo/geo.js';
import { utilTiler } from '../node_modules/iD/modules/util/tiler.js';


export function TileLayer() {
  let tiler = utilTiler();

  let _tileSize = 256;
  let _projection;
  let _cache = {};
  let _tileOrigin;
  let _zoom;
  let _source;


  function tileSizeAtZoom(d, z) {
    const EPSILON = 0.002;    // close seams
    return ((_tileSize * Math.pow(2, z - d[2])) / _tileSize) + EPSILON;
  }

  function atZoom(t, distance) {
    const power = Math.pow(2, distance);
    return [
      Math.floor(t[0] * power),
      Math.floor(t[1] * power),
      t[2] + distance
    ];
  }

  function lookUp(d) {
    for (let up = -1; up > -d[2]; up--) {
      let tile = atZoom(d, up);
      if (_cache[_source.url(tile)] !== false) {
        return tile;
      }
    }
  }

  function uniqueBy(a, n) {
    let o = [];
    let seen = {};
    for (let i = 0; i < a.length; i++) {
      if (seen[a[i][n]] === undefined) {
        o.push(a[i]);
        seen[a[i][n]] = true;
      }
    }
    return o;
  }


  function addSource(d) {
    d.push(_source.url(d));
    return d;
  }


  // Update tiles based on current state of `projection`.
  function tilelayer(selection) {
    _zoom = geoScaleToZoom(_projection.scale(), _tileSize);

    let translate = [
      _projection.translate()[0],
      _projection.translate()[1]
    ];

    tiler
      .scale(_projection.scale() * 2 * Math.PI)
      .translate(translate);

    _tileOrigin = [
      _projection.scale() * Math.PI - translate[0],
      _projection.scale() * Math.PI - translate[1]
    ];

    render(selection);
  }


  // Derive the tiles onscreen, remove those offscreen and position them.
  // Important that this part not depend on `_projection` because it's
  // rentered when tiles load/error (see #644).
  function render(selection) {
    if (!_source) return;

    let requests = [];
    if (_source.validZoom(_zoom)) {
      tiler().forEach(d => {
        addSource(d);
        if (d[3] === '') return;
        if (typeof d[3] !== 'string') return; // iD #2295
        requests.push(d);
        if (_cache[d[3]] === false && lookUp(d)) {
          requests.push(addSource(lookUp(d)));
        }
      });
      requests = uniqueBy(requests, 3)
        .filter(r => _cache[r[3]] !== false);  // skip tiles which have failed in the past
    }

    let image = selection.selectAll('img')
      .data(requests, (d) => d[3]);

    image.exit()
      .style('transform', imageTransform)
      .classed('tile-removing', true)
      .each((d, i, nodes) => {
        let tile = d3_select(nodes[i]);
        window.setTimeout(() => {
          if (tile.classed('tile-removing')) {
            tile.remove();
          }
        }, 300);
      });

    image.enter()
      .append('img')
        .attr('class', 'tile')
        .style('width', `${_tileSize}px`)
        .style('height', `${_tileSize}px`)
        .attr('src', (d) => d[3])
        .on('error', error)
        .on('load', load)
      .merge(image)
        .style('transform', imageTransform)
        .classed('tile-removing', false);


    function load(d, i, nodes) {
      _cache[d[3]] = true;
      d3_select(nodes[i])
        .on('error', null)
        .on('load', null)
        .classed('tile-loaded', true);
      render(selection);
    }

    function error(d, i, nodes) {
      _cache[d[3]] = false;
      d3_select(nodes[i])
        .on('error', null)
        .on('load', null)
        .remove();
      render(selection);
    }

    function imageTransform(d) {
      const ts = _tileSize * Math.pow(2, _zoom - d[2]);
      const scale = tileSizeAtZoom(d, _zoom);
      return 'translate(' +
        ((d[0] * ts) - _tileOrigin[0]) + 'px,' +
        ((d[1] * ts) - _tileOrigin[1]) + 'px) ' +
        'scale(' + scale + ',' + scale + ')';
    }
  }


  tilelayer.projection = function(val) {
    if (!arguments.length) return _projection;
    _projection = val;
    return tilelayer;
  };


  tilelayer.dimensions = function(val) {
    if (!arguments.length) return tiler.size();
    tiler.size(val);
    return tilelayer;
  };


  tilelayer.source = function(val) {
    if (!arguments.length) return _source;
    _source = val;
    _tileSize = _source.tileSize;
    _cache = {};
    tiler.tileSize(_source.tileSize).zoomExtent(_source.zoomExtent);
    return tilelayer;
  };

  return tilelayer;
}


