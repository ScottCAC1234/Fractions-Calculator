// Minimal fraction calculator logic (Whole/Numerator/Denominator inputs)
(function(){
  const inputDisplay = document.getElementById('inputDisplay');
  const resultDisplay = document.getElementById('resultDisplay');

  // current editable parts for the left operand
  const left = { whole: "", num: "", den: "" };
  let pendingOp = null; // '+', '-', '*', '/'
  let stored = null;     // stored Fraction for left operand

  function gcd(a,b){ return b ? gcd(b, a%b) : Math.abs(a); }
  function toFraction(obj){
    // Convert {whole, num, den} -> Fraction (numerator/denominator)
    let w = parseInt(obj.whole || "0", 10);
    let n = parseInt(obj.num   || "0", 10);
    let d = parseInt(obj.den   || "0", 10);

  // If denominator is 0, treat it as 1 only for calculations
  const calcDen = d === 0 ? 1 : d;

  const sign = w < 0 ? -1 : 1;
  w = Math.abs(w);
  const num = sign * (w * calcDen + n);
  return { n: num, d: calcDen };
    const sign = w < 0 ? -1 : 1;
    w = Math.abs(w);
    const num = sign * (w * d + n);
    return { n: num, d };
  }
  function simplify(fr){
    const g = gcd(fr.n, fr.d);
    return { n: fr.n / g, d: fr.d / g };
  }
  function add(a,b){ return simplify({ n: a.n*b.d + b.n*a.d, d: a.d*b.d }); }
  function sub(a,b){ return simplify({ n: a.n*b.d - b.n*a.d, d: a.d*b.d }); }
  function mul(a,b){ return simplify({ n: a.n*b.n, d: a.d*b.d }); }
  function div(a,b){ return simplify({ n: a.n*b.d, d: a.d*b.n }); }

  function asMixed(fr){
    const sign = fr.n < 0 ? -1 : 0;
    const absn = Math.abs(fr.n);
    const whole = Math.floor(absn / fr.d) * (sign ? -1 : 1);
    const rem = absn % fr.d;
    return { whole, num: rem, den: fr.d };
  }

  function renderInput(){
    const w = left.whole || "0";
    const n = left.num || "0";
    const d = left.den || "0";
    inputDisplay.textContent = `${w} ${n}/${d}`;
  }

  function renderResult(fr){
    if (!fr){ resultDisplay.textContent = "-"; return; }
    const m = asMixed(fr);
    if (m.num === 0){
      resultDisplay.textContent = `${m.whole}`;
    } else if (m.whole === 0){
      resultDisplay.textContent = `${m.num}/${m.den}`;
    } else {
      resultDisplay.textContent = `${m.whole} ${m.num}/${m.den}`;
    }
  }

  // Handle digit taps
  document.querySelectorAll('[data-num]').forEach(btn=>{
    btn.addEventListener('click', () => {
      const parent = btn.closest('[data-target]');
      if(!parent) return;
      const target = parent.getAttribute('data-target');
      const digit = btn.getAttribute('data-num');
      if (target === 'whole') left.whole += digit;
      if (target === 'num')   left.num   += digit;
      if (target === 'den')   left.den   += digit;
      renderInput();
    });
  });

  // Clears
  document.querySelectorAll('[data-clear]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const t = btn.getAttribute('data-clear');
      if (t==='whole') left.whole = "";
      if (t==='num')   left.num   = "";
      if (t==='den')   left.den   = "";
      renderInput();
    });
  });

  // Clear all
  document.getElementById('clearAll').addEventListener('click', ()=>{
    left.whole = left.num = left.den = "";
    stored = null;
    pendingOp = null;
    renderInput();
    renderResult(null);
  });

  // Operations
  document.querySelectorAll('.btn-op').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const current = toFraction(left);
      if (stored == null){
        stored = current;
      } else if (pendingOp){
        stored = compute(stored, current, pendingOp);
      }
      pendingOp = btn.getAttribute('data-op');
      // reset left inputs for next entry
      left.whole = left.num = left.den = "";
      renderInput();
      renderResult(stored);
    });
  });

  function compute(a,b,op){
    if (op === '+') return add(a,b);
    if (op === '-') return sub(a,b);
    if (op === '*') return mul(a,b);
    if (op === '/') return div(a,b);
    return b;
  }

  // Equals
  document.getElementById('equals').addEventListener('click', ()=>{
    const current = toFraction(left);
    if (stored == null && !pendingOp){
      stored = current;
    } else if (pendingOp){
      stored = compute(stored, current, pendingOp);
      pendingOp = null;
    } else {
      stored = current;
    }
    renderResult(stored);
  });

  // initial
  renderInput();
  renderResult(null);
})();