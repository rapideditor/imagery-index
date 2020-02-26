import buble from '@rollup/plugin-buble';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';

// Make a bundle containing LocationConflation and CountryCoder
export default {
  input: 'app/index.mjs',
  output: {
    name: 'LocationConflation',
    file: 'docs/bundle.js',
    format: 'iife'
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    json({ indent: '' }),
    buble()
  ],
  treeshake: false
};
