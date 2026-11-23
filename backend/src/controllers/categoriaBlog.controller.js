import * as categoriaBlog from "../models/categoriaBlog.model.js";

const COR_VALIDA = /^#[0-9a-fA-F]{6}$/;

function validar({ nome, cor, icone }) {
    if (!nome?.trim() || !cor || !icone) return "nome, cor e icone são obrigatórios.";
    if (!COR_VALIDA.test(cor)) return "cor precisa estar no formato #RRGGBB.";
    return null;
}

export async function listarCategorias(req, res) {
    try {
        const categorias = await categoriaBlog.listarCategorias();
        return res.status(200).json(categorias);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar categorias", erro: error.message });
    }
}

export async function buscarCategoriaPorId(req, res) {
    try {
        const { id_categoria } = req.params;
        const categoria = await categoriaBlog.buscarCategoriaPorId(id_categoria);

        if (!categoria) {
            return res.status(404).json({ msg: "Categoria não encontrada" });
        }

        return res.status(200).json(categoria);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao buscar categoria", erro: error.message });
    }
}

export async function criarCategoria(req, res) {
    try {
        const { nome, cor, icone } = req.body;
        const invalido = validar({ nome, cor, icone });
        if (invalido) return res.status(400).json({ msg: invalido });

        const existente = await categoriaBlog.buscarCategoriaPorNome(nome.trim());
        if (existente) {
            return res.status(409).json({ msg: "Já existe uma categoria com esse nome" });
        }

        const id = await categoriaBlog.criarCategoria({ nome: nome.trim(), cor, icone });
        return res.status(201).json({ msg: "Categoria cadastrada com sucesso", id });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ msg: "Já existe uma categoria com esse nome" });
        }
        return res.status(500).json({ msg: "Erro ao criar categoria", erro: error.message });
    }
}

export async function atualizarCategoria(req, res) {
    try {
        const { id_categoria } = req.params;
        const { nome, cor, icone } = req.body;
        const invalido = validar({ nome, cor, icone });
        if (invalido) return res.status(400).json({ msg: invalido });

        const categoria = await categoriaBlog.buscarCategoriaPorId(id_categoria);
        if (!categoria) {
            return res.status(404).json({ msg: "Categoria não encontrada" });
        }

        const mesmoNome = await categoriaBlog.buscarCategoriaPorNome(nome.trim());
        if (mesmoNome && mesmoNome.id_categoria !== Number(id_categoria)) {
            return res.status(409).json({ msg: "Já existe uma categoria com esse nome" });
        }

        await categoriaBlog.atualizarCategoria(id_categoria, { nome: nome.trim(), cor, icone });
        return res.status(200).json({ msg: "Categoria atualizada" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ msg: "Já existe uma categoria com esse nome" });
        }
        return res.status(500).json({ msg: "Erro ao atualizar categoria", erro: error.message });
    }
}

export async function deletarCategoria(req, res) {
    try {
        const { id_categoria } = req.params;

        const categoria = await categoriaBlog.buscarCategoriaPorId(id_categoria);
        if (!categoria) {
            return res.status(404).json({ msg: "Categoria não encontrada" });
        }

        const deletado = await categoriaBlog.deletarCategoria(id_categoria);
        if (!deletado) {
            return res.status(500).json({ msg: "Falha ao deletar categoria" });
        }

        return res.status(200).json({ msg: "Categoria removida" });
    } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                msg: "Não dá pra excluir: existem posts nessa categoria. Mude a categoria deles antes."
            });
        }
        return res.status(500).json({ msg: "Erro ao deletar categoria", erro: error.message });
    }
}
