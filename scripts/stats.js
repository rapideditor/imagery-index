const bytes = require('bytes');
const chalk = require('chalk');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const Table = require('easy-table');

getStats();

function getStats() {
  let featureSize = 0;
  let sourceSize = 0;
  let featureFiles = 0;
  let sourceFiles = 0;
  let currSize = 0;
  let currFiles = 0;

  let t = new Table;
  currSize = 0;
  currFiles = 0;
  glob.sync('features/**/*.geojson').forEach(addRow);
  t.sort(['Size|des']);
  console.log(t.toString());
  featureSize = bytes(currSize, { unitSeparator: ' ' });
  featureFiles = currFiles;

  t = new Table;
  currSize = 0;
  currFiles = 0;
  glob.sync('sources/**/*.json').forEach(addRow);
  t.sort(['Size|des']);
  console.log(t.toString());
  sourceSize = bytes(currSize, { unitSeparator: ' ' });
  sourceFiles = currFiles;

  console.info(`\nTotals:`);
  console.info(`-------`);
  console.info(chalk.blue.bold(`Features:  ${featureSize} in ${featureFiles} files.`));
  console.info(chalk.blue.bold(`Sources:   ${sourceSize} in ${sourceFiles} files.`));
  console.info('');


  function addRow(file) {
    const stats = fs.statSync(file);
    const color = colorBytes(stats.size);
    currSize += stats.size;
    currFiles++;

    t.cell('Size', stats.size, (val, width) => {
      const displaySize = bytes(stats.size, { unitSeparator: ' ' });
      return width ? Table.padLeft(displaySize, width) : color(displaySize);
    });
    t.cell('File', color(path.basename(file)));
    t.newRow();
  }

  function colorBytes(size) {
    if (size > 1024 * 10) {  // 10 KB
      return chalk.red;
    } else if (size > 1024 * 2) {  // 2 KB
      return chalk.yellow;
    } else {
      return chalk.green;
    }
  }
}

