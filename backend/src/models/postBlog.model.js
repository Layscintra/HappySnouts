import { conexao } from "../config/db.js";
import { garantirTabela as garantirTabelaComentarios } from "./comentarioBlog.model.js";

export async function listarTdPosts() {
    const [resultado] = await conexao.query(
        `SELECT p.*, c.nome AS categoria_nome, COALESCE(u.nome_usuario, p.autor_nome, 'Equipe Happy Snouts') AS autor
         FROM posts_blog p
         LEFT JOIN categorias_blog c ON c.id_categoria = p.id_categoria
         LEFT JOIN clientes u ON u.Id_usuario = p.id_autor
         ORDER BY p.data_publicacao DESC`
    );
    return resultado;
}

export async function listarPosts({ categoria, limite = 10, pagina = 1, busca, id_autor, id_leitor = null, curtidos = false } = {}) {
    const valores = [id_leitor ?? 0];
    let where = "WHERE p.ativo = TRUE";

    if (curtidos) {
        where += " AND EXISTS(SELECT 1 FROM curtidas_post_blog cp WHERE cp.id_post = p.id_post AND cp.id_cliente = ?)";
        valores.push(id_leitor ?? 0);
    }

    if (busca) {
        where += " AND (p.titulo LIKE ? OR p.resumo LIKE ?)";
        valores.push(`%${busca}%`, `%${busca}%`);
    }

    if (id_autor) {
        where += " AND p.id_autor = ?";
        valores.push(Number(id_autor));
    }

    if (categoria) {
        where += " AND p.id_categoria = ?";
        valores.push(Number(categoria));
    }

    const limiteNum = Number(limite);
    const offset = (Number(pagina) - 1) * limiteNum;
    valores.push(limiteNum, offset);

    await garantirTabelaComentarios();
    const [resultado] = await conexao.query(
        `SELECT
            p.id_post,
            p.titulo,
            p.resumo,
            p.imagem_capa_url,
            p.tempo_leitura_min,
            p.visualizacoes,
            p.data_publicacao,
            p.id_categoria,
            c.nome AS categoria_nome,
            c.cor AS categoria_cor,
            c.icone AS categoria_icone,
            p.id_autor,
            COALESCE(u.nome_usuario, p.autor_nome, 'Equipe Happy Snouts') AS autor,
            (SELECT COUNT(*) FROM comentarios_blog cb WHERE cb.id_post = p.id_post AND cb.ativo = TRUE) AS total_comentarios,
            (SELECT COUNT(*) FROM curtidas_post_blog cp WHERE cp.id_post = p.id_post) AS total_curtidas,
            EXISTS(SELECT 1 FROM curtidas_post_blog cp WHERE cp.id_post = p.id_post AND cp.id_cliente = ?) AS curtido
         FROM posts_blog p
         INNER JOIN categorias_blog c ON c.id_categoria = p.id_categoria
         LEFT JOIN clientes u ON u.Id_usuario = p.id_autor
         ${where}
         ORDER BY p.data_publicacao DESC
         LIMIT ? OFFSET ?`,
        valores
    );
    return resultado;
}

export async function buscarPostsPorId(id_post, id_leitor = null) {
    await garantirTabelaComentarios();
    const [resultado] = await conexao.query(
        `SELECT
            p.id_post,
            p.id_categoria,
            p.id_autor,
            p.titulo,
            p.resumo,
            p.conteudo,
            p.imagem_capa_url,
            p.tempo_leitura_min,
            p.visualizacoes,
            p.data_publicacao,
            p.ativo,
            c.nome AS categoria_nome,
            c.cor AS categoria_cor,
            c.icone AS categoria_icone,
            COALESCE(u.nome_usuario, p.autor_nome, 'Equipe Happy Snouts') AS autor,
            (SELECT COUNT(*) FROM comentarios_blog cb WHERE cb.id_post = p.id_post AND cb.ativo = TRUE) AS total_comentarios,
            (SELECT COUNT(*) FROM curtidas_post_blog cp WHERE cp.id_post = p.id_post) AS total_curtidas,
            EXISTS(SELECT 1 FROM curtidas_post_blog cp WHERE cp.id_post = p.id_post AND cp.id_cliente = ?) AS curtido
         FROM posts_blog p
         INNER JOIN categorias_blog c ON c.id_categoria = p.id_categoria
         LEFT JOIN clientes u ON u.Id_usuario = p.id_autor
         WHERE p.id_post = ?`,
        [id_leitor ?? 0, id_post]
    );
    return resultado[0];
}

export async function criarPosts({ id_categoria, id_autor, autor_nome, titulo, resumo, conteudo, imagem_capa_url, tempo_leitura_min }) {
    const [resultado] = await conexao.query(
        `INSERT INTO posts_blog (id_categoria, id_autor, autor_nome, titulo, resumo, conteudo, imagem_capa_url, tempo_leitura_min)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id_categoria ?? null,
            id_autor ?? null,
            autor_nome ?? null,
            titulo,
            resumo ?? null,
            conteudo,
            imagem_capa_url ?? null,
            tempo_leitura_min ?? null
        ]
    );
    return resultado.insertId;
}

export async function atualizarPosts(id_post, dadosAtualizados) {
    const camposPermitidos = [
        "id_categoria",
        "titulo",
        "resumo",
        "conteudo",
        "imagem_capa_url",
        "tempo_leitura_min"
    ];

    const campos = [];
    const valores = [];

    for (const campo of camposPermitidos) {
        if (dadosAtualizados[campo] !== undefined) {
            campos.push(`${campo} = ?`);
            valores.push(dadosAtualizados[campo]);
        }
    }

    if (campos.length === 0) {
        return false;
    }

    valores.push(id_post);

    const [resultado] = await conexao.query(
        `UPDATE posts_blog SET ${campos.join(", ")} WHERE id_post = ?`,
        valores
    );

    return resultado.affectedRows > 0;
}

export async function incrementarVisualizacoes(id_post) {
    await conexao.query(
        "UPDATE posts_blog SET visualizacoes = visualizacoes + 1 WHERE id_post = ?",
        [id_post]
    );
}

export async function deletarPosts(id_post) {
    const [resultado] = await conexao.query(
        "UPDATE posts_blog SET ativo = FALSE WHERE id_post = ?",
        [id_post]
    );
    return resultado.affectedRows > 0;
}