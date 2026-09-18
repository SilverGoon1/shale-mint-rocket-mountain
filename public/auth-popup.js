(function () {
  var el = document.getElementById("grok-auth-popup-msg");
  var msg = { source: "grok-auth-popup", token: null };
  try {
    if (el && el.textContent) msg = JSON.parse(el.textContent);
  } catch (e) {}
  try {
    if (window.opener) window.opener.postMessage(msg, window.location.origin);
  } catch (e) {}
  try {
    window.close();
  } catch (e) {}
})();
