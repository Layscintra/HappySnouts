import { conexao } from "../config/db.js";

export async function listarCartoesPorUsuario(id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT id_cartao, icone, destinatario, ultimos_digitos, nome_titular, padrao, data_criacao
         FROM cartoes
         WHERE id_usuario = ?
         ORDER BY padrao DESC, data_criacao DESC`,
        [id_usuario]
    );
    return resultado;
}

export async function buscarCartaoPorId(id_cartao, id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT id_cartao, icone, destinatario, ultimos_digitos, nome_titular, padrao, data_criacao
         FROM cartoes
         WHERE id_cartao = ? AND id_usuario = ?`,
        [id_cartao, id_usuario]
    );
    return resultado[0];
}

export async function contarCartoes(id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT COUNT(*) AS total FROM cartoes WHERE id_usuario = ?`,
        [id_usuario]
    );
    return resultado[0].total;
}

export async function criarCartao({ id_usuario, icone, destinatario, ultimos_digitos, nome_titular, padrao }) {
    const [resultado] = await conexao.query(
        `INSERT INTO cartoes
         (id_usuario, icone, destinatario, ultimos_digitos, nome_titular, padrao)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_usuario, icone ?? null, destinatario, ultimos_digitos, nome_titular ?? null, padrao ?? false]
    );
    return resultado.insertId;
}

export async function atualizarCartao(id_cartao, id_usuario, dados) {
    const camposPermitidos = ["icone", "destinatario", "nome_titular"];
    const campos = [];
    const valores = [];

    for (const campo of camposPermitidos) {
        if (dados[campo] !== undefined) {
            campos.push(`${campo} = ?`);
            valores.push(dados[campo]);
        }
    }

    if (campos.length === 0) return false;

    valores.push(id_cartao, id_usuario);

    const [resultado] = await conexao.query(
        `UPDATE cartoes SET ${campos.join(", ")} WHERE id_cartao = ? AND id_usuario = ?`,
        valores
    );
    return resultado.affectedRows > 0;
}

export async function removerPadraoDoUsuario(id_usuario) {
    await conexao.query(
        `UPDATE cartoes SET padrao = FALSE WHERE id_usuario = ?`,
        [id_usuario]
    );
}

export async function definirPadrao(id_cartao, id_usuario) {
    const [resultado] = await conexao.query(
        `UPDATE cartoes SET padrao = TRUE WHERE id_cartao = ? AND id_usuario = ?`,
        [id_cartao, id_usuario]
    );
    return resultado.affectedRows > 0;
}

export async function deletarCartao(id_cartao, id_usuario) {
    const [resultado] = await conexao.query(
        `DELETE FROM cartoes WHERE id_cartao = ? AND id_usuario = ?`,
        [id_cartao, id_usuario]
    );
    return resultado.affectedRows > 0;
}