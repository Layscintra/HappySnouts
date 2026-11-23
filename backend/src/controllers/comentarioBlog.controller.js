import * as comentarioModel from "../models/comentarioBlog.model.js";
import * as postBlogModel from "../models/postBlog.model.js";

const TEXTO_MIN = 1, TEXTO_MAX = 1000;

async function postAtivo(id_post) {
    const post = await postBlogModel.buscarPostsPorId(id_post);
    return post && post.ativo ? post : null;
}

export async function listarComentarios(req, res) {
    try {
        const { id_post } = req.params;
        if (!(await postAtivo(id_post))) {
            return res.status(404).json({ msg: "Post não encontrado" });
        }
        const id_leitor = req.usuario?.tipo === "cliente" ? req.usuario.id : null;
        const comentarios = await comentarioModel.listarComentarios(id_post, id_leitor);
        return res.status(200).json(comentarios);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar comentários", erro: error.message });
    }
}

export async function criarComentario(req, res) {
    try {
        const { id_post } = req.params;
        const texto = String(req.body.texto ?? "").trim();

        if (texto.length < TEXTO_MIN || texto.length > TEXTO_MAX) {
            return res.status(400).json({ msg: `O comentário deve ter de ${TEXTO_MIN} a ${TEXTO_MAX} caracteres` });
        }

        if (!(await postAtivo(id_post))) {
            return res.status(404).json({ msg: "Post não encontrado" });
        }

        const ehFuncionario = req.usuario.tipo === "funcionario";
        const id_autor = ehFuncionario ? null : req.usuario.id;
        const autor_nome = ehFuncionario ? `${String(req.usuario.nome || "Equipe").split(" ")[0]} · Equipe Happy Snouts` : null;

        const id = await comentarioModel.criarComentario({ id_post, id_autor, autor_nome, texto });
        return res.status(201).json({ msg: "Comentário publicado", id_comentario: id });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao comentar", erro: error.message });
    }
}

export async function deletarComentario(req, res) {
    try {
        const { id_post, id_comentario } = req.params;
        const comentario = await comentarioModel.buscarComentarioPorId(id_comentario);

        if (!comentario || Number(comentario.id_post) !== Number(id_post)) {
            return res.status(404).json({ msg: "Comentário não encontrado" });
        }

        const ehFuncionario = req.usuario.tipo === "funcionario";
        const meuId = Number(req.usuario.id);
        let pode = ehFuncionario || Number(comentario.id_autor) === meuId;
        if (!pode) {
            const post = await postBlogModel.buscarPostsPorId(id_post);
            pode = post && Number(post.id_autor) === meuId;
        }
        if (!pode) {
            return res.status(403).json({ msg: "Você não pode excluir este comentário" });
        }

        await comentarioModel.deletarComentario(id_comentario);
        return res.status(200).json({ msg: "Comentário removido" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao remover comentário", erro: error.message });
    }
}

export async function curtirPost(req, res) {
    return alternarCurtidaPost(req, res, true);
}
export async function descurtirPost(req, res) {
    return alternarCurtidaPost(req, res, false);
}

async function alternarCurtidaPost(req, res, curtir) {
    try {
        const { id_post } = req.params;
        if (!(await postAtivo(id_post))) {
            return res.status(404).json({ msg: "Post não encontrado" });
        }
        if (curtir) await comentarioModel.curtirPost(id_post, req.usuario.id);
        else await comentarioModel.descurtirPost(id_post, req.usuario.id);
        const total_curtidas = await comentarioModel.totalCurtidasPost(id_post);
        return res.status(200).json({ curtido: curtir, total_curtidas });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao curtir post", erro: error.message });
    }
}

export async function curtirComentario(req, res) {
    return alternarCurtidaComentario(req, res, true);
}
export async function descurtirComentario(req, res) {
    return alternarCurtidaComentario(req, res, false);
}

async function alternarCurtidaComentario(req, res, curtir) {
    try {
        const { id_post, id_comentario } = req.params;
        const comentario = await comentarioModel.buscarComentarioPorId(id_comentario);
        if (!comentario || Number(comentario.id_post) !== Number(id_post)) {
            return res.status(404).json({ msg: "Comentário não encontrado" });
        }
        if (curtir) await comentarioModel.curtirComentario(id_comentario, req.usuario.id);
        else await comentarioModel.descurtirComentario(id_comentario, req.usuario.id);
        const total_curtidas = await comentarioModel.totalCurtidasComentario(id_comentario);
        return res.status(200).json({ curtido: curtir, total_curtidas });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao curtir comentário", erro: error.message });
    }
}
