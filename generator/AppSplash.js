'use strict'

const Canvas = require('canvas')
const jpeg = require('jpeg-turbo')
const fs = require('fs')
const os = require('os')
const path = require('path')

process.env.FONTCONFIG_PATH = path.resolve(__dirname, '../raw-assets/fonts')

const assetPath = path.resolve(__dirname, '../raw-assets/splash')
const bodyFontFamily = 'Proxima Nova Condensed, Helvetica, Arial, serif'
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

function drawVotes(ctx, x, y, votes) {
  ctx.fillStyle = '#000'
  ctx.font = 'bold 20pt '+bodyFontFamily  
  ctx.beginPath()
  ctx.fillText(votes, x, y)
  ctx.closePath()
}

function drawNames(ctx, x, y, name) {
  ctx.fillStyle = '#000'
  ctx.font = 'bold 13pt '+bodyFontFamily  
  ctx.beginPath()
  ctx.fillText(name, x, y)
  ctx.closePath()
}

module.exports = class AppSplash {
  constructor() {
    this.width = 640
    this.height = 184
    this.canvas = new Canvas(this.width, this.height)
    this.ctx = this.canvas.getContext('2d')
  }

  renderImage(data) {
    const _this = this
    const canvas = _this.canvas
    const ctx = _this.ctx

    const headerHeight = 45
    const electoralWidth = 430
    const electoralHeight = ctx.canvas.height - headerHeight
    const electoralBarHeight = 30
    const electoralBarPosition = 80
    const mapWidth = ctx.canvas.width - electoralWidth

    const imageWidth = 75
    const electoralBarsWidth = electoralWidth - imageWidth*2
    const startOfBars = imageWidth + ctx.canvas.width - electoralWidth
    const endOfBars = startOfBars + electoralBarsWidth

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
    ctx.fillStyle = newState.clinton.color
    ctx.font = 'bold '+(headerHeight - 20)+'pt '+bodyFontFamily
    ctx.fillText('ELECTION', ctx.canvas.width/2 - ctx.measureText('ELECTION2016').width/2, headerHeight - 12)
    ctx.closePath()

    // header text 2
    ctx.fillStyle = newState.trump.color
    ctx.font = 'bold '+(headerHeight - 20)+'pt '+bodyFontFamily
    ctx.fillText('2016', ctx.canvas.width/2 - ctx.measureText('ELECTION2016').width/2 + ctx.measureText('ELECTION').width, headerHeight - 12)
    ctx.closePath()

    // =========== START --- ELECTORAL BARS ============== //
    // clinton face image
    clintonHead.src = fs.readFileSync(assetPath + '/HILLARY-CLINTON_Head.png')
    ctx.drawImage(clintonHead, startOfBars - 80, electoralBarPosition + headerHeight + electoralBarHeight - 75, 64, 75)
    // trump face image
    trumpHead.src = fs.readFileSync(assetPath + '/DONALD-TRUMP_Head.png')
    ctx.drawImage(trumpHead, endOfBars + 10, electoralBarPosition + headerHeight + electoralBarHeight - 75, 59, 75)

    // clinton votes
    drawVotes(ctx, startOfBars, headerHeight + electoralBarPosition - 8, newState.clinton.votes)
    // trump votes
    drawVotes(ctx, endOfBars - ctx.measureText(newState.trump.votes).width, headerHeight + electoralBarPosition - 8, newState.trump.votes)

    // clinton name
    drawNames(ctx, startOfBars, headerHeight + electoralBarPosition - 32, newState.clinton.name.toUpperCase())
    // trump name
    drawNames(ctx, endOfBars - ctx.measureText(newState.trump.name.toUpperCase()).width, headerHeight + electoralBarPosition - 32, newState.trump.name.toUpperCase())

    // clinton bar
    drawBar(ctx, startOfBars, headerHeight + electoralBarPosition, newState.clinton.position, electoralBarHeight, newState.clinton.color)

    // trump bar
    drawBar(ctx, ctx.canvas.width - newState.trump.position - imageWidth, headerHeight + electoralBarPosition, newState.trump.position, electoralBarHeight, newState.trump.color)

    // bar stroke
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.rect(startOfBars, headerHeight + electoralBarPosition, electoralBarsWidth, electoralBarHeight)
    ctx.closePath()
    ctx.stroke()

    // bar stroke center top 
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(ctx.canvas.width - electoralWidth/2, headerHeight + electoralBarPosition)
    ctx.lineTo(ctx.canvas.width - electoralWidth/2, headerHeight + electoralBarPosition + electoralBarHeight/4)
    ctx.closePath()
    ctx.stroke()

    // bar stroke center bottom 
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(ctx.canvas.width - electoralWidth/2, headerHeight + electoralBarPosition + electoralBarHeight)
    ctx.lineTo(ctx.canvas.width - electoralWidth/2, headerHeight + electoralBarPosition + electoralBarHeight - electoralBarHeight/4)
    ctx.closePath()
    ctx.stroke()


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
