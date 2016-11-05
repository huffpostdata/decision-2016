var MaxCountdown = 30000; // ms we start with
var i18n;

function countdownText(ms, error) {
  var s = Math.ceil(ms / 1000);

  if (typeof i18n !== 'undefined') {
    return error ? i18n.t('refresh.error countdown', s) : i18n.t('refresh.countdown', s);
  } else {
    var prefix = error ? 'Failed last refresh. ' : '';

    if (s === 1) {
      return prefix + 'Refreshing in 1 second…';
    } else {
      return prefix + 'Refreshing in ' + s + ' seconds…';
    }
  }
}

function refreshText() {
  if (typeof i18n !== 'undefined') {
    return i18n.t('refresh.refreshing');
  } else {
    return 'Refreshing…';
  }
}

/**
 * Maintains the "#refresh" div.
 *
 * The "#refresh" div consists of a `button.refresh` and a `span.countdown`.
 * This JS (and _only_ this JS) sets the `span.countdown` text. The user may
 * click on the `button.refresh` _or_ we can "click" it automatically, once
 * the countdown hits 0. Either way, the button becomes disabled until the
 * XHR request completes.
 *
 * If the XHR request gives an error, we set the `.error` class on
 * `span.countdown` and change its text; otherwise, the logic continues as
 * usual.
 *
 * Every time we get new data, we call setData(json).
 */
module.exports = function(el, url, setData, _i18n) {
  var button = el.querySelector('button.refresh');
  var countdown = el.querySelector('span.countdown');
  i18n = _i18n || false;

  if (!button || !countdown) {
    console.log('Could not find button.refresh and span.countdown. Not refreshing.');
    return;
  }

  // Invariant:
  // (xhr === null && countdownEnd !== null && countdownTimer !== null)
  // || (xhr !== null && countdownEnd === null && countdownTimer === null)
  var xhr = null;
  var countdownEnd = null;
  var countdownTimer = null;
  var lastRequestFailed = false;

  function startXhr() {
    lastRequestFailed = false;
    el.classList.add('loading');
    countdown.textContent = refreshText();

    xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.timeout = 10000;
    xhr.responseType = 'json';
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;
      if (xhr.status === 200 || xhr.status === 304) {
        var json = xhr.response;
        setData(json);
      } else {
        lastRequestFailed = true;
      }

      xhr = null;
      el.classList.remove('loading');
      startCountdown();
    };
    xhr.send();
  }

  function tick() {
    var d = new Date().valueOf();
    if (d >= countdownEnd) {
      countdownEnd = null;
      countdownTimer = null;
      startXhr();
    } else {
      var text = countdownText(countdownEnd - d, lastRequestFailed);
      countdown.textContent = text;
      countdownTimer = setTimeout(tick, (1000 + (countdownEnd - d)) % 1000);
    }
  }

  function startCountdown() {
    if (countdownTimer !== null) return;

    countdownEnd = new Date().valueOf() + MaxCountdown;
    var text = countdownText(MaxCountdown, lastRequestFailed);
    countdown.textContent = text;
    countdownTimer = setTimeout(tick, 1000);
  }

  button.addEventListener('click', function(ev) {
    if (xhr !== null) return;

    // transition: countdown => xhr
    countdownEnd = null;
    clearTimeout(countdownTimer);
    countdownTimer = null;
    startXhr();
  });

  startCountdown();
}
