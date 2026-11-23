import { conexao } from "../config/db.js";

export async function listarCategorias() {
    const [resultado] = await conexao.query(
        `SELECT * FROM categorias_blog`
    );
    return resultado;
}

export async function buscarCategoriaPorId(id_categoria) {
    const [resultado] = await conexao.query(
        `SELECT * FROM categorias_blog WHERE id_categoria = ?`, 
        [id_categoria]
    );
    return resultado[0];
}

export async function buscarCategoriaPorNome(nome) {
    const [resultado] = await conexao.query(
        `SELECT * FROM categorias_blog WHERE nome = ?`, 
        [nome]
    );
    return resultado[0];
}

export async function criarCategoria({ nome, cor, icone }) {
    const [resultado] = await conexao.query(
        `INSERT INTO categorias_blog (nome, cor, icone)
         VALUES (?, ?, ?)`,
        [nome ?? null, cor, icone]
    );
    return resultado.insertId;
}

export async function atualizarCategoria(id_categoria, { nome, cor, icone }) {
    const [resultado] = await conexao.query(
        `UPDATE categorias_blog 
         SET nome = ?, cor = ?, icone = ?
         WHERE id_categoria = ?`,
        [nome ?? null, cor, icone, id_categoria ]
    );
    return resultado.affectedRows > 0;
}

export async function deletarCategoria(id_categoria) {
    const [resultado] = await conexao.query(
        "DELETE FROM categorias_blog WHERE id_categoria = ?",
        [id_categoria]
    );
    return resultado.affectedRows > 0;
}