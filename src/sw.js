const C='coco-v2';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/')||u.pathname.startsWith('/v/'))return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(k=>k.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
self.addEventListener('push',e=>e.waitUntil((async()=>{
  let d={title:'Coco 🐵',body:'Tus 5 minuticos de francés te esperan, mi amor. — Tu gordito'};
  try{const c=new AbortController();setTimeout(()=>c.abort(),5000);
    const r=await fetch('/api/notif',{signal:c.signal,cache:'no-store'});if(r.ok)d=await r.json()}catch(_){}
  await self.registration.showNotification(d.title,{body:d.body,icon:'/icon-512.png',data:{url:'/'}});
})()));
self.addEventListener('notificationclick',e=>{e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if('focus'in c)return c.focus()}return self.clients.openWindow('/')}))});
