
const CHAVE_EXEMPLO = "00000000-0000-0000-0000-000000000000";

export const PIX_VALIDADE_MIN = 30;

function campo(id, valor) {
    return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

function limpar(texto, max) {
    return String(texto)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9 .,-]/g, "")
        .trim()
        .toUpperCase()
        .slice(0, max);
}

function crc16(texto) {
    let crc = 0xffff;
    for (const byte of Buffer.from(texto, "utf8")) {
        crc ^= byte << 8;
        for (let i = 0; i < 8; i++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
            crc &= 0xffff;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function gerarPixCopiaECola({ valor, id_pedido }) {
    const chave = process.env.PIX_CHAVE?.trim() || CHAVE_EXEMPLO;
    const nome = limpar(process.env.PIX_NOME || "Happy Snouts", 25) || "HAPPY SNOUTS";
    const cidade = limpar(process.env.PIX_CIDADE || "Sao Paulo", 15) || "SAO PAULO";
    const txid = `PEDIDO${String(id_pedido).padStart(5, "0")}`;

    const semCrc =
        campo("00", "01") +
        campo("26", campo("00", "br.gov.bcb.pix") + campo("01", chave)) +
        campo("52", "0000") +
        campo("53", "986") +
        campo("54", Number(valor).toFixed(2)) +
        campo("58", "BR") +
        campo("59", nome) +
        campo("60", cidade) +
        campo("62", campo("05", txid)) +
        "6304";

    return semCrc + crc16(semCrc);
}
