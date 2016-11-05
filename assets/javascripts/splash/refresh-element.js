var electionSplashRefresh = document.getElementById('election-splash-refresh');

var renderRefreshButton = function(i18n) {
  if (electionSplashRefresh) {
    electionSplashRefresh.innerHTML = '<button class="refresh">'+ i18n.t('refresh.Refresh') +'</button><span class="countdown"></span>';
  }
}

module.exports = {
  render: renderRefreshButton
}
