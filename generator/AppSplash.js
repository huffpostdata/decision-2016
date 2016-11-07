'use strict'

const Canvas = require('canvas')
const jpeg = require('jpeg-turbo')
const fs = require('fs')
const os = require('os')
const path = require('path')

process.env.FONTCONFIG_PATH = path.resolve(__dirname, '../raw-assets/fonts')

const assetPath = path.resolve(__dirname, '../raw-assets/splash')
const bodyFontFamily = 'Proxima Nova Condensed'
const totalVotes = 538

function percentOfVotes(votes) {
  return ((votes/totalVotes)*100).toFixed()/100
}

function getBarPosition(config, votes) {
  return percentOfVotes(votes) * config.electoral.barsWidth
}

function genStateData(name, votes, color, position) {
  return {
    name: name,
    votes: votes,
    color: color,
    position: position,
  }
}

function getState(ctx, configs, cVotes, tVotes) {
  var cPosition = getBarPosition(configs, cVotes)
  var tPosition = getBarPosition(configs, tVotes)

  return {
    clinton: genStateData('clinton', cVotes, '#4c7de0', cPosition),
    trump: genStateData('trump', tVotes, '#e52426', tPosition),
  }
}

function drawBar(ctx, x, y, w, h, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.closePath()
  ctx.fill()
}

function drawHeaderText(ctx, y, text, size, color, offset) {
  ctx.fillStyle = color
  ctx._setFont('900', 'normal', size, 'pt', 'Proxima Nova Condensed')
  ctx.fillText(text, ctx.canvas.width/2 - ctx.measureText('ELECTION2016').width/2 + offset, y)
  ctx.closePath()
}

function drawText(ctx, x, y, text, size, align) {
  var align = align ? align : 'left';
  ctx.fillStyle = '#000'
  ctx._setFont('900', 'normal', size, 'pt', 'Proxima Nova Condensed')
  ctx.textAlign = align
  ctx.beginPath()
  ctx.fillText(text, x, y)
  ctx.closePath()
}

function drawSvgPathD(ctx, d) {
  const OpRe = /^[, ]*([MlhvZ])[, ]*/
  const IntRe = /^[, ]*(-?\d+)[, ]*/
  let pos = 0
  function readOp() {
    const m = OpRe.exec(d.slice(pos))
    if (!m) throw new Error('Expected op in <path> d; found: ' + d.slice(pos, pos + 20))
    pos += m[0].length
    return m[1]
  }
  function readInt() {
    const m = IntRe.exec(d.slice(pos))
    if (!m) throw new Error('Expected integer in <path> d; found: ' + d.slice(pos, pos + 20))
    pos += m[0].length
    return parseInt(m[1], 10)
  }

  let x = 0
  let y = 0

  while (pos < d.length) {
    switch (readOp()) {
      case 'M':
        ctx.moveTo(x = readInt(), y = readInt())
        break
      case 'l':
        x += readInt()
        y += readInt()
        ctx.lineTo(x, y)
        break
      case 'h':
        x += readInt()
        ctx.lineTo(x, y)
        break
      case 'v':
        y += readInt()
        ctx.lineTo(x, y)
        break
      case 'Z':
        ctx.closePath()
        break
      case null:
        return
    }
  }
}

function drawUsa(ctx, races, x, y, w, h) {
  const svg = fs.readFileSync(`${__dirname}/../assets/maps/president.svg`, 'utf8')
    .split(/<g class="cartogram"/)[0] // ignore everything after the <g class="geography"

  // grep-friendly comment: we copy $dem-color, $gop-color and $tossup-color here
  const classNameToFillStyle = { 'dem-win': '#4c7de0', 'gop-win': '#e52426', 'tossup': '#D1D3D4' }
  const raceIdToFillStyle = {}

  for (const race of races) {
    raceIdToFillStyle[race.id] = classNameToFillStyle[race.className] || classNameToFillStyle.tossup;
  }

  const [ svgWidth, svgHeight ] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg).slice(1).map(parseFloat)

  ctx.save()
  ctx.transform(w / svgWidth, 0, 0, h / svgHeight, x, y)

  // Clip away the box-shaped state "labels"
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(1210, 0)
  ctx.lineTo(1210, 800)
  ctx.lineTo(0, 800)
  ctx.closePath()
  ctx.clip()

  const re = /<path class="([^"]+)" d="([^"]+)"/g
  let m
  while ((m = re.exec(svg)) !== null) {
    const raceId = m[1]
    const d = m[2]

    if (raceId !== 'mesh') {
      // okay, it's really a race
      ctx.fillStyle = raceIdToFillStyle[raceId]
      ctx.beginPath()
      drawSvgPathD(ctx, d)
      ctx.fill()
    } else {
      // It's just the mesh
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 6
      ctx.beginPath()
      drawSvgPathD(ctx, d)
      ctx.stroke()
    }
  }

  ctx.restore()
}

module.exports = class AppSplash {
  constructor(width, device) {
    this.width = width
    this.height = device === 'mobile' ? this.width * 0.53 : this.width * 0.3
    // this.height = 184
    this.canvas = new Canvas(this.width, this.height)
    this.ctx = this.canvas.getContext('2d')
    this.device = device
  }

  renderImage(data, presidentRaces) {
    const canvas = this.canvas
    const ctx = this.ctx
    const device = this.device

    if (device === 'mobile') {
      var electoralWidth = ctx.canvas.width
    } else {
      var electoralWidth = ctx.canvas.width * 0.7
    }

    const imageArea = ctx.canvas.width * 0.125
    const headerHeight = ctx.canvas.height * 0.26
    const electoralHeight = ctx.canvas.height - headerHeight
    const electoralBarHeight = ctx.canvas.height * 0.16
    const mapWidth = ctx.canvas.width - electoralWidth

    if (device === 'mobile') {
      var electoralBarPosition = ctx.canvas.height * 0.5
      var electoralBarsWidth = electoralWidth - ctx.canvas.width * 0.02 * 2
      var startOfBars = ctx.canvas.width * 0.02
      var endOfBars = startOfBars + electoralBarsWidth
      var nameFontSize = electoralBarHeight * 0.6
      var voteFontSize = electoralBarHeight
      var barTextPadding = electoralBarHeight * 0.26
      var headerFontPadding = headerHeight * 0.1
      var headerFontSize = headerHeight - headerFontPadding * 4.2
      var headerTextPosition = headerHeight - headerFontPadding * 3.2
    } else {
      var electoralBarPosition = ctx.canvas.height * 0.43
      var electoralBarsWidth = electoralWidth - imageArea*2
      var startOfBars = imageArea + ctx.canvas.width - electoralWidth
      var endOfBars = startOfBars + electoralBarsWidth
      var nameFontSize = electoralBarHeight * 0.8
      var voteFontSize = electoralBarHeight
      var barTextPadding = electoralBarHeight * 0.26
      var headerFontPadding = headerHeight * 0.1
      var headerFontSize = headerHeight - headerFontPadding * 3
      var headerTextPosition = headerHeight - headerFontPadding * 2.8
    }


    const configs = {
      headerHeight: headerHeight,
      electoral: {
        width: electoralWidth,
        height: electoralHeight,
        barsWidth: electoralBarsWidth,
      },
      map: {
        width: mapWidth,
        height: electoralHeight,
      }
    }

    const newState = getState(ctx, configs, data.nClintonElectoralVotes, data.nTrumpElectoralVotes)
    const clintonHead = new Canvas.Image()
    const trumpHead = new Canvas.Image()

    // background
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.closePath()
    ctx.fill()

    // header background
    ctx.fillStyle = '#ededed'
    ctx.beginPath()
    ctx.rect(0, 0, ctx.canvas.width, headerHeight)
    ctx.closePath()
    ctx.fill()

    // header text 1
    drawHeaderText(
      ctx,
      headerTextPosition,
      'ELECTION',
      headerFontSize,
      newState.clinton.color,
      0
    )
    // header text 2
    drawHeaderText(
      ctx,
      headerTextPosition,
      '2016',
      headerFontSize,
      newState.trump.color,
      ctx.measureText('ELECTION').width
    )

    // =========== START --- ELECTORAL BARS ============== //
    // clinton face image
    clintonHead.src = fs.readFileSync(assetPath + '/HILLARY-CLINTON_Head.png')
    clintonHead.newHeight = ctx.canvas.height * 0.4
    clintonHead.newWidth = clintonHead.newHeight * 0.85
    if (device === 'mobile') {
      var clintonHeadX = startOfBars
      var clintonHeadY = electoralBarPosition + headerHeight - clintonHead.newHeight - barTextPadding
    } else {
      var clintonHeadX = startOfBars - clintonHead.newWidth - clintonHead.newWidth * 0.2
      var clintonHeadY = electoralBarPosition + headerHeight + electoralBarHeight - clintonHead.newHeight
    }
    ctx.drawImage(
        clintonHead, 
        clintonHeadX, 
        clintonHeadY, 
        clintonHead.newWidth, 
        clintonHead.newHeight
    )

    // trump face image
    trumpHead.src = fs.readFileSync(assetPath + '/DONALD-TRUMP_Head.png')
    trumpHead.newHeight = ctx.canvas.height * 0.4
    trumpHead.newWidth = trumpHead.newHeight * 0.78
    if (device === 'mobile') {
      var trumpHeadX = endOfBars - trumpHead.newWidth
      var trumpHeadY = electoralBarPosition + headerHeight - trumpHead.newHeight - barTextPadding
    } else {
      var trumpHeadX = endOfBars + trumpHead.newWidth * 0.2
      var trumpHeadY = electoralBarPosition + headerHeight + electoralBarHeight - trumpHead.newHeight
    }
    ctx.drawImage(
        trumpHead, 
        trumpHeadX, 
        trumpHeadY, 
        trumpHead.newWidth, 
        trumpHead.newHeight
    )

    if (device === 'mobile') {
      var clintonTextX = startOfBars + clintonHead.newWidth + barTextPadding
      var trumpTextX = endOfBars - trumpHead.newWidth - barTextPadding
      var textYOffset = barTextPadding * 1.2
    } else {
      var clintonTextX = startOfBars
      var trumpTextX = endOfBars
      var textYOffset = 0 
    }

    // clinton votes
    drawText(ctx, clintonTextX, headerHeight + electoralBarPosition - barTextPadding - textYOffset, newState.clinton.votes, voteFontSize)
    // trump votes
    drawText(ctx, trumpTextX, headerHeight + electoralBarPosition - barTextPadding - textYOffset, newState.trump.votes, voteFontSize, 'right')

    // clinton name
    drawText(ctx, clintonTextX, headerHeight + electoralBarPosition - voteFontSize - textYOffset - barTextPadding * 1.6, newState.clinton.name.toUpperCase(), nameFontSize)
    // trump name
    drawText(ctx, trumpTextX, headerHeight + electoralBarPosition - voteFontSize - textYOffset - barTextPadding * 1.6, newState.trump.name.toUpperCase(), nameFontSize, 'right')

    // clinton bar
    drawBar(ctx, startOfBars, headerHeight + electoralBarPosition, newState.clinton.position, electoralBarHeight, newState.clinton.color)

    // trump bar
    drawBar(ctx, endOfBars - newState.trump.position, headerHeight + electoralBarPosition, newState.trump.position, electoralBarHeight, newState.trump.color)

    // bar stroke
    ctx.strokeStyle = '#000'
    ctx.lineWidth = device === 'mobile' ? 1 : 2
    ctx.beginPath()
    ctx.rect(startOfBars, headerHeight + electoralBarPosition, electoralBarsWidth, electoralBarHeight)
    ctx.closePath()
    ctx.stroke()

    // bar stroke center top 
    ctx.strokeStyle = '#000'
    ctx.lineWidth = device === 'mobile' ? 1 : 2
    ctx.beginPath()
    ctx.moveTo(ctx.canvas.width - electoralWidth/2, headerHeight + electoralBarPosition)
    ctx.lineTo(ctx.canvas.width - electoralWidth/2, headerHeight + electoralBarPosition + electoralBarHeight/4)
    ctx.closePath()
    ctx.stroke()

    // bar stroke center bottom 
    ctx.strokeStyle = '#000'
    ctx.lineWidth = device === 'mobile' ? 1 : 2
    ctx.beginPath()
    ctx.moveTo(ctx.canvas.width - electoralWidth/2, headerHeight + electoralBarPosition + electoralBarHeight)
    ctx.lineTo(ctx.canvas.width - electoralWidth/2, headerHeight + electoralBarPosition + electoralBarHeight - electoralBarHeight/4)
    ctx.closePath()
    ctx.stroke()

    // USA map
    if (this.device === 'tablet') {
      drawUsa(ctx, presidentRaces, 25, headerHeight + 25, 404, 250)
    }

    // =========== ELECTORAL BARS --- END ============== //

    const imageBuffer = canvas.toBuffer('raw')
    return jpeg.compressSync(imageBuffer, {
      format: os.endianness() == 'LE' ? jpeg.FORMAT_BGRA : jpeg.FORMAT_ARGB,
      width: canvas.width,
      height: canvas.height,
      quality: 90,
    })
  }
}
