function TitleUpdater(demIcon, gopIcon) {
  this.originalTitle = document.title;
  this.demIcon = demIcon;
  this.gopIcon = gopIcon;
}

TitleUpdater.prototype.update = function(className, demN, gopN) {
  if (demN === 0 && gopN === 0) {
    document.title = this.originalTitle;
  } else {
    var demWin = className === 'dem-win' ? '✔' : ' ';
    var gopWin = className === 'gop-win' ? '✔' : ' ';
    document.title = demN + demWin + this.demIcon + '–' + gopN + gopWin + this.gopIcon + ' - ' + this.originalTitle;
  }
};

module.exports = TitleUpdater;
