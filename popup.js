const $ = id => document.getElementById(id);
let tab;
function status(text,error=false){$('status').textContent=text;$('status').className=error?'error':'';}
async function request(message){const result=await chrome.runtime.sendMessage(message);if(result?.error)throw new Error(result.error);return result;}
async function renderSaved(){
  const {titles}=await request({type:'list'});$('count').textContent=Object.keys(titles).length;$('saved').replaceChildren();
  if(!Object.keys(titles).length){const p=document.createElement('p');p.className='hint';p.textContent='Your remembered titles will appear here.';$('saved').append(p);}
  for(const [url,title] of Object.entries(titles)){
    const row=document.createElement('div');row.className='row';const info=document.createElement('div');const name=document.createElement('strong');name.textContent=title;const site=document.createElement('small');site.textContent=url;site.title=url;info.append(name,site);
    const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label','Remove saved title '+title);
    remove.onclick=async()=>{try{await request({type:'remove',url});await renderSaved();status('Saved title removed.');}catch(e){status(e.message,true);}};row.append(info,remove);$('saved').append(row);
  }
  return titles;
}
document.querySelectorAll('[name=mode]').forEach(input=>input.onchange=()=>{$('hint').textContent=input.value==='permanent'?'Applies to this exact URL. Brave will ask for access to this site.':'Stays on reload. Ends when you change URL or close Brave.';});
$('form').onsubmit=async event=>{
  event.preventDefault();const title=$('title').value.trim();if(!title){status('Enter a title first.',true);return;}
  const permanent=document.querySelector('[name=mode]:checked').value==='permanent';
  try{
    $('save').disabled=true;await request({type:'save',tabId:tab.id,url:tab.url,title,permanent});await renderSaved();status(permanent?'Title saved for this URL.':'Temporary title set.');
  }catch(e){status(e.message,true);}finally{$('save').disabled=false;}
};
$('reset').onclick=async()=>{try{await request({type:'reset',tabId:tab.id,url:tab.url});await renderSaved();status('Original title restored. Saved title cleared for this URL.');}catch(e){status(e.message,true);}};
(async()=>{try{
  [tab]=await chrome.tabs.query({active:true,currentWindow:true});const titles=await renderSaved();
  if(!tab?.url || !/^https?:/.test(tab.url)){ $('title').disabled=true;$('save').disabled=true;$('reset').disabled=true;status('Open a normal website to rename its tab. Browser pages and built-in PDF tabs are unsupported.',true);return; }
  $('site').textContent=tab.url;$('site').title=tab.url;$('title').value=titles[tab.url]||tab.title||'';
  if(titles[tab.url])document.querySelector('[value=permanent]').checked=true;
  $('title').focus();$('title').select();
}catch(e){status(e.message,true);}})();
