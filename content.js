(() => {
  if (window.__tabBanner?.version === 2) return;
  window.__tabBanner?.stop?.();
  let custom = null, original = document.title, lastURL = location.href;
  let revision = 0;
  function apply() {
    if (!custom || document.title === custom) return;
    if (!document.head) return;
    document.title = custom;
    observer.takeRecords();
  }
  function setTitle(title, url) {
    if (url !== location.href) return {ok:false,error:'The page URL changed. Open the popup again.'};
    revision++;
    const previous = custom;
    custom = title || null;
    if (custom) {
      if (!previous) original = document.title;
      apply();
    } else if (previous && document.title === previous) {
      document.title = original;
      observer.takeRecords();
    }
    return {ok: !custom || document.title === custom, title:document.title};
  }
  const observer = new MutationObserver(() => {
    if (custom && document.title !== custom) { original = document.title; apply(); }
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
    respond(setTitle(message.title,message.url));
  }
  function stop() { observer.disconnect(); clearInterval(timer); chrome.runtime.onMessage.removeListener(receive); }
  observer.observe(document,{childList:true,subtree:true,characterData:true});
  chrome.runtime.onMessage.addListener(receive);
  const timer = setInterval(() => {
    if (location.href !== lastURL) { lastURL = location.href; refresh(); }
  },500);
  window.__tabBanner = {version:2,refresh,stop};
  refresh();
})();
