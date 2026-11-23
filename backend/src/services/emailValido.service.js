import { promises as dns } from "dns";

const ERROS_DIGITACAO = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gamil.com": "gmail.com",
    "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmail.cm": "gmail.com", "gmail.om": "gmail.com",
    "gmail.com.br": "gmail.com", "gnail.com": "gmail.com", "gmaill.com": "gmail.com", "gmail.comm": "gmail.com",
    "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmail.co": "hotmail.com",
    "hotmail.con": "hotmail.com", "hotmil.com": "hotmail.com", "hotamil.com": "hotmail.com", "homail.com": "hotmail.com",
    "outlok.com": "outlook.com", "outloo.com": "outlook.com", "outlook.co": "outlook.com", "outlook.con": "outlook.com",
    "yaho.com": "yahoo.com", "yahoo.co": "yahoo.com", "yahoo.con": "yahoo.com", "yahoo.com.b": "yahoo.com.br",
    "icloud.co": "icloud.com", "iclod.com": "icloud.com", "uol.com": "uol.com.br", "bol.com": "bol.com.br"
};

const BLOQUEADOS = new Set([
    "mailinator.com", "yopmail.com", "10minutemail.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com",
    "temp-mail.org", "tempmail.com", "tempmail.net", "tempail.com", "tmpmail.org", "trashmail.com", "getnada.com",
    "dispostable.com", "maildrop.cc", "throwawaymail.com", "emailondeck.com", "mohmal.com", "fakeinbox.com",
    "mailnesia.com", "1secmail.com", "minuteinbox.com", "mintemail.com", "spamgourmet.com", "burnermail.io",
    "example.com", "example.org", "example.net", "test.com", "teste.com", "teste.com.br", "email.com.br"
]);

const FORMATO = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9_%+-])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export function erroFormatoEmail(valor) {
    const email = String(valor ?? "").trim().toLowerCase();
    if (!email) return "Digite o e-mail.";
    if (!FORMATO.test(email) || email.includes("..")) return "E-mail inválido. Confira se digitou certo.";
    const dominio = email.split("@")[1];
    if (ERROS_DIGITACAO[dominio]) return `Confira o e-mail. Você quis dizer @${ERROS_DIGITACAO[dominio]}?`;
    if (BLOQUEADOS.has(dominio)) return "Use um e-mail pessoal de verdade (e-mails temporários não são aceitos).";
    return null;
}

const cacheDominios = new Map();

function comTempo(promessa, ms) {
    return Promise.race([promessa, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), ms))]);
}

export async function erroEmail(valor) {
    const erro = erroFormatoEmail(valor);
    if (erro) return erro;

    const dominio = String(valor).trim().toLowerCase().split("@")[1];
    if (!cacheDominios.has(dominio)) {
        try {
            const mx = await comTempo(dns.resolveMx(dominio), 5000);
            cacheDominios.set(dominio, mx.some(r => r.exchange && r.exchange !== "."));
        } catch (e) {
            if (["ENOTFOUND", "ENODATA", "NXDOMAIN"].includes(e.code)) cacheDominios.set(dominio, false);
            else return null;
        }
    }
    return cacheDominios.get(dominio) ? null : `O domínio @${dominio} não recebe e-mails. Confira se digitou certo.`;
}
