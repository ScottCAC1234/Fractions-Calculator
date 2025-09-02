// ------- Fraction math helpers -------
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a||1; }
function simplify([n,d]){ if(d===0) return [0,1]; if(d<0){ n=-n; d=-d; } const g=gcd(n,d); return [n/g,d/g]; }
function add([a,b],[c,d]){ return simplify([a*d + c*b, b*d]); }
function sub([a,b],[c,d]){ return simplify([a*d - c*b, b*d]); }
function mul([a,b],[c,d]){ return simplify([a*c, b*d]); }
function div([a,b],[c,d]){ if(c===0) throw new Error("Divide by 0"); return simplify([a*d, b*c]); }
function toMixed([n,d]){ if(d===0) return "NaN"; const sign=n<0?-1:1, A=Math.abs(n); const w=Math.trunc(A/d), r=A%d; if(r===0) return String(sign*w); if(w===0) return `${sign<0?'-':''}${r}/${d}`; return `${sign<0?'-':''}${w} ${r}/${d}`; }

// ------- UI state -------
let whole="", num="", den="";
let tokens=[];              // [frac, op, frac, ...]
let afterEquals = false;

// Helpers to format ops with symbols
function opSymbol(op){ return op==="*"?"×":op==="/"?"÷":op==="-"?"−":op; }

function currentFrac(){
  if (whole==="" && num==="" && den==="") return null;
  if (num==="" && den===""){ const w=parseInt(whole||"0",10); return [w,1]; }
  if (num!=="" && den==="") return null;
  if (den==="0") return null;
  const w=parseInt(whole||"0",10);
  const n=parseInt(num||"0",10);
  const d=parseInt(den||"1",10);
  return simplify([w*d + n, d]);
}

function tokensToString(list){
  return list.map(t => typeof t==="string" ? opSymbol(t) : toMixed(t)).join(" ");
}

function typedPreview(){
  // Always show numerator even if denominator missing: "1 1/□"
  if (whole==="" && num==="" && den==="") return "";
  let parts=[];
  if (whole!=="") parts.push(whole);
  if (num!=="" || den!==""){
    const n = (num==="" ? "0" : num);
    const d = (den==="" ? "□" : den);
    parts.push(`${n}/${d}`);
  }
  return parts.join(" ");
}

function renderInput(eqResult){
  let expr = tokensToString(tokens);
  const cur = currentFrac();
  if (cur){
    expr = (expr?expr+" ":"") + toMixed(cur);
  } else {
    const preview = typedPreview();
    if (preview) expr = (expr?expr+" ":"") + preview;
  }
  if (eqResult){ expr += " = " + toMixed(eqResult); }
  document.getElementById("display-input").innerText = expr || "0";
}

function renderResult(frac){
  if (!frac){
    document.getElementById("result-mixed").innerText = "-";
    document.getElementById("result-decimal").innerText = "-";
    return;
  }
  document.getElementById("result-mixed").innerText = toMixed(frac);
  document.getElementById("result-decimal").innerText = (frac[0]/frac[1]).toFixed(6);
}

function flashPad(target){
  const el = document.querySelector(`.pad[data-target="${target}"]`);
  if (!el) return; el.classList.add("warn"); setTimeout(()=>el.classList.remove("warn"), 900);
}

function clearPad(target){
  if (target==="whole") whole="";
  if (target==="num")   num="";
  if (target==="den")   den="";
  afterEquals = false; renderInput();
}
function clearAll(){
  whole=num=den=""; tokens=[]; afterEquals=false;
  document.getElementById("history").innerHTML=""; renderInput(); renderResult(null);
}
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("clear-all")?.addEventListener("click", clearAll);
});

function appendDigit(target, d){
  if (target==="whole") whole += d;
  if (target==="num")   num   += d;
  if (target==="den")   den   += d;
  afterEquals = false; renderInput();
}

function commitCurrent(){
  const f = currentFrac();
  if (!f){
    if (num!=="" && den===""){ flashPad("den"); }
    else if (den==="0"){ flashPad("den"); }
    return false;
  }
  tokens.push(f); whole=num=den=""; renderInput(); return true;
}

function pressOp(op){
  if (afterEquals){ afterEquals=false; }
  if (tokens.length>0 && typeof tokens[tokens.length-1]==="string"){
    tokens[tokens.length-1] = op; renderInput(); return;
  }
  if (!commitCurrent()) return;
  tokens.push(op); renderInput();
}

function evaluateTokens(list){
  if (list.length===0) return [0,1];
  if (typeof list[list.length-1]==="string") list=list.slice(0,-1);
  if (list.length===0) return [0,1];
  let acc=list[0];
  for(let i=1;i<list.length;i+=2){
    const op=list[i], rhs=list[i+1]; if(!rhs) break;
    if(op==="+") acc=add(acc,rhs);
    else if(op==="-"||op==="−"||op==="–"||op==="—") acc=sub(acc,rhs);
    else if(op==="*") acc=mul(acc,rhs);
    else if(op==="/") acc=div(acc,rhs);
  }
  return simplify(acc);
}

function pressEquals(){
  if (tokens.length>0 && typeof tokens[tokens.length-1]==="string"){
    const cur=currentFrac();
    if (cur){ tokens.push(cur); whole=num=den=""; }
    else { tokens.pop(); }
  } else {
    const cur=currentFrac();
    if (cur){ tokens.push(cur); whole=num=den=""; }
  }
  if (tokens.length===0){ renderResult(null); renderInput(); return; }

  const expr = tokens.slice();
  const result = evaluateTokens(expr.slice());
  renderInput(result); renderResult(result);

  const entry=document.createElement("div");
  entry.className="history-entry";
  entry.innerHTML = `<strong>${tokensToString(expr)} = ${toMixed(result)}</strong><br>Decimal: ${(result[0]/result[1]).toFixed(6)}`;
  document.getElementById("history").prepend(entry);

  tokens=[result]; afterEquals=true; renderInput();
}

document.addEventListener("click",(e)=>{
  const btn=e.target.closest("button"); if(!btn) return;
  if (btn.dataset.digit){
    const pad=btn.closest(".pad"); const target=pad?.dataset.target;
    if (target) appendDigit(target, btn.dataset.digit); return;
  }
  if (btn.dataset.action==="clear-pad"){ clearPad(btn.dataset.target); return; }
  if (btn.classList.contains("op") && btn.id!=="equals"){ pressOp(btn.dataset.op); return; }
  if (btn.id==="equals"){ pressEquals(); return; }
});

renderInput(); renderResult(null);

if ("serviceWorker" in navigator){ navigator.serviceWorker.register("service-worker.js"); }
