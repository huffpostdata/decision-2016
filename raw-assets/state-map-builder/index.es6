'use strict'

const d3 = require('d3')
const deep_copy = require('deep-copy')
const fs = require('fs')
const topojson = require('topojson')
const jsts = require('jsts')
const geo_loader = require('./geo-loader.es6')

require('d3-geo-projection')(d3)

const MaxWidth = 1000
const MaxHeight = 1000
const MinDistanceBetweenCities = 80

const BigTopojsonOptions = {
  'pre-quantization': 10000,
  'post-quantization': 1000,
  'coordinate-system': 'cartesian',
  'minimum-area': 20,
  'preserve-attached': false,
  'property-transform': (f) => f.properties
}

const TinyTopojsonOptions = {
  'pre-quantization': 10000,
  'post-quantization': 1000,
  'coordinate-system': 'cartesian',
  'minimum-area': 200,
  'preserve-attached': false,
  'property-transform': (f) => {}
}

class JstsFeature {
  constructor (geometry, properties) {
    this.geometry = geometry
    this.properties = properties
  }
  toJSON() {
    return {'type': 'Feature',
      'geometry': JSON.parse(JSON.stringify(GeoJSONWriter.write(this.geometry))),
      'properties': this.properties
    }
  }
}

class StateFeatureSet {
  constructor (jsts_state_multipolygon, jsts_district_features, jsts_county_features, jsts_subcounty_features, jsts_city_features) {
    this.jsts_state_multipolygon = jsts_state_multipolygon
    this.jsts_district_features = jsts_district_features
    this.jsts_county_features = jsts_county_features
    this.jsts_subcounty_features = jsts_subcounty_features
    this.jsts_city_features = jsts_city_features
  }

  toJSON() {
    function features(fs) {
      return fs
        .map(f => f.toJSON())
        .filter(f => f.geometry)
        .filter(f => f.geometry.type != 'Polygon' || f.geometry.coordinates[0].length > 0)
    }

    return {
      'state': {
        'type': 'Feature',
        'geometry': JSON.parse(JSON.stringify(GeoJSONWriter.write(this.jsts_state_multipolygon)))
      },
      'districts': {
        'type': 'FeatureCollection',
        'features': features(this.jsts_district_features)
      },
      'counties': {
        'type': 'FeatureCollection',
        'features': features(this.jsts_county_features)
      },
      'subcounties': {
        'type': 'FeatureCollection',
        'features': features(this.jsts_subcounty_features)
      },
      'cities': {
        'type': 'FeatureCollection',
        'features': this.jsts_city_features
      }
    }
  }
}

const GeoJSONReader = new jsts.io.GeoJSONReader()
const GeoJSONWriter = new jsts.io.GeoJSONWriter()
const GeoJSONCRS ={
  'type': 'name',
  'properties': {
    'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'
  }
}


const featuresByState = {}
const fipsToState = {}
function organize_features (key, features) {
  if (key === 'land') {
    for (let feature of features) {
      fipsToState[feature.properties['STATE_FIPS']] = feature.properties['STATE_ABBR']
    }
  }
  console.log(`organizing ${key} by state`)
  for (let feature of features) {
    let stateCode = feature.properties.STATEFP || feature.properties.STATE_FIPS

    if (key === 'land' && feature.properties.TYPE !== 'Land') continue

    if (!featuresByState.hasOwnProperty(stateCode)) {
      featuresByState[stateCode] = {'land': [], 'counties': [], 'districts': [], 'subcounties': [], 'cities': []}
    }
    if (fipsToState[stateCode] === 'AK' && key === 'counties') {
      //do nothing
    } else {
      featuresByState[stateCode][key].push(feature)
    }
  }
}

function organize_subcounty_features(stateCode, features) {
  console.log(`Organizing ${fipsToState[stateCode]} subcounties...`)
  for (let feature of features) {
    featuresByState[stateCode].subcounties.push(feature)
  }
}

function calculate_projection_width_height(state_geojson) {
  //  Calculate projection parameters
  const alaska_safe_projection = (arr) => {
    const firstEl = arr[0] > 172 ? -360 + arr[0] : arr[0]
    return [firstEl, arr[1]]
  }
  const path1 = d3.geo.path().projection(alaska_safe_projection)
  const ll_bounds = path1.bounds(state_geojson)

  const lon = (ll_bounds[0][0] + ll_bounds[1][0]) / 2
  const lat = (ll_bounds[0][1] + ll_bounds[1][1]) / 2
  //  parallels at 1/6 and 5/6: http://www.georeference.org/doc/albers_conical_equal_area.htm
  const lats= [
    ll_bounds[0][1] + 5 / 6 * (ll_bounds[1][1] - ll_bounds[0][1]),
    ll_bounds[0][1] + 1 / 6 * (ll_bounds[1][1] - ll_bounds[0][1])
  ]
  const projection = d3.geo.albers()
    .rotate([ -lon, 0])
    .center([0, lat])
    .parallels(lats)
    .scale(1)
    .translate([0, 0])

  //  scale to fill the center of the SVG: http://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
  const path2 = d3.geo.path().projection(projection)
  const b = path2.bounds(state_geojson)

  let width = MaxWidth
  let height = MaxHeight
  const aspectRatio = (b[1][0] - b[0][0]) / (b[1][1] - b[0][1])

  if (aspectRatio > 1) {
    height = Math.ceil(width / aspectRatio)
  } else {
    width = Math.ceil(height * aspectRatio)
  }

  var s = 0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height)
  var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2]

  projection.scale(s).translate(t)

  return [ projection, width, height ]
}


function project_features(features, projection) {
  var ret = {}
  for (let key of Object.keys(features)) {
    ret[key] = d3.geo.project(features[key], projection)
  }
  return ret
}

function topojsonize(features_json, options) {
  //Modeled after topojson's bin/topojson
  const x = deep_copy(features_json)
  const topology = topojson.topology(x, options)
  topojson.simplify(topology, options)
  topojson.filter(topology, options)
  topojson.prune(topology, options)
  return topology
}

const compress_svg_path = (path) => {
  // First off, round everything. That'll give us four decimals, like we want
  const int_path = path.replace(/\.\d+/g, '')
  let point = null
  let last_point = null
  let last_instruction = null
  let out = [] // Array of String instructions with coordinates

  let next_instruction_index = 0
  const instr_regex = /([a-zA-Z ])(?:(\d+),(\d+))?/g

  // We want to bundle "v" and "h" instructions together, where applicable.
  // (There are lots and lots of them in the congressional-district data.)
  let current_line = {
    'instruction': null,
    'd': null // dx or dy
  }

  const flush = () => {
    if (current_line.instruction) {
      out.push(`${current_line.instruction}${current_line.d}`)
      current_line.instruction = current_line.d = null
    }
  }

  const start_or_continue_current_line = (instruction, d) => {
    if (current_line.instruction == instruction && current_line.d * d > 0) {
      current_line.d += d
    } else {
      flush()
      current_line.instruction = instruction
      current_line.d = d
    }
  }

  let match = instr_regex.exec(int_path)
  while (match != null) {
    if (next_instruction_index !== instr_regex.lastIndex - match[0].length) {
      throw new Error(`Found a non-instruction at position ${next_instruction_index} of path ${int_path}. Next instruction was at position ${instr_regex.lastIndex}. Aborting.`)
    }
    next_instruction_index = instr_regex.lastIndex

    switch (match[1]) {
      case 'Z':
        flush()
        last_instruction = 'Z'
        last_point = null
        out.push('Z')
        break

      case 'M':
        flush()
        point = [ +match[2], +match[3] ]

        last_point = point
        last_instruction = 'M'
        out.push(`M${point[0]},${point[1]}`)
        break

      case 'L':
        if (!last_point) {
          throw 'Got an L instruction without a previous point. Aborting.'
        }

        point = [ parseInt(match[2]), parseInt(match[3]) ]
        let dx = point[0] - last_point[0]
        let dy = point[1] - last_point[1]

        if (dx != 0 || dy != 0) {
          if (dx == 0){
            last_instruction = 'v'
            start_or_continue_current_line('v', dy)
          }
          else if (dy == 0) {
            last_instruction = 'h'
            start_or_continue_current_line('h', dx)
          }
          else {
            flush()
            let instruction = 'l'//last_instruction == 'l' ? ' ' : 'l'
            // last_instruction = 'l'
            out.push(`${instruction}${dx},${dy}`)
          }
        }

        last_point = point
        break

      default:
        throw `Need to handle SVG instruction ${match[0]}. Original path: ${path}. Aborting.`
        break
    }
    match = instr_regex.exec(int_path)
  }

  if (next_instruction_index != int_path.length) {
    throw `Unhandled SVG instruction at end of path: ${int_path.slice(next_instruction_index)}`
  }

  flush()
  return out.join('')
}

const distance2 = (p1, p2) => {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  return dx * dx + dy * dy
}

// Returns a <path class="state">
const render_state_path = (path, topology) => {
  console.log('rendering state path')
  // console.log(topology.objects.state)
  let d = path(topojson.feature(topology, topology.objects.state))
  d = compress_svg_path(d)
  return `<path d="${d}"/>`
}

const render_ak_path = (path, topology) => {
  console.log('rendering alaska')
  // console.log(topology.objects.state)
  let d = path(topojson.feature(topology, topology.objects.state))
  d = compress_svg_path(d)
  return `<path data-geo-id="02000" d="${d}"/>`
}

// Returns a <path class="mesh">
const render_mesh_path = (path, topology, key) => {
  console.log('rendering mesh path')
  let type = null
  switch(key) {
    case ('counties'):
      type = 'geo'
      break
    case('subcounties'):
      type = 'geo'
      break
    case ('districts'):
      type = 'district'
  }
  const mesh = topojson.mesh(topology, topology.objects[key], (a, b) => a != b)
  let d = path(mesh)
  if (d) {
    d = compress_svg_path(d)
    return `  <path class="mesh" d="${d}"/>`
  } else {
    // # DC, for instance, has no mesh
    return ''
  }
}

// Returns a String full of <path data-geo-id=..">
const render_g_element = (path, topology, geometries, key, st_code) => {
  console.log('rendering g element')
  const ret = []
  let idBase = null
  let dataIdKey = null
  let checkForOneDistrict = null
  switch (key) {
    case ('geos'):
      idBase = ''
      dataIdKey = 'geo'
      checkForOneDistrict = false
      break
    case ('districts'):
      idBase = st_code
      checkForOneDistrict = geometries.length === 1
      dataIdKey = 'race'
      break
  }

  for (let geometry of geometries) {
    let d = path(topojson.feature(topology, geometry))
    let fips = checkForOneDistrict ? '01' : geometry.properties.fips_string
    if (checkForOneDistrict) console.log('checking for one district, result: ' + idBase + fips);

    d = compress_svg_path(d)
    ret.push(`<path data-${dataIdKey}-id="${idBase + fips}" d="${d}"/>`)

  }
  return ret.join('')
}

const render_geo_svg = (state_code, feature_set, options, callback) => {
  const geo_output_filename = `./output/geo-maps/${fipsToState[state_code] || state_code}.svg`
  let features_json = feature_set.toJSON()
  let [ projection, width, height ] = options.projection || calculate_projection_width_height(features_json.state)
  features_json = project_features(features_json, projection)
  const topology = topojsonize(features_json, BigTopojsonOptions)


  const path = d3.geo.path().projection(null)
  let st_abbr = fipsToState[state_code]

  console.log(`Rendering ${geo_output_filename}...`)

  const geo_data = [
    `<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"${width}\" height=\"${height}\" viewBox=\"0 0 ${width} ${height}\">`
  ]
  if (topology.objects.subcounties && topology.objects.subcounties.geometries) {
    console.log('rendering subcounties')
    geo_data.push(render_g_element(path, topology, topology.objects.subcounties.geometries, 'geos', st_abbr))
    geo_data.push(render_mesh_path(path, topology, 'subcounties'))
    if (features_json.cities.features.length) {
      geo_data.push(render_cities_g(features_json.cities.features))
    }
  } else if (topology.objects.counties && topology.objects.counties.geometries) {
      geo_data.push(render_g_element(path, topology, topology.objects.counties.geometries, 'geos', st_abbr))
      geo_data.push(render_mesh_path(path, topology, 'counties'))
      if (features_json.cities.features.length) {
        geo_data.push(render_cities_g(features_json.cities.features))
      }
  } else if (topology.objects.state) {
    console.log('rendering alaska state outline')
    geo_data.push(render_ak_path(path, topology))
    if (features_json.cities.features.length) {
      geo_data.push(render_cities_g(features_json.cities.features))
    }
  }
  geo_data.push('</svg>')
  const geo_data_string = geo_data.join('')

  fs.writeFile(geo_output_filename, geo_data_string, callback)
}

const render_cities_g = (city_features) => {
  const ret = [ '<g class="cities">' ]

  let rendered_cities = []
  city_features.sort((a, b) => {
    let p1 = a.properties
    let p2 = b.properties
    return ((p1.feature == 'Civil' && -1 || 0) - (p2.feature == 'Civil' && -1 || 0)) || p2.population - p1.population || p1.name.localeCompare(p2.name)
  })

  for (let city of city_features) {
    const p = city.geometry.coordinates
    if (rendered_cities.find((p2) => distance2(p, p2) < MinDistanceBetweenCities * MinDistanceBetweenCities)) {
      continue
    }

    const x = p[0].toFixed(0)
    const y = p[1].toFixed(0)
    ret.push(`<circle r=\"7\" cx=\"${x}\" cy=\"${y}\"/>`)
    ret.push(`<text x=\"${x}\" y=\"${y}\">${city.properties.name}</text>`)

    rendered_cities.push(p)
    if (rendered_cities.length === 3) break
  }
  ret.push('</g>')
  return ret.join('')
}

const render_district_svg = (state_code, feature_set, options, callback) => {
  const dist_output_filename = `./output/district-maps/${fipsToState[state_code] || state_code}.svg`


  let features_json = feature_set.toJSON()
  let [ projection, width, height ] = options.projection || calculate_projection_width_height(features_json.state)
  features_json = project_features(features_json, projection)
  const topology = topojsonize(features_json, BigTopojsonOptions)

  // Note that our viewBox is width/height multiplied by 10. We round everything to integers to compress
  const path = d3.geo.path().projection(null)
  let st_abbr = fipsToState[state_code]

  console.log(`Rendering ${dist_output_filename}...`)
  const dist_data = [
    `<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"${width}\" height=\"${height}\" viewBox=\"0 0 ${width} ${height}\">`
  ]

  dist_data.push(render_g_element(path, topology, topology.objects.districts.geometries, 'districts', st_abbr))
  dist_data.push(render_mesh_path(path, topology, 'districts'))
  if (features_json.cities.features.length) {
    dist_data.push(render_cities_g(features_json.cities.features))
  }
  dist_data.push('</svg>')

  const dist_data_string = dist_data.join('')

  fs.writeFile(dist_output_filename, dist_data_string, callback)
}

const render_tiny_state_svg = (state_code, jsts_state_multipolygon, options, callback) => {
  const output_filename = `./output/tiny/${fipsToState[state_code] || state_code}.svg`
  console.log(`Rendering ${output_filename}...`)

  let features_json = { state: { type: 'Feature', geometry: GeoJSONWriter.write(jsts_state_multipolygon) } }
  const [ projection, width, height ] = options.projection || calculate_projection_width_height(features_json.state)
  features_json = project_features(features_json, projection)
  const topology = topojsonize(features_json, TinyTopojsonOptions)

  const path = d3.geo.path().projection(null)

  // Note that our viewBox is width/height multiplied by 10. We round everything to integers to compress
  const data = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    `<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"${width}\" height=\"${height}\" viewBox=\"0 0 ${width} ${height}\">`,
    render_state_path(path, topology),
    `<text x=\"${width >> 1}\" y=\"${height >> 1}\">${state_code}</text>`,
    "</svg>"
  ]

  const data_string = data.join('')
  fs.writeFile(output_filename, data_string, callback)
}

// Turns a GeoJSON Geometry into a valid JSTS Geometry
const geojson_geometry_to_jsts_geometry = (geojson_geometry) =>
  GeoJSONReader.read(geojson_geometry)
  .buffer(0) // make valid

// Transforms an Array of raw GeoJSON Features (from our geo loader) into an
// Array of JstsFeatures.
// Each Feature has "fips_string" and "name" properties.
const grok_input_land_features = (input_land_features) => {
  const ret = []
  for (let feature of input_land_features) {
    const p = feature.properties

    ret.push(new JstsFeature(
      geojson_geometry_to_jsts_geometry(feature.geometry),
      {
        'fips_string': p.STATE_FIPS,
        'state': p.STATE_ABBR,
        'name': p.NAME
      }
    ))
  }
  return ret
}

const grok_input_city_features = (input_city_features) => {
  const ret = []
  for (let feature of input_city_features) {
    const p = feature.properties
    ret.push({
      'type': 'Feature',
      'geometry': feature.geometry,
      'properties': {
        'feature': p.FEATURE, // We *want* 'Civil', but VT has no cities so we fall back to others,
        'name': p.ADMIN_NAME || p.NAME,
        'population': +p.POP_2010
      }
    })
  }
  return ret;
}

const grok_input_geo_features = (input_geo_features) => {
  const ret = []

  for (let feature of input_geo_features) {
    const p = feature.properties
    const geometry = geojson_geometry_to_jsts_geometry(feature.geometry)

    if([ 'Polygon', 'MultiPolygon' ].indexOf(geometry.getGeometryType()) === -1)
      throw new Error(`Unexpected geometry type ${geometry.getGeometryType()}: ` + JSON.stringify(geometry))

    if (!geometry.isEmpty())
      ret.push(new JstsFeature(
        geometry,
        {
          'fips_string': p.GEOID,
          'state': fipsToState[p.STATEFP],
          'name': p.NAME || p.NAMELSAD
        }
      ))
  }
  return ret
}

//  Calculates the union of all state features
const jsts_features_to_state_multipolygon = (jsts_land_features) => {
  const jsts_geometries = []
  for  (let feature of jsts_land_features) {
    jsts_geometries.push(feature.geometry)
  }
  return jsts_union(jsts_geometries)
}

// Calculates the union of the given Array of Geometries.
//  This method is because JSTS is unstable.
//  jsts.operation.union.CascadedPolygonUnion doesn't work, and
//  jsts_geometries.reduce((a, b) -> a.union(b)) is too slow. This is a
//  compromise: not too slow, not too complex.
const jsts_union = (jsts_geometries) => {
  switch (jsts_geometries.length) {
    case 0:
      return null
      break
    case 1:
      return jsts_geometries[0]
      break
    case 2:
      return jsts_geometries[0].union(jsts_geometries[1])
    default:
      const mid = jsts_geometries.length >> 1
      const left = jsts_geometries.slice(0, mid)
      const right = jsts_geometries.slice(mid)

      return jsts_union([ jsts_union(left), jsts_union(right) ])
  }
}

// # Transforms an Array of raw GeoJSON features (from our geo loader) into an
// # Array of JstsFeatures.
// #
// # Each geometry is intersected with the state MultiPolygon. That's because
// # subcounty geometries are political boundaries: they extend into lakes and
// # oceans.
// #
// # Each Feature has "geo_id" and "name" properties.
const grok_input_intersected_features = (input_features, jsts_state_multipolygon) => {
  const ret = []

  for (let feature of input_features) {
    const p = feature.properties
    const geometry = geojson_geometry_to_jsts_geometry(feature.geometry)
    const intersected_geometry = geometry.intersection(jsts_state_multipolygon)

    if ([ 'Polygon', 'MultiPolygon' ].indexOf(intersected_geometry.getGeometryType()) === -1)
      throw new Error(`Unexpected geometry type ${intersected_geometry.getGeometryType()}: ` + JSON.stringify(intersected_geometry))

    if (!intersected_geometry.isEmpty())
      ret.push(new JstsFeature(
        intersected_geometry,
        {
          'fips_string': p.CD115FP || p.GEOID,
          'state': fipsToState[p.STATEFP],
          'name': (p.NAME || p.NAMELSAD)
        }
      ))
  }
  return ret
}

//  Writes output files for the given state code, reading from
//  featuresByState[state_code]
//  not yet using city features
const render_state = (state_code, options, callback) => {
  console.log(`------- ${options.output_name || state_code}:`)

  const input_land_features = featuresByState[state_code].land
  const input_district_features = featuresByState[state_code].districts
  const input_county_features = featuresByState[state_code].counties
  const input_subcounty_features = featuresByState[state_code].subcounties
  const input_city_features = featuresByState[state_code].cities

  if (fipsToState[state_code] === 'HI') { console.log(input_county_features)}

  const jsts_land_features = grok_input_land_features(input_land_features)
  const jsts_state_multipolygon = jsts_features_to_state_multipolygon(jsts_land_features)
  const jsts_city_features = grok_input_city_features(input_city_features)
  const jsts_district_features = grok_input_intersected_features(input_district_features, jsts_state_multipolygon)
  const jsts_county_features = grok_input_intersected_features(input_county_features, jsts_state_multipolygon)
  const jsts_subcounty_features = grok_input_intersected_features(input_subcounty_features, jsts_state_multipolygon)

  const feature_set = new StateFeatureSet(
    jsts_state_multipolygon,
    jsts_district_features,
    jsts_county_features,
    jsts_subcounty_features,
    jsts_city_features
  )

  render_district_svg(state_code, feature_set, options, (err) => {
    if (err) return callback(err)
  })
  render_geo_svg(state_code, feature_set, options, (err) => {
    if (err) return callback(err)
  })
  render_tiny_state_svg(state_code, jsts_state_multipolygon, {}, callback)
}

const render_all_states = (callback) => {
  const pending_states = Object.keys(featuresByState).sort()

  const step = () => {
    if (pending_states.length > 0){
      const state_code = pending_states.shift()
      render_state(state_code, {'output_name': fipsToState[state_code]}, (err) => {
        if (err) return callback(err)
        process.nextTick(step)
      })
    }
    else {
      callback(null)
    }
  }
  process.nextTick(step)
}

//  load from pre-downloaded files
//    far from the best way to do this

const mapData = require('./DataFiles.es6')
const matching = {'USLand': 'statesp010g.shp', 'CongressionalDistricts': 'tl_2016_us_cd115.shp',
    'Counties': 'tl_2016_us_county.shp', 'MASubCounty': 'tl_2016_25_cousub.shp',
    'Counties': 'tl_2016_us_county.shp', 'CTSubCounty': 'tl_2016_09_cousub.shp',
    'Counties': 'tl_2016_us_county.shp', 'MESubCounty': 'tl_2016_23_cousub.shp',
    'Counties': 'tl_2016_us_county.shp', 'NHSubCounty': 'tl_2016_33_cousub.shp',
    'Counties': 'tl_2016_us_county.shp', 'RISubCounty': 'tl_2016_44_cousub.shp',
    'Counties': 'tl_2016_us_county.shp', 'VTSubCounty': 'tl_2016_50_cousub.shp',
    'cities': 'citiesx010g.shp'
    }
const filesArr = ['USLand', 'CongressionalDistricts', 'Counties', 'NESubCounty']
const retObj = {}

const getFile = (obj, filename, path) => {
  return new Promise((resolve, reject) => {
    geo_loader.load_features(obj, path)
      .then((result) => resolve([filename, result]))
  })
}
const setRet = (arr) => {
  return new Promise((resolve, reject) => {
    retObj[arr[0]] = arr[1]
      resolve(retObj)
  })
}

const checkEnd = (check, dArr) => {
  return new Promise((resolve, reject) => {
    if (check == 4) {
      resolve((dArr) => {
        organize(dArr)
          .then(render_all_states(err => {if (err) throw err}))
      })
    }
  })
}

const base_url = `${__dirname}/input/`
getFile(mapData['USLand'], 'USLand', base_url + matching['USLand'])
  .then(setRet)
  .then(() => {
    return getFile(mapData['CongressionalDistricts'], 'CongressionalDistricts', base_url + matching['CongressionalDistricts'])
  })
    .then(setRet)
  .then(() => {
    return getFile(mapData['Counties'], 'Counties', base_url + matching['Counties'])
  })
    .then(setRet)
  .then(() => {
    return getFile(mapData['MASubCounty'], 'MASubCounty', base_url + matching['MASubCounty'])
  })
    .then(setRet)
  .then(() => {
    return getFile(mapData['CTSubCounty'], 'CTSubCounty', base_url + matching['CTSubCounty'])
  })
    .then(setRet)
  .then(() => {
    return getFile(mapData['MESubCounty'], 'MESubCounty', base_url + matching['MESubCounty'])
  })
    .then(setRet)
  .then(() => {
    return getFile(mapData['NHSubCounty'], 'NHSubCounty', base_url + matching['NHSubCounty'])
  })
    .then(setRet)
  .then(() => {
    return getFile(mapData['RISubCounty'], 'RISubCounty', base_url + matching['RISubCounty'])
  })
    .then(setRet)
  .then(() => {
    return getFile(mapData['VTSubCounty'], 'VTSubCounty', base_url + matching['VTSubCounty'])
  })
    .then(setRet)
  .then(() => {
    return getFile(mapData['cities'], 'cities', base_url + matching['cities'])
  })
    .then(setRet)
  .then((result) => {
      organize_features('land', result.USLand)
      return result
    })
    .then((result) => {
      organize_features('counties', result.Counties)
      return result
    })
    .then((result) => {
      organize_features('districts', result.CongressionalDistricts)
      return result
    })
    .then((result) => {
      organize_subcounty_features('25', result.MASubCounty)
      return result
    })
    .then((result) => {
      organize_subcounty_features('09', result.CTSubCounty)
      return result
    })
    .then((result) => {
      organize_subcounty_features('23', result.MESubCounty)
      return result
    })
    .then((result) => {
      organize_subcounty_features('33', result.NHSubCounty)
      return result
    })
    .then((result) => {
      organize_subcounty_features('44', result.RISubCounty)
      return result
    })
    .then((result) => {
      organize_subcounty_features('50', result.VTSubCounty)
      return result
    })
    .then((result) => {
      organize_features('cities', result.cities)
      return result
    })
    .then(()=>render_all_states(err => {if (err) throw err}))

// Download shapefiles and build
// geo_loader.load_all_features()
//   .then((result) => {
//     organize_features('land', result.USLand)
//     return result
//   })
//   .then((result) => {
//     organize_features('counties', result.Counties)
//     return result
//   })
//   .then((result) => {
//     organize_features('districts', result.CongressionalDistricts)
//     return result
//   })
//   .then((result) => {
//     organize_subcounty_features('25', result.MASubCounty)
//     return result
//   })
//   .then((result) => {
//     organize_subcounty_features('09', result.CTSubCounty)
//     return result
//   })
//   .then((result) => {
//     organize_subcounty_features('23', result.MESubCounty)
//     return result
//   })
//   .then((result) => {
//     organize_subcounty_features('33', result.NHSubCounty)
//     return result
//   })
//   .then((result) => {
//     organize_subcounty_features('44', result.RISubCounty)
//     return result
//   })
//   .then((result) => {
//     organize_subcounty_features('50', result.VTSubCounty)
//     return result
//   })
//   .then(()=>render_all_states(err => {if (err) throw err}))
