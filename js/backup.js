/* Fairway Tour · Save backup: copy your career as a code, or load one on another device */
'use strict';
const b64e = bytes => { let s=''; for(let i=0;i<bytes.length;i+=0x8000) s+=String.fromCharCode.apply(null, bytes.subarray(i,i+0x8000)); return btoa(s); };
const b64d = str => Uint8Array.from(atob(str), c=>c.charCodeAt(0));
async function pipeBytes(bytes, stream){ const out=new Blob([bytes]).stream().pipeThrough(stream); return new Uint8Array(await new Response(out).arrayBuffer()); }
// FT1 = gzip + base64, FT0 = plain base64 for browsers without compression streams
async function makeSaveCode(){
  persist(); const json=JSON.stringify(save), raw=new TextEncoder().encode(json);
  if(window.CompressionStream){ try{ return 'FT1:'+b64e(await pipeBytes(raw, new CompressionStream('gzip'))); }catch(e){} }
  return 'FT0:'+b64e(raw);
}
async function readSaveCode(code){
  code=(code||'').trim().replace(/\s+/g,''); const m=/^FT([01]):(.+)$/.exec(code); if(!m) throw new Error('That is not a Fairway Tour save code.');
  let bytes=b64d(m[2]); if(m[1]==='1'){ if(!window.DecompressionStream) throw new Error('This browser cannot open compressed codes.'); bytes=await pipeBytes(bytes, new DecompressionStream('gzip')); }
  const data=JSON.parse(new TextDecoder().decode(bytes));
  if(!data || typeof data.cash!=='number' || !data.career || !data.stats) throw new Error('That code is missing career data.');
  return data;
}
function backupHTML(){
  return `<div class="backup">
    <div class="field">Your career only lives in this browser. Copy a save code to keep a backup, or paste one here to move your career between your phone and computer.</div>
    <div class="row"><button class="btn primary sm" type="button" id="bkMake">Copy save code</button></div>
    <textarea id="bkCode" rows="3" spellcheck="false" placeholder="Your save code shows up here. Or paste a code to load it." aria-label="Save code"></textarea>
    <div class="row"><button class="btn ghost sm" type="button" id="bkLoad">Load this code</button></div>
    <small id="bkMsg" class="bkmsg" role="status"></small></div>`;
}
function wireBackup(){
  const make=$('#bkMake'); if(!make) return; const area=$('#bkCode'), msg=$('#bkMsg'), load=$('#bkLoad'); let armed=false;
  make.onclick=async()=>{ const code=await makeSaveCode(); area.value=code; area.focus(); area.select(); let ok=false;
    try{ await navigator.clipboard.writeText(code); ok=true; }catch(e){ try{ ok=document.execCommand('copy'); }catch(_){} }
    msg.textContent=ok?`Copied (${Math.round(code.length/1024)} KB). Paste it somewhere safe, like a note or an email to yourself.`:'Your code is selected below. Copy it and keep it somewhere safe.'; Sound.coin(); };
  load.onclick=async()=>{ let data; try{ data=await readSaveCode(area.value); }catch(e){ msg.textContent=e.message; armed=false; load.textContent='Load this code'; return; }
    if(!armed){ armed=true; load.textContent='Tap again to replace this career'; msg.textContent=`Found a career in year ${data.career.year} on the ${TOUR[data.career.tier]?TOUR[data.career.tier].name:'tour'} with ${money(data.cash)} in the bank. Loading it replaces the career on this device.`; return; }
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(data)); }catch(e){ msg.textContent='Could not save here. Storage may be full or blocked.'; return; }
    location.reload(); };
}
