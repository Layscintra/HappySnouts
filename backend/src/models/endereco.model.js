import { conexao } from "../config/db.js";

export async function listarEnderecosPorUsuario(id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT * FROM enderecos_usuario WHERE id_usuario = ?`,
        [id_usuario]
    );
    return resultado;
}

export async function buscarEnderecoPorId(id_endereco) {
    const [resultado] = await conexao.query(
        `SELECT * FROM enderecos_usuario WHERE id_endereco = ?`,
        [id_endereco]
    );
    return resultado[0];
}

export async function contarEnderecosPorUsuario(id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT COUNT(*) AS total FROM enderecos_usuario WHERE id_usuario = ?`,
        [id_usuario]
    );
    return resultado[0].total;
}

export async function criarEndereco({ id_usuario, cep, estado, cidade, bairro, endereco, numero, apelido, padrao }) {
    const [resultado] = await conexao.query(
        `INSERT INTO enderecos_usuario (id_usuario, cep, estado, cidade, bairro, endereco, numero, apelido, padrao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_usuario, cep, estado, cidade, bairro, endereco, numero, apelido ?? null, padrao]
    );
    return resultado.insertId;
}

export async function definirEnderecoPadrao(id_usuario, id_endereco) {
    const [dono] = await conexao.query(
        `SELECT 1 FROM enderecos_usuario WHERE id_endereco = ? AND id_usuario = ?`,
        [id_endereco, id_usuario]
    );
    if (dono.length === 0) return false;

    await conexao.query(
        `UPDATE enderecos_usuario SET padrao = FALSE WHERE id_usuario = ?`,
        [id_usuario]
    );

    await conexao.query(
        `UPDATE enderecos_usuario SET padrao = TRUE WHERE id_endereco = ? AND id_usuario = ?`,
        [id_endereco, id_usuario]
    );

    return true;
}

export async function atualizarEndereco(id_endereco, { cep, estado, cidade, bairro, endereco, numero, apelido }) {
    const [resultado] = await conexao.query(
        `UPDATE enderecos_usuario 
         SET cep = ?, estado = ?, cidade = ?, bairro = ?, endereco = ?, numero = ?, apelido = ?
         WHERE id_endereco = ?`,
        [cep, estado, cidade, bairro, endereco, numero, apelido ?? null, id_endereco]
    );
    return resultado.affectedRows > 0;
}

export async function deletarEndereco(id_endereco) {
    const [resultado] = await conexao.query(
        `DELETE FROM enderecos_usuario WHERE id_endereco = ?`,
        [id_endereco]
    );
    return resultado.affectedRows > 0;
}