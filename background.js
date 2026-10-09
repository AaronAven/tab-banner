async function data() { return (await chrome.storage.local.get('titles')).titles || {}; }
async function titleFor(tabId, url) {
  const temporary = (await chrome.storage.session.get('temporary')).temporary || {};
  if (temporary[tabId]?.url === url) return temporary[tabId].title;
  if (temporary[tabId]) { delete temporary[tabId]; await chrome.storage.session.set({temporary}); }
  return (await data())[url] || null;
}
async function inject(tabId, expectedURL) {
  await chrome.scripting.executeScript({target:{tabId},files:['content.js']});
  const tab = await chrome.tabs.get(tabId);
  const url = expectedURL || tab.url;
  if (!url) return;
  if (expectedURL && tab.url !== expectedURL) throw new Error('The tab changed. Open the popup again.');
  const title = await titleFor(tabId, url);
  const result = await chrome.tabs.sendMessage(tabId, {type:'apply',url,title}, {frameId:0});
  if (!result?.ok) throw new Error(result?.error || 'Brave could not change this tab title. Reload the page and try again.');
  return result;
}
function injectQuietly(tabId) { return inject(tabId).catch(() => {}); }
async function registerOrigins() {
  const origins = [...new Set(Object.keys(await data()).map(url => new URL(url).origin + '/*'))];
  const granted = [];
  for (const origin of origins) if (await chrome.permissions.contains({origins:[origin]})) granted.push(origin);
  await chrome.scripting.unregisterContentScripts();
  if (granted.length) await chrome.scripting.registerContentScripts([{id:'saved-titles',matches:granted,js:['content.js'],runAt:'document_start',persistAcrossSessions:true}]);
}
async function handle(message, sender) {
  if (message.type === 'get') return {title:await titleFor(sender.tab.id, message.url)};
  if (message.type === 'list') return {titles:await data()};
  if (message.type === 'save' || message.type === 'reset') {
    const tab = await chrome.tabs.get(message.tabId);
    if (tab.url !== message.url) throw new Error('The tab changed. Open the popup again.');
    const temporary = (await chrome.storage.session.get('temporary')).temporary || {};
    const titles = await data();
    if (message.type === 'reset') { delete temporary[tab.id]; delete titles[message.url]; }
    else if (message.permanent) {
      const origin = new URL(message.url).origin + '/*';
      if (!await chrome.permissions.contains({origins:[origin]})) throw new Error('Site access is needed to remember this title.');
      titles[message.url] = message.title; delete temporary[tab.id];
    } else temporary[tab.id] = {url:message.url,title:message.title};
    await chrome.storage.session.set({temporary});
    await chrome.storage.local.set({titles});
    await registerOrigins();
    await inject(tab.id, message.url);
    return {ok:true};
  }
  if (message.type === 'remove') {
    const titles = await data(); delete titles[message.url];
    await chrome.storage.local.set({titles}); await registerOrigins();
    for (const tab of await chrome.tabs.query({})) await injectQuietly(tab.id);
    return {ok:true};
  }
}
let serial = Promise.resolve();
chrome.runtime.onMessage.addListener((message,sender,respond) => {
  if (message.type === 'get') {
    handle(message,sender).then(respond, error => respond({error:error.message}));
    return true;
  }
  // Start the permission request while the popup's user gesture is active.
  // The worker finishes saving even if Brave closes the popup for the prompt.
  let permission = Promise.resolve(true);
  if (message.type === 'save' && message.permanent) {
    try { permission = chrome.permissions.request({origins:[new URL(message.url).origin + '/*']}); }
    catch (error) { respond({error:error.message}); return false; }
  }
  const granted = permission.then(value => ({value}), error => ({error}));
  serial = serial.then(async () => {
    const result = await granted;
    if (result.error) throw result.error;
    if (!result.value) throw new Error('Allow site access to remember a title, or choose Temporarily.');
    return handle(message,sender);
  }).then(result => respond(result), error => respond({error:error.message}));
  return true;
});
chrome.tabs.onUpdated.addListener((id,change) => { if(change.status === 'complete' || change.url) injectQuietly(id); });
chrome.tabs.onRemoved.addListener(id => {
  serial = serial.then(async () => {
    const temporary = (await chrome.storage.session.get('temporary')).temporary || {};
    delete temporary[id]; await chrome.storage.session.set({temporary});
  });
});
chrome.runtime.onInstalled.addListener(registerOrigins);
chrome.runtime.onStartup.addListener(registerOrigins);
chrome.permissions.onRemoved.addListener(registerOrigins);
