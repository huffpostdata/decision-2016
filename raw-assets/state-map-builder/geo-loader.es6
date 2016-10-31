const fs = require('fs')
const tar = require('tar-fs')
const request = require('request')
const get = require('simple-get')
const AdmZip = require('adm-zip') //unzip library
const shapefile = require('shapefile')
const zlib = require('zlib')

const DataFiles = require('./DataFiles.es6')

function unzip_buffer (bufferObj) {
  console.log(`unzipping ${bufferObj.payload.basename}.zip...`)
  return new Promise((resolve, reject) => {
    let zip = new AdmZip(bufferObj.buffer)
    zip.extractAllTo(`${__dirname}/input`)
    resolve(bufferObj.payload)
  })
}

function unTar (bufferObj) {
  console.log(`untarring ${bufferObj.payload.basename}.tar.gz...`)
  return new Promise((resolve, reject) => {
    //  only way to automate this as of now is to create a new stream with request. Should be changed or done manually
    let stream  = request(bufferObj.payload.url)
      .pipe(zlib.createGunzip())
      .pipe(tar.extract(`${__dirname}/input/`))
      .on('finish', () => {resolve(bufferObj.payload)})
  })
}

function downloadData(obj) {
  return new Promise((resolve, reject) => {
    console.log(`GET ${obj.url}...`)

    get.concat(obj.url, (err, res, buffer) => {
      if (err) throw err

      if(res && buffer) {
        resolve({'buffer': buffer, 'res': res, 'payload':obj})
      } else {
        reject(Error('could not download'))
      }
    })
  })
}

function load_features(obj, path) {
  console.log(`Loading ${obj.dataKey || path}...`)
  return new Promise((resolve, reject) => {
    let shpFilename = path || `${__dirname}/input/${obj.basename}.shp`
    shapefile.read(shpFilename).then((result) => resolve(result.features))
  })
}

function load_all_features() {
  return new Promise((resolve, reject) => {
    const ret = {} // key => feature_collection.features
    const toLoad = Object.keys(DataFiles)

    const step = () => {
      if (toLoad.length == 0) {
        resolve(ret)
      } else {
        let key = toLoad.pop()
        let dataFile = DataFiles[key]
        let isZip = (/\.zip$/.test(dataFile.url))
        let payload = {
          'dataKey': key,
          'dataFile': dataFile,
          'basename': dataFile.basename,
          'shpFilename': `${__dirname}/input/${dataFile.basename}`,
          'url': dataFile.url
        }
        if (isZip) {
          downloadData(payload)
            .then(unzip_buffer)
            .then(load_features)
            .then((result) => {
              ret[key] = result
              process.nextTick(step)
            })
        } else {
          downloadData(payload)
            .then(unTar)
            .then(load_features)
            .then((result) => {
              ret[key] = result
              process.nextTick(step)
            })
        }
      }
    }
    step()
    if (!ret) {
      reject(Error('no features returned'))
    }
  })
}

module.exports = {
  'load_all_features': load_all_features,
  'load_features': load_features
}
