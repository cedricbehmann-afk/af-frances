// AF · Francés con Coco — Worker Cloudflare (un seul fichier)
// Liaison requise : espace KV nommé "KV". Déclencheur cron : */30 * * * *
const VAPID_PUBLIC="__VAPID_PUBLIC__";
const VAPID_JWK=__VAPID_JWK__;
const APP_HTML=__APP__, SW_JS=__SW__;
const VOICES=__VOICES__; // sa voix, intégrée au fichier
const DEF_SCH={days:["11:30","19:30","19:30","19:30","19:30","19:30","11:30"],tz:240}; // dim→sam, heure de Saint-Domingue
const ICONS={"/icon-180.png":"__I180__","/icon-512.png":"__I512__"};
const MANIFEST=JSON.stringify({name:"AF · Francés con Coco",short_name:"AF",start_url:"/",scope:"/",display:"standalone",background_color:"#FFE3F1",theme_color:"#FFE3F1",lang:"es",
  icons:[{src:"/icon-180.png",sizes:"180x180",type:"image/png"},{src:"/icon-512.png",sizes:"512x512",type:"image/png",purpose:"any maskable"}]});
const NOTIFS=[
 "Mi amor, Coco ya tiene tus palabritas de hoy 🐵 Cinco minuticos y ya. — Tu gordito",
 "Mi reina 👑 ¿5 minuticos de francés? Coco te está esperando. — Tu gordito",
 "Coco pregunta por ti 🍌 Ven a aprender algo bonito para decirme. — Tu gordito",
 "Mi vida, hoy toca frase nueva para tu gordito 💌 Entra un chin. — Tu gordito",
 "Princesa, tu mono favorito te guardó palabras nuevas ✨ — Tu gordito",
 "¡No dejes sola a Coco! 🙈 Un ratico de francés y a descansar. — Tu gordito",
 "Mi amor, tu racha te espera 🔥 Son solo 5 minuticos. — Tu gordito",
 "El alma de tu gordito quiere oírte hablar francés 😘 Entra con Coco. — Tu gordito"];
const enc=new TextEncoder();
const b64u=b=>{let s="";for(const c of new Uint8Array(b))s+=String.fromCharCode(c);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const html=s=>new Response(s,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-cache"}});
const getJ=async(env,k,d)=>{const v=await env.KV.get(k);try{return v?JSON.parse(v):d}catch(e){return d}};
// Heure locale de son téléphone (tz = décalage en minutes, 240 = Saint-Domingue)
function localNow(ms,tz){const d=new Date(ms-tz*60e3);return{day:d.toISOString().slice(0,10),hm:d.toISOString().slice(11,16),dow:d.getUTCDay(),n:Math.floor((ms-tz*60e3)/864e5)}}
async function vapidAuth(endpoint,sub){
  const part=o=>b64u(enc.encode(JSON.stringify(o)));
  const unsigned=part({typ:"JWT",alg:"ES256"})+"."+part({aud:new URL(endpoint).origin,exp:Math.floor(Date.now()/1000)+12*3600,sub});
  const key=await crypto.subtle.importKey("jwk",VAPID_JWK,{name:"ECDSA",namedCurve:"P-256"},false,["sign"]);
  const sig=await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},key,enc.encode(unsigned));
  return `vapid t=${unsigned}.${b64u(sig)}, k=${VAPID_PUBLIC}`}
// Push sans contenu : le service worker va chercher le texte sur /api/notif
async function pushAll(env){
  const subs=await getJ(env,"subs",[]),origin=(await env.KV.get("origin"))||"https://example.com";
  const results=[],keep=[];
  for(const s of subs){
    try{const r=await fetch(s.endpoint,{method:"POST",headers:{TTL:"43200",Urgency:"normal",Authorization:await vapidAuth(s.endpoint,origin)}});
      results.push(r.status);if(r.status!==404&&r.status!==410)keep.push(s)}
    catch(e){results.push(String(e));keep.push(s)}}
  if(keep.length!==subs.length)await env.KV.put("subs",JSON.stringify(keep));
  return{sent:results.filter(x=>x>=200&&x<300).length,results}}
export default{
  async fetch(req,env){
    const u=new URL(req.url),p=u.pathname,m=req.method;
    if(!env.KV&&p.startsWith("/api/"))return json({error:"Liaison KV manquante (nom attendu : KV)"},500);
    if(p==="/"||p==="/index.html")return html(APP_HTML);
    if(p==="/sw.js")return new Response(SW_JS,{headers:{"content-type":"text/javascript","cache-control":"no-cache"}});
    if(p==="/manifest.webmanifest")return new Response(MANIFEST,{headers:{"content-type":"application/manifest+json"}});
    if(ICONS[p])return new Response(unb64(ICONS[p]),{headers:{"content-type":"image/png","cache-control":"public, max-age=86400"}});
    if(p==="/api/config")return json({vapid:VAPID_PUBLIC,voices:Object.keys(VOICES),version:"__VERSION__"});
    if(p==="/api/subscribe"&&m==="POST"){
      const s=await req.json();if(!s||!/^https:\/\//.test(s.endpoint||""))return json({error:"bad"},400);
      const subs=(await getJ(env,"subs",[])).filter(x=>x.endpoint!==s.endpoint);subs.push({endpoint:s.endpoint,at:Date.now()});
      await env.KV.put("subs",JSON.stringify(subs.slice(-5)));await env.KV.put("origin",u.origin);return json({ok:true})}
    if(p==="/api/done"&&m==="POST"){const b=await req.json();
      await env.KV.put("progress",JSON.stringify({day:String(b.day).slice(0,10),streak:+b.streak||0,learned:+b.learned||0,total:+b.total||0,at:Date.now()}));return json({ok:true})}
    if(p==="/api/notif"){const sc=await getJ(env,"schedule",DEF_SCH);return json({title:"Coco 🐵🎀",body:NOTIFS[localNow(Date.now(),sc.tz).n%NOTIFS.length]})}
    const vm=p.match(/^\/api\/voice\/([wp]\d{1,3})$/);
    if(vm&&VOICES[vm[1]])return new Response(unb64(VOICES[vm[1]]),{headers:{"content-type":"audio/mp4","cache-control":"public, max-age=604800"}});
    if(p==="/api/schedule"&&m==="POST"){const b=await req.json(),d=b.days;
      if(!Array.isArray(d)||d.length!==7||!d.every(x=>x==="off"||/^([01]\d|2[0-3]):(00|30)$/.test(x))||!(Math.abs(+b.tz)<=840))return json({error:"bad"},400);
      await env.KV.put("schedule",JSON.stringify({days:d,tz:+b.tz}));return json({ok:true})}
    if(p==="/api/schedule")return json(await getJ(env,"schedule",DEF_SCH));
    return new Response("Not found",{status:404})},
  async scheduled(ev,env,ctx){
    const sc=await getJ(env,"schedule",DEF_SCH),t=localNow(ev.scheduledTime||Date.now(),sc.tz);
    if(sc.days[t.dow]!==t.hm)return;
    const pr=await getJ(env,"progress",null);if(pr&&pr.day===t.day)return;
    await pushAll(env)}};
