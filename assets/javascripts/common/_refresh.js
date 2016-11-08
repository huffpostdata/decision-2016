var MaxCountdown = 30000; // ms we start with
var i18n;

function countdownText(ms, error) {
  var s = Math.ceil(ms / 1000);

  if (i18n != null) {
    return error ? i18n.t('refresh.error countdown', s) : i18n.t('refresh.countdown', s);
  } else {
    var prefix = error ? 'Failed last refresh. ' : '';

    if (s === 1) {
      return prefix + 'Refreshing in 1 second';
    } else {
      return prefix + 'Refreshing in ' + s + ' seconds';
    }
  }
}

function refreshText() {
  return (i18n != null) ? i18n.t('refresh.refreshing') : 'Refreshing…';
}

function elOrElsToArrayLike(elOrEls) {
  switch (Object.prototype.toString.apply(elOrEls)) {
    case '[object Array]':
    case '[object NodeList]':
      return elOrEls;
    default: return [ elOrEls ];
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
module.exports = function(elOrEls, url, setData, _options) {
  var i;
  var els = elOrElsToArrayLike(elOrEls);

  var options = _options || {};
  i18n = (options.hasOwnProperty('i18n')) ? options.i18n : null;

  var buttons = [];
  var countdowns = [];
  for (i = 0; i < els.length; i++) {
    var button = els[i].querySelector('button.refresh');
    if (button) buttons.push(button);
    var countdown = els[i].querySelector('span.countdown');
    if (countdown) countdowns.push(countdown);
  }

  if (buttons.length === 0 && countdowns.length === 0) return;

  // Invariant:
  // (xhr === null && countdownEnd !== null && countdownTimer !== null)
  // || (xhr !== null && countdownEnd === null && countdownTimer === null)
  var xhr = null;
  var countdownEnd = null;
  var countdownTimer = null;
  var lastRequestFailed = false;

  function startXhr() {
    lastRequestFailed = false;
    for (var i = 0; i < els.length; i++) els[i].classList.add('loading');
    countdown.textContent = refreshText();

    xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.timeout = 10000;
    xhr.responseType = 'text'; // IE <= 11 doesn't support "json"
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;
      if (xhr.status === 200 || xhr.status === 304) {
        var json = JSON.parse(xhr.responseText);
        setData(json);
      } else {
        lastRequestFailed = true;
      }

      xhr = null;
      for (var i = 0; i < els.length; i++) els[i].classList.remove('loading');
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
      for (var i = 0; i < countdowns.length; i++) countdowns[i].textContent = text;
      countdownTimer = setTimeout(tick, (1000 + (countdownEnd - d)) % 1000);
    }
  }

  function startCountdown() {
    if (countdownTimer !== null) return;

    countdownEnd = new Date().valueOf() + MaxCountdown;
    var text = countdownText(MaxCountdown, lastRequestFailed);
    for (var i = 0; i < countdowns.length; i++) countdowns[i].textContent = text;
    countdownTimer = setTimeout(tick, 1000);
  }

  function onClick(ev) {
    if (xhr !== null) return;

    // transition: countdown => xhr
    countdownEnd = null;
    clearTimeout(countdownTimer);
    countdownTimer = null;
    startXhr();
  }

  for (i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', onClick);
  }

  startCountdown();
}
