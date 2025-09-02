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
let tokens=[];              // [frac, op, frac, ...]
let afterEquals = false;    // controls equation rendering

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
  return list.map(t => typeof t==="string" ? t : toMixed(t)).join(" ");
}

function partialPreview(){
  // show numerator while denominator missing, as "1 1/□"
  let out = "";
  if (whole) out += whole + (num!=="" || den!=="" ? " " : "");
  if (num!=="" || den!==""){
    out += (num==="" ? "0" : num) + "/" + (den==="" ? "□" : den);
  }
  return out.trim();
}

function renderInput(eqResult){ // eqResult optional -> render "= R"
  let expr = tokensToString(tokens);
  const cur = currentFrac();
  if (cur){
    expr = (expr ? expr + " " : "") + toMixed(cur);
  } else {
    const preview = partialPreview();
    if (preview) expr = (expr ? expr + " " : "") + preview;
  }
  if (eqResult){
    expr += " = " + toMixed(eqResult);
  }
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
  if (!el) return;
  el.classList.add("warn");
  setTimeout(()=>el.classList.remove("warn"), 900);
}

function clearPad(target){
  if (target==="whole") whole=""; if (target==="num") num=""; if (target==="den") den="";
  afterEquals = false;
  renderInput();
}
function clearAll(){
  whole=num=den=""; tokens=[]; afterEquals=false;
  document.getElementById("history").innerHTML="";
  renderInput(); renderResult(null);
}
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("clear-all")?.addEventListener("click", clearAll);
});

function appendDigit(target, digit){
  if (target==="whole") whole += digit;
  if (target==="num")   num   += digit;
  if (target==="den")   den   += digit;
  afterEquals = false;
  renderInput();
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
  renderInput();
  return true;
}

function pressOp(op){
  if (afterEquals){
    afterEquals = false; // continue from tokens=[result]
  }
  if (tokens.length>0 && typeof tokens[tokens.length-1]==="string"){
    tokens[tokens.length-1] = op; renderInput(); return;
  }
  if (!commitCurrent()) return;
  tokens.push(op);
  renderInput();
}

function evaluateTokens(list){
  if (list.length===0) return [0,1];
  if (typeof list[list.length-1]==="string") list = list.slice(0,-1);
  if (list.length===0) return [0,1];
  let acc = list[0];
  for (let i=1;i<list.length;i+=2){
    const op=list[i], rhs=list[i+1]; if(!rhs) break;
    if (op==="+") acc = add(acc, rhs);
    else if (op==="−"||op==="–"||op==="—"||op==="-") acc = sub(acc, rhs);
    else if (op==="*") acc = mul(acc, rhs);
    else if (op==="/") acc = div(acc, rhs);
  }
  return simplify(acc);
}

function pressEquals(){
  // If the last token is an operator, try to commit the current fraction.
  if (tokens.length>0 && typeof tokens[tokens.length-1]==="string"){
    const cur = currentFrac();
    if (cur){ tokens.push(cur); whole=num=den=""; }
    else { tokens.pop(); } // nothing after op: drop op
  } else {
    const cur = currentFrac();
    if (cur){ tokens.push(cur); whole=num=den=""; }
  }

  if (tokens.length===0){ renderResult(null); renderInput(); return; }

  const exprTokens = tokens.slice();
  let result; try { result = evaluateTokens(exprTokens.slice()); }
  catch(e){ flashPad("den"); return; }

  renderInput(result);       // "A op B = R"
  renderResult(result);

  const entry = document.createElement("div");
  entry.className="history-entry";
  entry.innerHTML = `<strong>${tokensToString(exprTokens)} = ${toMixed(result)}</strong><br>Decimal: ${(result[0]/result[1]).toFixed(6)}`;
  document.getElementById("history").prepend(entry);

  tokens = [result];
  afterEquals = true;
  renderInput();
}

document.addEventListener("click",(e)=>{
  const btn = e.target.closest("button"); if(!btn) return;
  if (btn.dataset.digit){
    const pad = btn.closest(".pad"); const target = pad?.dataset.target;
    if (target) appendDigit(target, btn.dataset.digit); return;
  }
  if (btn.dataset.action==="clear-pad"){ clearPad(btn.dataset.target); return; }
  if (btn.classList.contains("op") && btn.id!=="equals"){ pressOp(btn.dataset.op); return; }
  if (btn.id==="equals"){ pressEquals(); return; }
});

renderInput(); renderResult(null);

if ("serviceWorker" in navigator) { navigator.serviceWorker.register("service-worker.js"); }
