var WhiteHBase64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////////VXz1bAAAAAJ0Uk5T/wDltzBKAAAAPUlEQVR42mJgJAAYho4CBihgxOQRqQAiiGQugseAJIaigHGoKkABZCkYHuGAL7pR0wiWBENQwRDPWQABBgDKKwNKfc9NNgAAAABJRU5ErkJggg==';

function TitleUpdater(demIcon, gopIcon, maxNForFavicon) {
  this.originalTitle = document.title;
  this.demIcon = demIcon;
  this.gopIcon = gopIcon;
  this.canvas = document.createElement('canvas');
  this.canvas.width = 32;
  this.canvas.height = 32;
  this.ctx = this.canvas.getContext('2d');
  this.maxNForFavicon = maxNForFavicon;

  this.linkEl = document.querySelector('link[rel="shortcut icon"]');
}

TitleUpdater.prototype.updateFaviconWeNeverTestedThisCrossBrowser = function(demN, gopN) {
  var image = new Image();
  var _this = this;
  image.onload = function() {
    var ctx = _this.ctx;

    // background (gray)
    ctx.fillStyle = '#9a9999';
    ctx.rect(0, 0, 32, 32);
    ctx.fill();

    var demPx = Math.min(32, Math.round(demN / _this.maxNForFavicon * 32));
    var gopPx = Math.min(32, Math.round(gopN / _this.maxNForFavicon * 32));

    // Dem
    ctx.fillStyle = '#4c7de0';
    ctx.beginPath();
    ctx.rect(0, 32 - demPx, 12, demPx);
    ctx.fill();

    // GOP
    ctx.fillStyle = '#e52426';
    ctx.beginPath();
    ctx.rect(20, 32 - gopPx, 12, gopPx);
    ctx.fill();

    // white H
    ctx.drawImage(image, 0, 0);

    var png = _this.canvas.toDataURL('image/png');
    _this.linkEl.setAttribute('href', png);
  };
  image.src = 'data:image/png;base64,' + WhiteHBase64;
}

TitleUpdater.prototype.update = function(className, demN, gopN) {
  if (demN === 0 && gopN === 0) {
    document.title = this.originalTitle;
  } else {
    var demWin = className === 'dem-win' ? '✔' : ' ';
    var gopWin = className === 'gop-win' ? '✔' : ' ';
    document.title = demN + demWin + this.demIcon + '–' + gopN + gopWin + this.gopIcon + ' - ' + this.originalTitle;
  }

  try {
    this.updateFaviconWeNeverTestedThisCrossBrowser(demN, gopN);
  } catch (e) {
    console.warn(e);
  }
};

module.exports = TitleUpdater;
