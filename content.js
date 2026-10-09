(() => {
  if (window.__tabBanner?.version === 4) return;
  window.__tabBanner?.stop?.();
  let custom = null, original = document.title, lastURL = location.href;
  let revision = 0;
  function apply(reassert = false) {
    if (!custom || (!reassert && document.title === custom)) return;
    if (!document.head) return;
    // Some apps update the browser tab label through history while the DOM
    // title remains unchanged. A real title transition resynchronizes the label.
    if (reassert && document.title === custom) document.title = "";
    document.title = custom;
    observer.takeRecords();
  }
  function setTitle(title, url, reassert = false) {
    if (url !== location.href) return {ok:false,error:'The page URL changed. Open the popup again.'};
    revision++;
    const previous = custom;
    custom = title || null;
    if (custom) {
      if (!previous) original = document.title;
      apply(reassert);
    } else if (previous && document.title === previous) {
      document.title = original;
      observer.takeRecords();
    }
    return {ok: !custom || document.title === custom, title:document.title};
  }
  const observer = new MutationObserver(() => {
    // Do not write inside a mutation callback: some apps have their own title
    // observers, which would otherwise ping-pong within the same microtask.
    if (custom && document.title !== custom) original = document.title;
  });
  async function refresh() {
    const url = location.href, requestedRevision = revision;
    try {
      const result = await chrome.runtime.sendMessage({type:'get',url});
      if (!result?.error && requestedRevision === revision && url === location.href) setTitle(result?.title,url);
    } catch (_) { stop(); }
  }
  function receive(message, sender, respond) {
    if (message.type !== 'apply') return;
    respond(setTitle(message.title,message.url,message.reassert));
  }
  function stop() { observer.disconnect(); clearInterval(timer); chrome.runtime.onMessage.removeListener(receive); }
  observer.observe(document,{childList:true,subtree:true,characterData:true});
  chrome.runtime.onMessage.addListener(receive);
  const timer = setInterval(() => {
    if (location.href !== lastURL) { lastURL = location.href; refresh(); }
    else if (custom && document.title !== custom) { original = document.title; apply(); }
  },500);
  window.__tabBanner = {version:4,refresh,stop};
  refresh();
})();
