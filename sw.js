/* Carnet Vente: cache simple. En ligne on prend la dernière version, hors ligne on sert la copie gardée. */
const CACHE='carnet-quick-v19';
const ASSETS=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  /* rapide même avec un mauvais réseau : on sert la copie gardée tout de suite et on la met à jour en arrière-plan */
  e.respondWith(caches.open(CACHE).then(c=>c.match(req,{ignoreSearch:true}).then(hit=>{
    const net=fetch(req).then(res=>{if(res&&res.ok)c.put(req,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return net.then(r=>r||c.match('index.html'));
  })));
});
