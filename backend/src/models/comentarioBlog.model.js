import { conexao } from "../config/db.js";

let tabelaPronta = null;
export function garantirTabela() {
    tabelaPronta ??= (async () => {
        await conexao.query(
            `CREATE TABLE IF NOT EXISTS comentarios_blog (
                id_comentario INT AUTO_INCREMENT PRIMARY KEY,
                id_post INT NOT NULL,
                id_autor INT NULL,
                autor_nome VARCHAR(120) NULL,
                texto VARCHAR(1000) NOT NULL,
                data_comentario DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ativo BOOLEAN NOT NULL DEFAULT TRUE,
                INDEX idx_comentarios_post (id_post)
            )`
        );
        await conexao.query(
            `CREATE TABLE IF NOT EXISTS curtidas_post_blog (
                id_post INT NOT NULL,
                id_cliente INT NOT NULL,
                data_curtida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_post, id_cliente)
            )`
        );
        await conexao.query(
            `CREATE TABLE IF NOT EXISTS curtidas_comentario_blog (
                id_comentario INT NOT NULL,
                id_cliente INT NOT NULL,
                data_curtida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_comentario, id_cliente)
            )`
        );
    })().catch((erro) => {
        tabelaPronta = null;
        throw erro;
    });
    return tabelaPronta;
}

export async function listarComentarios(id_post, id_leitor = null) {
    await garantirTabela();
    const [resultado] = await conexao.query(
        `SELECT
            c.id_comentario,
            c.id_post,
            c.id_autor,
            c.texto,
            c.data_comentario,
            COALESCE(u.nome_usuario, c.autor_nome, 'Equipe Happy Snouts') AS autor,
            u.foto_url AS autor_foto,
            (SELECT COUNT(*) FROM curtidas_comentario_blog cc WHERE cc.id_comentario = c.id_comentario) AS total_curtidas,
            EXISTS(SELECT 1 FROM curtidas_comentario_blog cc WHERE cc.id_comentario = c.id_comentario AND cc.id_cliente = ?) AS curtido
         FROM comentarios_blog c
         LEFT JOIN clientes u ON u.Id_usuario = c.id_autor
         WHERE c.id_post = ? AND c.ativo = TRUE
         ORDER BY c.data_comentario ASC, c.id_comentario ASC`,
        [id_leitor ?? 0, id_post]
    );
    return resultado;
}

export async function curtirComentario(id_comentario, id_cliente) {
    await garantirTabela();
    await conexao.query(
        "INSERT IGNORE INTO curtidas_comentario_blog (id_comentario, id_cliente) VALUES (?, ?)",
        [id_comentario, id_cliente]
    );
}

export async function descurtirComentario(id_comentario, id_cliente) {
    await garantirTabela();
    await conexao.query(
        "DELETE FROM curtidas_comentario_blog WHERE id_comentario = ? AND id_cliente = ?",
        [id_comentario, id_cliente]
    );
}

export async function totalCurtidasComentario(id_comentario) {
    const [[linha]] = await conexao.query(
        "SELECT COUNT(*) AS total FROM curtidas_comentario_blog WHERE id_comentario = ?",
        [id_comentario]
    );
    return Number(linha.total);
}

export async function curtirPost(id_post, id_cliente) {
    await garantirTabela();
    await conexao.query(
        "INSERT IGNORE INTO curtidas_post_blog (id_post, id_cliente) VALUES (?, ?)",
        [id_post, id_cliente]
    );
}

export async function descurtirPost(id_post, id_cliente) {
    await garantirTabela();
    await conexao.query(
        "DELETE FROM curtidas_post_blog WHERE id_post = ? AND id_cliente = ?",
        [id_post, id_cliente]
    );
}

export async function totalCurtidasPost(id_post) {
    const [[linha]] = await conexao.query(
        "SELECT COUNT(*) AS total FROM curtidas_post_blog WHERE id_post = ?",
        [id_post]
    );
    return Number(linha.total);
}

export async function buscarComentarioPorId(id_comentario) {
    await garantirTabela();
    const [resultado] = await conexao.query(
        "SELECT * FROM comentarios_blog WHERE id_comentario = ? AND ativo = TRUE",
        [id_comentario]
    );
    return resultado[0];
}

export async function criarComentario({ id_post, id_autor, autor_nome, texto }) {
    await garantirTabela();
    const [resultado] = await conexao.query(
        "INSERT INTO comentarios_blog (id_post, id_autor, autor_nome, texto) VALUES (?, ?, ?, ?)",
        [id_post, id_autor ?? null, autor_nome ?? null, texto]
    );
    return resultado.insertId;
}

export async function deletarComentario(id_comentario) {
    await garantirTabela();
    const [resultado] = await conexao.query(
        "UPDATE comentarios_blog SET ativo = FALSE WHERE id_comentario = ?",
        [id_comentario]
    );
    return resultado.affectedRows > 0;
}
