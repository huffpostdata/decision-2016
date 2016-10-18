var cartogram = require('./common/_cartogram');
var nav = require('./dashboard/_nav');
var refresh = require('./common/_refresh');
var summary = require('./president/_summary');

var mapEl = document.getElementById('map');
var cartogramEl = document.createElement('div');
cartogramEl.className = 'cartogram';
mapEl.appendChild(cartogramEl);
var updateCartogram = cartogram(cartogramEl, { todo: 'put-data-here' });

var navEl = document.querySelector('nav');
var updateNav = nav(navEl);

var summaryEl = document.getElementById('president-summary');
var updateSummary = summary(summaryEl);

function doRefresh(json) {
  updateCartogram(json.races);
  updateNav(json.summaries);
  updateSummary(json);
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/president.json', doRefresh);
