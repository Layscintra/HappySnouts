import { conexao } from "../config/db.js";

const CAMPOS = `
    m.id_mensagem, m.id_usuario, m.nome, m.email, m.assunto, m.mensagem, m.status,
    m.resposta, m.data_envio, m.data_resposta, f.nome AS funcionario
`;

export async function criarMensagem({ id_usuario, nome, email, assunto, mensagem }) {
    const [resultado] = await conexao.query(
        `INSERT INTO mensagens_contato (id_usuario, nome, email, assunto, mensagem)
         VALUES (?, ?, ?, ?, ?)`,
        [id_usuario ?? null, nome, email, assunto, mensagem]
    );
    return resultado.insertId;
}

export async function listarPorUsuario(id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT ${CAMPOS} FROM mensagens_contato m
         LEFT JOIN funcionarios f ON f.id_funcionario = m.id_funcionario
         WHERE m.id_usuario = ? ORDER BY m.data_envio DESC`,
        [id_usuario]
    );
    return resultado;
}

export async function listarTodas({ status } = {}) {
    const valores = [];
    let where = "";
    if (status) {
        where = "WHERE m.status = ?";
        valores.push(status);
    }
    const [resultado] = await conexao.query(
        `SELECT ${CAMPOS} FROM mensagens_contato m
         LEFT JOIN funcionarios f ON f.id_funcionario = m.id_funcionario
         ${where}
         ORDER BY FIELD(m.status, 'aberta', 'respondida', 'fechada'), m.data_envio DESC`,
        valores
    );
    return resultado;
}

export async function buscarPorId(id_mensagem) {
    const [resultado] = await conexao.query(
        `SELECT ${CAMPOS} FROM mensagens_contato m
         LEFT JOIN funcionarios f ON f.id_funcionario = m.id_funcionario
         WHERE m.id_mensagem = ?`,
        [id_mensagem]
    );
    return resultado[0];
}

export async function responder(id_mensagem, { resposta, id_funcionario }) {
    const [resultado] = await conexao.query(
        `UPDATE mensagens_contato
         SET resposta = ?, id_funcionario = ?, status = 'respondida', data_resposta = NOW()
         WHERE id_mensagem = ?`,
        [resposta, id_funcionario, id_mensagem]
    );
    return resultado.affectedRows > 0;
}

export async function mudarStatus(id_mensagem, status) {
    const [resultado] = await conexao.query(
        "UPDATE mensagens_contato SET status = ? WHERE id_mensagem = ?",
        [status, id_mensagem]
    );
    return resultado.affectedRows > 0;
}
