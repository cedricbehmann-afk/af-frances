import fs from 'fs';import{webcrypto as c}from 'crypto';
const r=f=>fs.readFileSync('src/'+f,'utf8');
let keys;try{keys=JSON.parse(fs.readFileSync('keys.json','utf8'))}catch{
  const k=await c.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const jwk=await c.subtle.exportKey('jwk',k.privateKey),raw=Buffer.from(await c.subtle.exportKey('raw',k.publicKey));
  keys={jwk:{kty:jwk.kty,crv:jwk.crv,x:jwk.x,y:jwk.y,d:jwk.d},pub:raw.toString('base64url')};
  fs.writeFileSync('keys.json',JSON.stringify(keys))}
const data=r('data.js'),inl=f=>JSON.stringify(r(f).replace('/*DATA*/',()=>data));
const V={};if(fs.existsSync('voices'))for(const f of fs.readdirSync('voices'))if(/^[wp]\d+\.m4a$/.test(f))V[f.slice(0,-4)]=fs.readFileSync('voices/'+f).toString('base64');
const out=r('worker.tpl.js').replace('__VAPID_PUBLIC__',keys.pub).replace('__VAPID_JWK__',JSON.stringify(keys.jwk))
 .replace('__APP__',()=>inl('app.html')).replace('__VOICES__',()=>JSON.stringify(V)).replace('__SW__',()=>JSON.stringify(r('sw.js')))
 .replace('__I180__',fs.readFileSync('src/icon-180.png').toString('base64')).replace('__I512__',fs.readFileSync('src/icon-512.png').toString('base64'));
fs.writeFileSync('dist/worker.js',out);console.log('worker.js',(out.length/1024).toFixed(0)+' KB','voix',Object.keys(V).length);
