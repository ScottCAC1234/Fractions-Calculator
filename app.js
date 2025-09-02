// ------- Fraction math helpers -------
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a||1; }
function simplify([n,d]){ if(d===0) return [0,1]; if(d<0){ n=-n; d=-d; } const g=gcd(n,d); return [n/g,d/g]; }
function add([a,b],[c,d]){ return simplify([a*d + c*b, b*d]); }
function sub([a,b],[c,d]){ return simplify([a*d - c*b, b*d]); }
function mul([a,b],[c,d]){ return simplify([a*c, b*d]); }
function div([a,b],[c,d]){ if(c===0) throw new Error("Divide by 0"); return simplify([a*d, b*c]); }
function toMixed([n,d]){ if(d===0) return "NaN"; const sign=n<0?-1:1, A=Math.abs(n); const whole=Math.trunc(A/d), rem=A%d; if(rem===0) return String(sign*whole); if(whole===0) return `${sign<0?'-':''}${rem}/${d}`; return `${sign<0?'-':''}${whole} ${rem}/${d}`; }

// ------- UI state -------
let whole="", num="", den="";
let tokens=[];  // [frac, op, frac, op, frac, ...]

function currentFrac(){
  if (whole==="" && num==="" && den==="") return null;
  if (num==="" && den===""){ const w=parseInt(whole||"0",10); return [w,1]; }
  if (num!=="" && den==="") return null;     // incomplete proper fraction
  if (den==="0") return null;
  const w=parseInt(whole||"0",10);
  const n=parseInt(num||"0",10);
  const d=parseInt(den||"1",10);
  return simplify([w*d + n, d]);
}

function tokensText(){
  let out=[];
  for (let i=0;i<tokens.length;i++){
    const t=tokens[i];
    out.push(typeof t==="string" ? t : toMixed(t));
  }
  const cur=currentFrac();
  if (cur) out.push(toMixed(cur));
  else {
    let txt=""; 
    if (whole) txt+=whole+" ";
    if (num || den!=="" ) txt += (num || "0") + "/" + (den || "?");
    if (txt) out.push(txt.trim());
  }
  return out.filter(Boolean).join(" ");
}

function updateDisplayOnly(){
  document.getElementById("display-input").innerText = tokensText() || "0";
}

function updateAllResults(frac){
  if (!frac){
    document.getElementById("result-fraction").innerText = "-";
    document.getElementById("result-mixed").innerText = "-";
    document.getElementById("result-decimal").innerText = "-";
    return;
  }
  const [n,d]=frac;
  document.getElementById("result-fraction").innerText = `${n}/${d}`;
  document.getElementById("result-mixed").innerText = toMixed(frac);
  document.getElementById("result-decimal").innerText = (n/d).toFixed(6);
}

function flashPad(target){
  const el = document.querySelector(`.pad[data-target="${target}"]`);
  if (!el) return;
  el.classList.add("warn");
  setTimeout(()=>el.classList.remove("warn"), 900);
}

function clearPad(target){
  if (target==="whole") whole="";
  if (target==="num")   num="";
  if (target==="den")   den="";
  updateDisplayOnly();
}

function clearAll(){
  whole=num=den="";
  tokens=[];
  document.getElementById("history").innerHTML="";
  document.getElementById("display-input").innerText="0";
  updateAllResults(null);
}
document.addEventListener("DOMContentLoaded",()=>{
  const clearAllBtn = document.getElementById("clear-all");
  clearAllBtn?.addEventListener("click", clearAll);
});

function appendDigit(target, digit){
  if (target==="whole") whole += digit;
  if (target==="num")   num   += digit;
  if (target==="den")   den   += digit;
  updateDisplayOnly();
}

function commitCurrent(){
  const f = currentFrac();
  if (!f){
    if (num!=="" && den===""){ flashPad("den"); return false; }
    if (den==="0"){ flashPad("den"); return false; }
    return false;
  }
  tokens.push(f);
  whole=num=den="";
  updateDisplayOnly();
  return true;
}

function pressOp(op){
  if (tokens.length>0 && typeof tokens[tokens.length-1]==="string"){
    tokens[tokens.length-1] = op;
    updateDisplayOnly();
    return;
  }
  if (!commitCurrent()) return;
  tokens.push(op);
  updateDisplayOnly();
}

function evaluateTokens(list){
  if (list.length===0) return [0,1];
  if (typeof list[list.length-1]==="string") list = list.slice(0, -1);
  if (list.length===0) return [0,1];
  let acc = list[0];
  for (let i=1;i<list.length;i+=2){
    const op=list[i], rhs=list[i+1];
    if (!rhs) break;
    if (op==="+") acc = add(acc, rhs);
    else if (op==="−" || op==="–" || op==="—" || op==="-") acc = sub(acc, rhs);
    else if (op==="*") acc = mul(acc, rhs);
    else if (op==="/") acc = div(acc, rhs);
  }
  return simplify(acc);
}

function pressEquals(){
  if (!(tokens.length>0 && typeof tokens[tokens.length-1]==="string")){
    const cur = currentFrac();
    if (cur) { tokens.push(cur); whole=num=den=""; }
  } else {
    if (typeof tokens[tokens.length-1]==="string") tokens.pop();
  }
  if (tokens.length===0) { updateAllResults(null); return; }
  const exprText = tokens.map(t => typeof t==="string" ? t : toMixed(t)).join(" ");
  let result; try { result = evaluateTokens(tokens.slice()); } catch(e){ flashPad("den"); return; }
  updateAllResults(result);

  const [n,d]=result;
  const entry = document.createElement("div");
  entry.className="history-entry";
  entry.innerHTML = `<strong>${exprText}</strong><br>Fraction: ${n}/${d}<br>Mixed: ${toMixed(result)}<br>Decimal: ${(n/d).toFixed(6)}`;
  document.getElementById("history").prepend(entry);

  tokens = [result];
  updateDisplayOnly();
}

document.addEventListener("click", (e)=>{
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.dataset.digit){
    const pad = btn.closest(".pad");
    const target = pad?.dataset.target;
    if (target) appendDigit(target, btn.dataset.digit);
    return;
  }
  if (btn.dataset.action==="clear-pad"){
    clearPad(btn.dataset.target);
    return;
  }
  if (btn.classList.contains("op") && btn.id!=="equals"){
    pressOp(btn.dataset.op);
    return;
  }
  if (btn.id==="equals"){
    pressEquals();
    return;
  }
});

// Initial display
updateDisplayOnly();
updateAllResults(null);

// PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
