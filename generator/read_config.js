const fs = require('fs')
const yaml = require('js-yaml')

module.exports = function read_config(basename) {
  return yaml.safeLoad(fs.readFileSync(`${__dirname}/../config/${basename}.yml`, 'utf-8'))
}
