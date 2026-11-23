import { conexao } from "../config/db.js";

const SELECT_PRODUTOS = `
    SELECT p.*, c.nome AS categoria
    FROM produtos p
    LEFT JOIN categorias_produto c ON c.id_categoria = p.id_categoria
`;

export async function listarTdProdutos() {
    const [resultado] = await conexao.query(SELECT_PRODUTOS);
    return resultado;
}

export async function listarProdutosAtivos(id_categoria) {
    let sql = `${SELECT_PRODUTOS} WHERE p.ativo = TRUE`;
    const valores = [];

    if (id_categoria) {
        sql += " AND p.id_categoria = ?";
        valores.push(id_categoria);
    }

    const [resultado] = await conexao.query(sql, valores);
    return resultado;
}

export async function buscarProdutoPorId(id_produto) {
    const [resultado] = await conexao.query(
        `${SELECT_PRODUTOS} WHERE p.id_produto = ?`,
        [id_produto]
    );
    return resultado[0];
}

export async function criarProduto({ nome, descricao, preco, preco_promocional, id_categoria, imagem_url }) {
    const [resultado] = await conexao.query(
        `INSERT INTO produtos (nome, descricao, preco, preco_promocional, id_categoria, imagem_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nome, descricao ?? null, preco, preco_promocional ?? null, id_categoria ?? null, imagem_url ?? null]
    );
    return resultado.insertId;
}

export async function atualizarProduto(id_produto, { nome, descricao, preco, preco_promocional, id_categoria, imagem_url }) {
    const [resultado] = await conexao.query(
        `UPDATE produtos 
         SET nome = ?, descricao = ?, preco = ?, preco_promocional = ?, id_categoria = ?, imagem_url = ? 
         WHERE id_produto = ?`,
        [nome, descricao ?? null, preco, preco_promocional ?? null, id_categoria ?? null, imagem_url ?? null, id_produto]
    );
    return resultado.affectedRows > 0;
}

export async function deletarProduto(id_produto) {
    const [resultado] = await conexao.query(
        "UPDATE produtos SET ativo = FALSE WHERE id_produto = ?",
        [id_produto]
    );
    return resultado.affectedRows > 0;
}