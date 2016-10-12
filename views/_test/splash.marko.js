function create(__helpers) {
  var str = __helpers.s,
      empty = __helpers.e,
      notEmpty = __helpers.ne,
      escapeXml = __helpers.x,
      attr = __helpers.a;

  return function render(data, out) {
    out.w("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Splash Page Test</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head><body><p>This is a test splash page! here are the divs</p><div id=\"test1\"></div><div id=\"test2\"></div><script" +
      attr("src", data.path_to("splash.js")) +
      "></script></body></html>");
  };
}

(module.exports = require("marko").c(__filename)).c(create);
