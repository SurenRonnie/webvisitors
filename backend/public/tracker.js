(function () {
  var script = document.currentScript;
  var trackingId = script && script.getAttribute('data-tracking-id');
  var endpoint = (script && script.getAttribute('data-endpoint')) || (script ? new URL(script.src).origin : '');
  var debug = !script || script.getAttribute('data-debug') !== 'false'; // logs by default; set data-debug="false" to silence

  function log() {
    if (debug && window.console) console.log.apply(console, ['[VisitorIQ]'].concat(Array.prototype.slice.call(arguments)));
  }

  if (!trackingId || !endpoint) {
    log('missing data-tracking-id or endpoint, tracker disabled', { trackingId: trackingId, endpoint: endpoint });
    return;
  }

  log('initialized', { trackingId: trackingId, endpoint: endpoint, page: window.location.href });

  var SESSION_KEY = 'viq_sid';
  var sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sessionId);
    log('new session', sessionId);
  } else {
    log('existing session', sessionId);
  }

  function params() {
    var url = new URL(window.location.href);
    return {
      utmSource: url.searchParams.get('utm_source') || undefined,
      utmMedium: url.searchParams.get('utm_medium') || undefined,
      utmCampaign: url.searchParams.get('utm_campaign') || undefined,
    };
  }

  var pageStart = Date.now();

  function sendHit(extra) {
    var payload = Object.assign(
      {
        trackingId: trackingId,
        sessionId: sessionId,
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      params(),
      extra
    );

    var body = JSON.stringify(payload);
    var url = endpoint.replace(/\/$/, '') + '/api/ingest/hit';

    log('sending hit', payload);

    // Prefer fetch so the response (and any CORS/network failure) is visible in the
    // console — useful while wiring up a new host/tunnel. sendBeacon is silent and is
    // only used as a fallback for the unload hit, where fetch may get cancelled.
    if (extra && extra.isUnload && navigator.sendBeacon) {
      var delivered = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      log('sendBeacon queued', { delivered: delivered, url: url });
      return;
    }

    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true })
      .then(function (res) {
        log('hit response', { status: res.status, ok: res.ok, url: url });
      })
      .catch(function (err) {
        log('hit failed — check CORS/tunnel/network', { error: String(err), url: url });
      });
  }

  sendHit({});

  window.addEventListener('beforeunload', function () {
    var timeOnPageSeconds = Math.round((Date.now() - pageStart) / 1000);
    sendHit({ timeOnPageSeconds: timeOnPageSeconds, isUnload: true });
  });
})();
