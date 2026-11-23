import * as produtosModel from "../models/produtos.model.js";
import { buscarCategoriaPorIdP } from "../models/categoriaProduto.model.js";

export async function listarTdProdutos(req, res) {
    const produtos = await produtosModel.listarTdProdutos();
    return res.status(200).json(produtos);
}

export async function listarProdutosAtivos(req, res) {
    const { id_categoria } = req.query;
    const produtos = await produtosModel.listarProdutosAtivos(id_categoria);
    return res.status(200).json(produtos);
}

export async function buscarProdutoPorId(req, res) {
    const { id_produto } = req.params;
    const produto = await produtosModel.buscarProdutoPorId(id_produto);

    if (!produto) {
        return res.status(404).json({ msg: "Produto não encontrado" });
    }

    return res.status(200).json(produto);
}

export async function criarProduto(req, res) {
    const { nome, descricao, preco, preco_promocional, id_categoria, imagem_url } = req.body;

    if (!nome || !descricao || !preco || !id_categoria || !imagem_url) {
        return res.status(400).json({ msg: "nome, descricao, preco, id_categoria e imagem são obrigatórios." });
    }

    const categoria = await buscarCategoriaPorIdP(id_categoria);

    if (!categoria || !categoria.ativo) {
        return res.status(400).json({ msg: "Categoria inválida ou inativa" });
    }

    const id = await produtosModel.criarProduto({ nome, descricao, preco, preco_promocional, id_categoria, imagem_url });
    return res.status(201).json({ msg: "Produto cadastrado com sucesso", id });
}

export async function atualizarProduto(req, res) {
    const { id_produto } = req.params;
    const { nome, descricao, preco, preco_promocional, id_categoria, imagem_url } = req.body;

    if (!nome || !descricao || !preco || !id_categoria || !imagem_url) {
        return res.status(400).json({ msg: "nome, descricao, preco, id_categoria e imagem são obrigatórios." });
    }

    const produto = await produtosModel.buscarProdutoPorId(id_produto);

    if (!produto) {
        return res.status(404).json({ msg: "Produto não encontrado" });
    }

    const categoria = await buscarCategoriaPorIdP(id_categoria);

    if (!categoria || !categoria.ativo) {
        return res.status(400).json({ msg: "Categoria inválida ou inativa" });
    }

    const atualizado = await produtosModel.atualizarProduto(id_produto, { nome, descricao, preco, preco_promocional, id_categoria, imagem_url });

    if (!atualizado) {
        return res.status(500).json({ msg: "Falha ao atualizar Produto" });
    }

    return res.status(200).json({ msg: "Produto atualizado" });
}

export async function deletarProduto(req, res) {
    try {
        if (req.usuario.tipo !== "funcionario") {
            return res.status(403).json({ msg: "Acesso restrito a funcionários" });
        }

        const { id_produto } = req.params;
        const produto = await produtosModel.buscarProdutoPorId(id_produto);

        if (!produto) {
            return res.status(404).json({ msg: "Produto não encontrado" });
        }

        const deletado = await produtosModel.deletarProduto(id_produto);

        if (!deletado) {
            return res.status(500).json({ msg: "Falha ao deletar Produto" });
        }

        return res.status(200).json({ msg: "Produto removido" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao deletar produto", erro: error.message });
    }
}