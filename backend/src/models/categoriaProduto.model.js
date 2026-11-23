import { conexao } from "../config/db.js";

export async function listarCategoriaP() {
    const [resultado] = await conexao.query(
        `SELECT * FROM categorias_produto`
    );
    return resultado;
}

export async function buscarCategoriaPorIdP(id_categoria) {
    const [resultado] = await conexao.query(
        `SELECT * FROM categorias_produto WHERE id_categoria = ?`,
        [id_categoria]
    );
    return resultado[0];
}

export async function buscarCategoriaPorNomeP(nome) {
    const [resultado] = await conexao.query(
        `SELECT * FROM categorias_produto WHERE nome = ?`,
        [nome]
    );
    return resultado[0];
}

export async function criarCategoriaP({ nome, icone }) {
    const [resultado] = await conexao.query(
        `INSERT INTO categorias_produto (nome, icone)
         VALUES (?, ?)`,
        [nome, icone]
    );
    return resultado.insertId;
}

export async function atualizarCategoriaP(id_categoria, { nome, icone }) {
    const [resultado] = await conexao.query(
        `UPDATE categorias_produto
         SET nome = ?, icone = ?
         WHERE id_categoria = ?`,
        [nome, icone, id_categoria]
    );
    return resultado.affectedRows > 0;
}

export async function deletarCategoriaP(id_categoria) {
    const [resultado] = await conexao.query(
        `DELETE FROM categorias_produto WHERE id_categoria = ?`,
        [id_categoria]
    );
    return resultado.affectedRows > 0;
}