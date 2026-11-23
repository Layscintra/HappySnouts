import { conexao } from "../config/db.js";

export async function listarFavoritosPorUsuario(id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT f.id_favorito,
                p.id_produto,
                p.nome,
                p.preco,
                p.preco_promocional,
                p.imagem_url,
                p.id_categoria,
                c.nome AS categoria
         FROM favoritos f
         JOIN produtos p ON p.id_produto = f.id_produto
         LEFT JOIN categorias_produto c ON c.id_categoria = p.id_categoria
         WHERE f.id_usuario = ?`,
        [id_usuario]
    );
    return resultado;
}

export async function verificarFavorito(id_usuario, id_produto) {
    const [resultado] = await conexao.query(
        `SELECT id_favorito FROM favoritos WHERE id_usuario = ? AND id_produto = ?`,
        [id_usuario, id_produto]
    );
    return resultado.length > 0;
}


export async function adicionarFavorito(id_usuario, id_produto) {
    const [resultado] = await conexao.query(
        `INSERT INTO favoritos (id_usuario, id_produto) VALUES (?, ?)`,
        [id_usuario, id_produto]
    );
    return resultado.insertId;
}

export async function removerFavorito(id_usuario, id_produto) {
    const [resultado] = await conexao.query(
        `DELETE FROM favoritos WHERE id_usuario = ? AND id_produto = ?`,
        [id_usuario, id_produto]
    );
    return resultado.affectedRows > 0;
}

