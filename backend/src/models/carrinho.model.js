import { conexao } from "../config/db.js";

export async function obterOuCriarCarrinho(id_usuario) {
    await conexao.query(
        "INSERT IGNORE INTO carrinho (id_usuario) VALUES (?)",
        [id_usuario]
    );
    const [resultado] = await conexao.query(
        "SELECT * FROM carrinho WHERE id_usuario = ?",
        [id_usuario]
    );
    return resultado[0];
}

export async function listarItens(id_carrinho) {
    const [resultado] = await conexao.query(
        `SELECT ic.id_produto, p.nome, p.imagem_url, p.ativo,
                ic.quantidade, ic.preco_unico
         FROM itens_carrinho ic
         JOIN produtos p ON p.id_produto = ic.id_produto
         WHERE ic.id_carrinho = ?`,
        [id_carrinho]
    );
    return resultado;
}

export async function buscarItem(id_carrinho, id_produto) {
    const [resultado] = await conexao.query(
        "SELECT * FROM itens_carrinho WHERE id_carrinho = ? AND id_produto = ?",
        [id_carrinho, id_produto]
    );
    return resultado[0];
}

export async function adicionarItem(id_carrinho, id_produto, quantidade, preco_unico) {
    await conexao.query(
        `INSERT INTO itens_carrinho (id_carrinho, id_produto, quantidade, preco_unico)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            quantidade = quantidade + VALUES(quantidade),
            preco_unico = VALUES(preco_unico)`,
        [id_carrinho, id_produto, quantidade, preco_unico]
    );
}

export async function atualizarQuantidade(id_carrinho, id_produto, quantidade) {
    const [resultado] = await conexao.query(
        "UPDATE itens_carrinho SET quantidade = ? WHERE id_carrinho = ? AND id_produto = ?",
        [quantidade, id_carrinho, id_produto]
    );
    return resultado.affectedRows > 0;
}

export async function removerItem(id_carrinho, id_produto) {
    const [resultado] = await conexao.query(
        "DELETE FROM itens_carrinho WHERE id_carrinho = ? AND id_produto = ?",
        [id_carrinho, id_produto]
    );
    return resultado.affectedRows > 0;
}

export async function buscarEnderecoDoUsuario(id_endereco, id_usuario) {
    const [resultado] = await conexao.query(
        "SELECT * FROM enderecos_usuario WHERE id_endereco = ? AND id_usuario = ?",
        [id_endereco, id_usuario]
    );
    return resultado[0];
}

export async function definirEntrega(id_carrinho, { id_endereco, cep_entrega, tipo_entrega, valor_frete }) {
    const [resultado] = await conexao.query(
        `UPDATE carrinho
         SET id_endereco = ?, cep_entrega = ?, tipo_entrega = ?, valor_frete = ?
         WHERE id_carrinho = ?`,
        [id_endereco, cep_entrega, tipo_entrega, valor_frete, id_carrinho]
    );
    return resultado.affectedRows > 0;
}

export async function limparCarrinho(id_carrinho) {
    const con = await conexao.getConnection();
    try {
        await con.beginTransaction();

        await con.query(
            "DELETE FROM itens_carrinho WHERE id_carrinho = ?",
            [id_carrinho]
        );
        await con.query(
            `UPDATE carrinho
             SET id_endereco = NULL, tipo_entrega = NULL, cep_entrega = NULL, valor_frete = NULL
             WHERE id_carrinho = ?`,
            [id_carrinho]
        );

        await con.commit();
    } catch (error) {
        await con.rollback();
        throw error;
    } finally {
        con.release();
    }
}