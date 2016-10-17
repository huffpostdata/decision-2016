var refresh = require('./common/_refresh');

function doRefresh(json) {
  console.log('REFRESH', json);
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/president.json', doRefresh);
