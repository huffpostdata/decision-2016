const dims = require('./dims')
const fs = require('fs')

function rectToPathD(xywh) {
  const x = Math.round(+xywh[0]) * dims.Accuracy
  const y = Math.round(+xywh[1]) * dims.Accuracy
  const w = Math.round(+xywh[2]) * dims.Accuracy
  const h = Math.round(+xywh[3]) * dims.Accuracy

  return [
    'M', x, ',', y,
    'h', w,
    'v', h,
    'h-', w,
    'Z'
  ].join('')
}

function polygonToPathD(pointsString) {
  // Expects input to be x,y x,y x,y x,y ...
  const points = pointsString.split(/\s+/)
    .filter(ps => ps.length > 0)
    .map(ps => ps.split(',').map(s => Math.round(+s) * dims.Accuracy))

  let x = points[0][0]
  let y = points[0][1]

  const out = [ 'M', points[0][0], ',', points[0][1] ]

  for (const pt of points.slice(1)) {
    const dx = pt[0] - x
    const dy = pt[1] - y

    if (dx === 0) {
      out.push('v' + dy)
    } else if (dy === 0) {
      out.push('h' + dx)
    } else {
      out.push('l' + dx + ',' + 'dy')
    }

    x = pt[0]
    y = pt[1]
  }

  out.push('Z')
  return out.join('')
}

function parseUnderlay(input) {
  const parts = []

  const m = /<g id="background">([^]*?)\<\/g>/.exec(input)
  if (m === null) throw new Error(`Could not find <g id="background">`)

  const re = /<(?:polygon .*?points="(.*?)"|rect .*?x="(.*?)" .*?y="(.*?)" .*?width="(.*?)" .*?height="(.*?)")/g
  let m2
  while ((m2 = re.exec(m[1])) !== null) {
    if (m2[1]) {
      parts.push(polygonToPathD(m2[1]))
    } else {
      parts.push(rectToPathD(m2.slice(2)))
    }
  }

  return parts.join('')
}

function parseText(input) {
  const texts = []

  // Looks for <g id="state-names">...
  const m = /<g id="state-names">([^]*?)\<\/g>/.exec(input)
  if (m === null) throw new Error(`Could not find <g id="state-names">`)

  const re = /<text transform="matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)"[^>]*>([^<]+)/g
  let m2
  while ((m2 = re.exec(m[1])) !== null) {
    const x = Math.round(+m2[1] * dims.Accuracy)
    const y = Math.round(+m2[2] * dims.Accuracy)
    const text = m2[3]

    texts.push({ x: x, y: y, text: text })
  }

  return texts
}

function parseDistricts(input) {
  // Expects input to contain lots of <g id="al"> <g> <rect x=...><rect x=...> <rect x=...>...
  const districts = []

  const re1 = /<g id="([a-z][a-z])">([^]*?)\<\/g>/g
  let m1
  while ((m1 = re1.exec(input)) !== null) {
    const stateCode = m1[1].toUpperCase()
    let i = 0

    const re2 = /<rect .*?x="(.*?)" .*?y="(.*?)" .*?width="(.*?)" .*?height="(.*?)"/g
    let m2
    while ((m2 = re2.exec(m1[2])) !== null) {
      i += 1
      districts.push({
        id: `${stateCode}${String(100 + i).slice(1)}`, // "AL01", "AL02", ...
        d: rectToPathD(m2.slice(1))
      })
    }
  }

  districts.sort((a, b) => a.id.localeCompare(b.id))

  return districts
}

function loadHouseCartogram() {
  const input = fs.readFileSync(`${__dirname}/../house-cartogram.svg`, 'utf8')

  const underlay = parseUnderlay(input)
  const text = parseText(input)
  const districts = parseDistricts(input)

  return {
    underlay: underlay,
    text: text,
    districts: districts
  }
}

module.exports = loadHouseCartogram
