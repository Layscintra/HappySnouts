import { conexao } from "../config/db.js";

export async function criarNotificacao({ id_usuario, titulo, mensagem, tipo = "geral", referencia_id = null }) {
    const [resultado] = await conexao.query(
        `INSERT INTO notificacoes (id_usuario, titulo, mensagem, tipo, referencia_id)
         VALUES (?, ?, ?, ?, ?)`,
        [id_usuario, titulo, mensagem, tipo, referencia_id]
    );
    return resultado.insertId;
}

export async function listarPorUsuario(id_usuario, limite = 50) {
    const [resultado] = await conexao.query(
        `SELECT id_notificacao, titulo, mensagem, tipo, referencia_id, lida, data_criacao
         FROM notificacoes
         WHERE id_usuario = ?
         ORDER BY data_criacao DESC, id_notificacao DESC
         LIMIT ?`,
        [id_usuario, limite]
    );
    return resultado;
}

export async function contarNaoLidas(id_usuario) {
    const [resultado] = await conexao.query(
        "SELECT COUNT(*) AS total FROM notificacoes WHERE id_usuario = ? AND lida = 0",
        [id_usuario]
    );
    return Number(resultado[0].total);
}

export async function marcarLida(id_notificacao, id_usuario) {
    const [resultado] = await conexao.query(
        "UPDATE notificacoes SET lida = 1 WHERE id_notificacao = ? AND id_usuario = ?",
        [id_notificacao, id_usuario]
    );
    return resultado.affectedRows > 0;
}

export async function marcarTodasLidas(id_usuario) {
    await conexao.query("UPDATE notificacoes SET lida = 1 WHERE id_usuario = ? AND lida = 0", [id_usuario]);
}

export async function deletarNotificacao(id_notificacao, id_usuario) {
    const [resultado] = await conexao.query(
        "DELETE FROM notificacoes WHERE id_notificacao = ? AND id_usuario = ?",
        [id_notificacao, id_usuario]
    );
    return resultado.affectedRows > 0;
}
