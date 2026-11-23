process.env.SMTP_HOST = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";
process.env.EMAIL_LOJA = "";

const logOriginal = console.log;
console.log = (...args) => {
    if (String(args[0] ?? "").includes("[e-mail simulado")) return;
    logOriginal(...args);
};
