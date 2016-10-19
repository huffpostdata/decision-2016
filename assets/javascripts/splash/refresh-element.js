var electionSplashRefresh = document.getElementById('election-splash-refresh');

var renderRefreshButton = function() {
  if (!electionSplashRefresh) {
    return false;
  }

  var refreshButton = document.createElement('button');
  refreshButton.setAttribute('class', 'refresh');
  refreshButton.innerHTML = 'Refresh';

  var countdown = document.createElement('span');
  countdown.setAttribute('class', 'countdown');

  electionSplashRefresh.appendChild(refreshButton);
  electionSplashRefresh.appendChild(countdown);
}

module.exports = {
  render: renderRefreshButton
}
