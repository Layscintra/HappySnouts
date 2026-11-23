import * as favoritoModel from "../models/favoritos.model.js";

export async function listarFavoritosPorUsuario(req, res) {
    const id_usuario = req.usuario.id;
    const favoritos = await favoritoModel.listarFavoritosPorUsuario(id_usuario);
    return res.status(200).json(favoritos);
}

export async function adicionarFavorito(req, res) {
    try {
        const id_usuario = req.usuario.id;
        const { id_produto } = req.body;

        if (!id_produto) {
            return res.status(400).json({ msg: "id_produto é obrigatório" });
        }

        const jaExiste = await favoritoModel.verificarFavorito(id_usuario, id_produto);

        if (jaExiste) {
            return res.status(400).json({ msg: "Produto já está nos favoritos" });
        }

        const id = await favoritoModel.adicionarFavorito(id_usuario, id_produto);

        return res.status(201).json({ msg: "Produto adicionado aos favoritos", id });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao adicionar favorito", erro: error.message });
    }
}

export async function removerFavorito(req, res) {
    try {
        const id_usuario = req.usuario.id;
        const { id_produto } = req.params;

        const removido = await favoritoModel.removerFavorito(id_usuario, id_produto);

        if (!removido) {
            return res.status(404).json({ msg: "Favorito não encontrado" });
        }

        return res.status(200).json({ msg: "Produto removido dos favoritos" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao remover favorito", erro: error.message });
    }
}