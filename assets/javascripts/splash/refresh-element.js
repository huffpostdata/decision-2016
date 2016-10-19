var electionSplashRefresh = document.getElementById('election-splash-refresh');

var renderRefreshButton = function() {
  if (electionSplashRefresh) {
    electionSplashRefresh.innerHTML = '<button class="refresh">REFRESH RESULTS</button><span class="countdown"></span>';
  }
}

module.exports = {
  render: renderRefreshButton
}
