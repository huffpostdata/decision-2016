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
  ctx.font = 'bold '+size+'pt '+bodyFontFamily
  ctx.fillText(text, ctx.canvas.width/2 - ctx.measureText('ELECTION2016').width/2 + offset, y)
  ctx.closePath()
}

function drawText(ctx, x, y, text, size, align) {
  var align = align ? align : 'left';
  ctx.fillStyle = '#000'
  ctx.font = 'bold '+size+'pt '+bodyFontFamily  
  ctx.textAlign = align
  ctx.beginPath()
  ctx.fillText(text, x, y)
  ctx.closePath()
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

  renderImage(data) {
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
      var nameFontSize = electoralBarHeight * 0.4
      var voteFontSize = electoralBarHeight * 0.666
      var barTextPadding = electoralBarHeight * 0.26
      var headerFontPadding = headerHeight * 0.1
      var headerFontSize = headerHeight - headerFontPadding * 6.2
      var headerTextPosition = headerHeight - headerFontPadding * 3
    } else {
      var electoralBarPosition = ctx.canvas.height * 0.43
      var electoralBarsWidth = electoralWidth - imageArea*2
      var startOfBars = imageArea + ctx.canvas.width - electoralWidth
      var endOfBars = startOfBars + electoralBarsWidth
      var nameFontSize = electoralBarHeight * 0.533
      var voteFontSize = electoralBarHeight * 0.766
      var barTextPadding = electoralBarHeight * 0.26
      var headerFontPadding = headerHeight * 0.1
      var headerFontSize = headerHeight - headerFontPadding * 5
      var headerTextPosition = headerHeight - headerFontPadding * 2
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
