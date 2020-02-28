import buble from '@rollup/plugin-buble';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';

// Make a bundle containing:
//  - LocationConflation and CountryCoder
//  - an iD tile layer (which uses d3)
export default {
  external: [
    'd3',
    'd3-array',
    'd3-polygon',
    'd3-geo',
    'd3-zoom',
    '/vector.js'  // literally no idea about this one, not present in bundle
  ],
  input: 'app/index.mjs',
  output: {
    name: 'bundle',
    file: 'docs/bundle.js',
    format: 'iife',
    globals: {
      'd3': 'd3',
      'd3-array': 'd3',
      'd3-polygon': 'd3',
      'd3-geo': 'd3',
      'd3-zoom': 'd3',
      '/vector.js': 'null'  // again no idea
    }
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    json({ indent: '' }),
    buble()
  ],
  treeshake: false
};
