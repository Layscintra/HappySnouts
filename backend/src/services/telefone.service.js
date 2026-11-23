
const DDDS = new Set([
    11, 12, 13, 14, 15, 16, 17, 18, 19,
    21, 22, 24, 27, 28,
    31, 32, 33, 34, 35, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48, 49,
    51, 53, 54, 55,
    61, 62, 63, 64, 65, 66, 67, 68, 69,
    71, 73, 74, 75, 77, 79,
    81, 82, 83, 84, 85, 86, 87, 88, 89,
    91, 92, 93, 94, 95, 96, 97, 98, 99
]);

export function digitosTelefone(valor) {
    let d = String(valor ?? "").replace(/\D/g, "");
    if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
    return d;
}

function numeroFalso(numero) {
    const fim = numero.slice(-8);
    const passos = [...fim].slice(1).map((c, i) => (Number(c) - Number(fim[i]) + 10) % 10);
    if (passos.every(p => p === 1) || passos.every(p => p === 9)) return true;
    return /^(\d\d)\1{3}$/.test(fim);
}

export function erroTelefone(valor) {
    const d = digitosTelefone(valor);
    if (d.length !== 10 && d.length !== 11) return "Telefone inválido. Use DDD + número.";
    if (!DDDS.has(Number(d.slice(0, 2)))) return "DDD inválido.";

    const numero = d.slice(2);
    if (/^(\d)\1+$/.test(numero)) return "Telefone inválido.";
    if (numeroFalso(numero)) return "Telefone inválido. Digite seu número de verdade.";
    if (d.length === 11 && numero[0] !== "9") return "Celular deve começar com 9 depois do DDD.";
    if (d.length === 10 && !"2345".includes(numero[0])) return "Telefone fixo inválido.";
    return null;
}
