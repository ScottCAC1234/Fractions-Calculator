// --- Fractions PWA Core Logic ---
function parseFraction(str) {
  if (!str) return [0, 1];
  str = str.trim();
  if (str === "") return [0, 1];
  let sign = 1;
  if (str[0] === "+") { str = str.slice(1).trim(); }
  else if (str[0] === "-") { sign = -1; str = str.slice(1).trim(); }
  if (str.includes(" ")) {
    const [wholeStr, fracStr] = str.split(" ");
    const whole = parseInt(wholeStr, 10);
    const parts = fracStr.split("/");
    if (parts.length !== 2) return [sign * whole, 1];
    const n = parseInt(parts[0], 10);
    const d = parseInt(parts[1], 10);
    if (!Number.isFinite(whole) || !Number.isFinite(n) || !Number.isFinite(d) || d === 0) return [0, 1];
    const improper = whole * d + n;
    return [sign * improper, d];
  }
  if (str.includes("/")) {
    const [nStr, dStr] = str.split("/");
    const n = parseInt(nStr, 10);
    const d = parseInt(dStr, 10);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return [0, 1];
    return [sign * n, d];
  }
  const whole = parseInt(str, 10);
  if (!Number.isFinite(whole)) return [0, 1];
  return [sign * whole, 1];
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function simplify([num, den]) { if (den === 0) return [0, 1]; const g = gcd(num, den); if (den < 0) { num = -num; den = -den; } return [num / g, den / g]; }
function toMixedFraction([num, den]) { if (den === 0) return "NaN"; const sign = num < 0 ? -1 : 1; const absNum = Math.abs(num); const whole = Math.trunc(absNum / den); const remainder = absNum % den; if (remainder === 0) return `${sign * whole}`; if (whole === 0) return `${sign < 0 ? "-" : ""}${remainder}/${den}`; return `${sign < 0 ? "-" : ""}${whole} ${remainder}/${den}`; }
function calculate() {
  const inputs = document.querySelectorAll(".fraction-input");
  const operators = document.querySelectorAll(".operator");
  let [num, den] = [0, 1]; let expression = "";
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]; const val = (input.value || "").trim(); if (!val) continue;
    let [n, d] = parseFraction(val);
    const op = i > 0 ? operators[i - 1].value : "+";
    if (op === "/" && n === 0) { alert("Cannot divide by 0. Please adjust your input."); return; }
    expression += (i > 0 ? " " + op + " " : "") + val;
    switch (op) {
      case "+": [num, den] = [num * d + n * den, den * d]; break;
      case "-": [num, den] = [num * d - n * den, den * d]; break;
      case "*": [num, den] = [num * n, den * d]; break;
      case "/": [num, den] = [num * d, den * n]; break;
    }
    [num, den] = simplify([num, den]);
  }
  const fraction = simplify([num, den]); const mixed = toMixedFraction(fraction); const decimal = (fraction[0] / fraction[1]).toFixed(6);
  document.getElementById("fraction-result").innerText = `Fraction: ${fraction[0]}/${fraction[1]}`;
  document.getElementById("mixed-result").innerText = `Mixed: ${mixed}`;
  document.getElementById("decimal-result").innerText = `Decimal: ${decimal}`;
  const historyDiv = document.getElementById("history");
  const entry = document.createElement("div"); entry.classList.add("history-entry");
  entry.innerHTML = `<strong>${expression || "(no input)"}</strong><br/>Fraction: ${fraction[0]}/${fraction[1]}<br/>Mixed: ${mixed}<br/>Decimal: ${decimal}`;
  historyDiv.prepend(entry);
}
function updateExpressionPreview() {
  const inputs = document.querySelectorAll(".fraction-input");
  const operators = document.querySelectorAll(".operator");
  let parts = [];
  for (let i = 0; i < inputs.length; i++) {
    const val = (inputs[i].value || "").trim(); if (!val) continue;
    if (i === 0) { parts.push(val); } else { parts.push(operators[i - 1].value); parts.push(val); }
  }
  const expr = parts.join(" ");
  document.getElementById("expression-preview").innerText = "Expression: " + (expr || "");
}
function clearAll() {
  document.querySelectorAll(".fraction-input").forEach(input => { input.value = ""; });
  document.querySelectorAll(".operator").forEach(op => { op.value = "+"; });
  document.getElementById("expression-preview").innerText = "Expression: ";
  document.getElementById("fraction-result").innerText = "Fraction: ";
  document.getElementById("mixed-result").innerText = "Mixed: ";
  document.getElementById("decimal-result").innerText = "Decimal: ";
}
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".fraction-input, .operator").forEach(el => el.addEventListener("input", updateExpressionPreview));
  if ("serviceWorker" in navigator) { navigator.serviceWorker.register("service-worker.js"); }
});
