
const $puppetflowRun = require('./src/sandbox/run.js');
const fs = require('fs');
const argv = process.argv.slice(2);
const quiet = argv.includes('-q') || argv.includes('--quiet');
const $json = JSON.parse(fs.readFileSync('./data/run-input.json', 'utf8'));
const appDir = __dirname;
$puppetflowRun(appDir, $json.$context.flow_id, quiet);
