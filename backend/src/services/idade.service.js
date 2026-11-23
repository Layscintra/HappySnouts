export const IDADE_MINIMA = 16;

export function erroDataNascimento(data) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(data || ""));
    if (!m) return "Data de nascimento inválida. Use o formato AAAA-MM-DD.";

    const [ano, mes, dia] = m.slice(1).map(Number);
    const d = new Date(ano, mes - 1, dia);
    if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia || ano < 1900) {
        return "Data de nascimento inválida.";
    }

    const hoje = new Date();
    if (d > hoje) return "A data de nascimento não pode ser no futuro.";

    let idade = hoje.getFullYear() - ano;
    if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) idade--;
    if (idade < IDADE_MINIMA) return `É preciso ter pelo menos ${IDADE_MINIMA} anos para ter uma conta.`;

    return null;
}
