import * as categoriaModel from "../models/categoriaProduto.model.js";

export async function listarCategoriaP(req, res) {
    try {
        const categorias = await categoriaModel.listarCategoriaP();
        return res.status(200).json(categorias);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar categorias", erro: error.message });
    }
}

export async function buscarCategoriaPorIdP(req, res) {
    try {
        const { id_categoria } = req.params;
        const categoria = await categoriaModel.buscarCategoriaPorIdP(id_categoria);

        if (!categoria) {
            return res.status(404).json({ msg: "Categoria não encontrada" });
        }

        return res.status(200).json(categoria);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao buscar categoria", erro: error.message });
    }
}

export async function criarCategoriaP(req, res) {
    try {
        const { nome, icone } = req.body;

        if (!nome || !icone) {
            return res.status(400).json({ msg: "nome e icone são obrigatórios" });
        }

        const existente = await categoriaModel.buscarCategoriaPorNomeP(nome);
        if (existente) {
            return res.status(409).json({ msg: "Já existe uma categoria com esse nome" });
        }

        const id = await categoriaModel.criarCategoriaP({ nome, icone });
        return res.status(201).json({ msg: "Categoria cadastrada com sucesso", id });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao criar categoria", erro: error.message });
    }
}

export async function atualizarCategoriaP(req, res) {
    try {
        const { id_categoria } = req.params;
        const { nome, icone } = req.body;

        if (!nome || !icone) {
            return res.status(400).json({ msg: "nome e icone são obrigatórios" });
        }

        const categoria = await categoriaModel.buscarCategoriaPorIdP(id_categoria);
        if (!categoria) {
            return res.status(404).json({ msg: "Categoria não encontrada" });
        }

        const atualizado = await categoriaModel.atualizarCategoriaP(id_categoria, { nome, icone });
        if (!atualizado) {
            return res.status(500).json({ msg: "Falha ao atualizar categoria" });
        }

        return res.status(200).json({ msg: "Categoria atualizada" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar categoria", erro: error.message });
    }
}

export async function deletarCategoriaP(req, res) {
    try {
        const { id_categoria } = req.params;

        const categoria = await categoriaModel.buscarCategoriaPorIdP(id_categoria);
        if (!categoria) {
            return res.status(404).json({ msg: "Categoria não encontrada" });
        }

        const deletado = await categoriaModel.deletarCategoriaP(id_categoria);
        if (!deletado) {
            return res.status(500).json({ msg: "Falha ao deletar categoria" });
        }

        return res.status(200).json({ msg: "Categoria removida" });
    } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                msg: "Não dá pra excluir: existem produtos nessa categoria. Mova ou remova os produtos antes."
            });
        }
        return res.status(500).json({ msg: "Erro ao deletar categoria", erro: error.message });
    }
}