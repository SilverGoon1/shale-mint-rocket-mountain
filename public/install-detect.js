(function () {
  var ua = navigator.userAgent || "";
  var touch = navigator.maxTouchPoints || 0;
  var isiPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && touch > 1);
  var isiPhone = /iPhone|iPod/.test(ua);
  var isIOS = isiPhone || isiPad;
  var isAndroid = /Android/i.test(ua);
  var isAndroidPhone = isAndroid && /Mobile/i.test(ua);
  var isAndroidTablet = isAndroid && !/Mobile/i.test(ua);
  var minSide = Math.min(screen.width || 0, screen.height || 0);
  var maxSide = Math.max(screen.width || 0, screen.height || 0);

  var type = "desktop";
  if (isiPhone) type = "phone";
  else if (isiPad || isAndroidTablet) type = "tablet";
  else if (isAndroidPhone) type = "phone";
  else if (touch > 0 && minSide > 0 && minSide <= 500) type = "phone";
  else if (touch > 0 && minSide > 500 && maxSide <= 1400) type = "tablet";

  var iosMajor = null;
  var osToken = null;
  var safariToken = null;
  var iphoneOs = ua.match(/iPhone OS (\d+)[._]/);
  var ipadOs = ua.match(/CPU OS (\d+)[._](\d+) like Mac OS X/);
  var safariVer = ua.match(/Version\/(\d+)[._]/);
  if (iphoneOs) osToken = parseInt(iphoneOs[1], 10);
  else if (ipadOs) osToken = parseInt(ipadOs[1], 10);
  if (isIOS && safariVer) safariToken = parseInt(safariVer[1], 10);
  if (osToken != null || safariToken != null) {
    iosMajor = Math.max(osToken || 0, safariToken || 0);
  }

  var root = document.documentElement;
  var classes = ["device-" + type];
  if (iosMajor != null) {
    root.dataset.ios = String(iosMajor);
    classes.push(iosMajor >= 27 ? "ios-27-plus" : "ios-below-27");
  }
  root.className = classes.join(" ");
})();
