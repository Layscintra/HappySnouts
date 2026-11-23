import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

const configurado = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = configurado
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
    : null;

const remetente = process.env.EMAIL_FROM || `Happy Snouts <${process.env.SMTP_USER || "nao-responda@happysnouts.com"}>`;

const NAVY = "#0B2B68";
const ORANGE = "#F7941C";

function escapar(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function layout({ titulo, paragrafos = [], destaque, rodape }) {
    const corpo = paragrafos
        .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#23262B">${escapar(p).replace(/\n/g, "<br>")}</p>`)
        .join("");
    const caixa = destaque
        ? `<div style="margin:22px 0;padding:18px;border-radius:14px;background:#FFF4E5;text-align:center;font-size:30px;font-weight:700;letter-spacing:8px;color:${NAVY}">${escapar(destaque)}</div>`
        : "";
    return `<!doctype html><html><body style="margin:0;background:#F4F6FB;font-family:Segoe UI,Roboto,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:18px;overflow:hidden">
<tr><td style="background:${NAVY};padding:22px 28px;color:#fff;font-size:20px;font-weight:700">Happy <span style="color:${ORANGE}">Snouts</span> 🐾</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px;color:${NAVY}">${escapar(titulo)}</h1>
${corpo}${caixa}
<p style="margin:24px 0 0;font-size:12px;color:#8A8F99">${escapar(rodape || "Você recebeu este e-mail porque tem uma conta no app Happy Snouts.")}</p>
</td></tr></table></td></tr></table></body></html>`;
}

export async function enviarEmail({ para, assunto, titulo, paragrafos, destaque, rodape }) {
    if (!para) return false;
    const html = layout({ titulo: titulo || assunto, paragrafos, destaque, rodape });
    const texto = [titulo || assunto, ...(paragrafos || []), destaque || ""].join("\n\n");

    if (!transporter) {
        console.log(`\n[e-mail simulado: configure SMTP no .env para enviar de verdade]\nPara: ${para}\nAssunto: ${assunto}\n${texto}\n`);
        return false;
    }
    try {
        await transporter.sendMail({ from: remetente, to: para, subject: assunto, html, text: texto });
        return true;
    } catch (error) {
        console.error(`Falha ao enviar e-mail para ${para}:`, error.message);
        return false;
    }
}

export const emailConfigurado = configurado;
