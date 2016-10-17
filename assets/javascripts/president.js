var cartogram = require('./common/_cartogram');
var nav = require('./dashboard/_nav');
var refresh = require('./common/_refresh');

var mapEl = document.getElementById('map');
var cartogramEl = document.createElement('div');
cartogramEl.className = 'cartogram';
mapEl.appendChild(cartogramEl);
var updateCartogram = cartogram(cartogramEl, { todo: 'put-data-here' });

var navEl = document.querySelector('nav');
var updateNav = nav(navEl);

function doRefresh(json) {
  updateCartogram(json.races);
  updateNav(json.summaries);
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/president.json', doRefresh);
