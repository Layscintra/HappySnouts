import * as cartoesModel from "../models/cartoes.model.js";

export async function listarCartoes(req, res) {
    try {
        const cartoes = await cartoesModel.listarCartoesPorUsuario(req.usuario.id);
        return res.status(200).json(cartoes);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar cartões", erro: error.message });
    }
}

export async function buscarCartaoPorId(req, res) {
    try {
        const { id_cartao } = req.params;
        const cartao = await cartoesModel.buscarCartaoPorId(id_cartao, req.usuario.id);

        if (!cartao) {
            return res.status(404).json({ msg: "Cartão não encontrado" });
        }

        return res.status(200).json(cartao);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao buscar cartão", erro: error.message });
    }
}

export async function criarCartao(req, res) {
    try {
        const id_usuario = req.usuario.id;
        const { icone, destinatario, ultimos_digitos, nome_titular, padrao } = req.body;

        if (req.body.numero || req.body.numero_cartao || req.body.cvv) {
            return res.status(400).json({
                msg: "Não envie número completo nem CVV. Use apenas os últimos 4 dígitos."
            });
        }

        if (!destinatario || !ultimos_digitos) {
            return res.status(400).json({ msg: "destinatario e ultimos_digitos são obrigatórios" });
        }

        if (!/^\d{4}$/.test(String(ultimos_digitos))) {
            return res.status(400).json({ msg: "ultimos_digitos deve ter exatamente 4 números" });
        }

        const total = await cartoesModel.contarCartoes(id_usuario);
        const ehPadrao = total === 0 ? true : Boolean(padrao);

        if (ehPadrao && total > 0) {
            await cartoesModel.removerPadraoDoUsuario(id_usuario);
        }

        const id = await cartoesModel.criarCartao({
            id_usuario,
            icone,
            destinatario,
            ultimos_digitos: String(ultimos_digitos),
            nome_titular,
            padrao: ehPadrao
        });

        return res.status(201).json({ msg: "Cartão cadastrado com sucesso", id });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao cadastrar cartão", erro: error.message });
    }
}

export async function atualizarCartao(req, res) {
    try {
        const { id_cartao } = req.params;
        const { icone, destinatario, nome_titular } = req.body;

        const cartao = await cartoesModel.buscarCartaoPorId(id_cartao, req.usuario.id);
        if (!cartao) {
            return res.status(404).json({ msg: "Cartão não encontrado" });
        }

        const atualizado = await cartoesModel.atualizarCartao(
            id_cartao,
            req.usuario.id,
            { icone, destinatario, nome_titular }
        );

        if (!atualizado) {
            return res.status(400).json({ msg: "Nenhum campo válido para atualizar" });
        }

        return res.status(200).json({ msg: "Cartão atualizado" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar cartão", erro: error.message });
    }
}

export async function definirCartaoPadrao(req, res) {
    try {
        const { id_cartao } = req.params;
        const id_usuario = req.usuario.id;

        const cartao = await cartoesModel.buscarCartaoPorId(id_cartao, id_usuario);
        if (!cartao) {
            return res.status(404).json({ msg: "Cartão não encontrado" });
        }

        await cartoesModel.removerPadraoDoUsuario(id_usuario);
        await cartoesModel.definirPadrao(id_cartao, id_usuario);

        return res.status(200).json({ msg: "Cartão definido como padrão" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao definir cartão padrão", erro: error.message });
    }
}

export async function deletarCartao(req, res) {
    try {
        const { id_cartao } = req.params;
        const id_usuario = req.usuario.id;

        const cartao = await cartoesModel.buscarCartaoPorId(id_cartao, id_usuario);
        if (!cartao) {
            return res.status(404).json({ msg: "Cartão não encontrado" });
        }

        const deletado = await cartoesModel.deletarCartao(id_cartao, id_usuario);
        if (!deletado) {
            return res.status(500).json({ msg: "Falha ao remover cartão" });
        }

        if (cartao.padrao) {
            const restantes = await cartoesModel.listarCartoesPorUsuario(id_usuario);
            if (restantes.length > 0) {
                await cartoesModel.definirPadrao(restantes[0].id_cartao, id_usuario);
            }
        }

        return res.status(200).json({ msg: "Cartão removido" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao remover cartão", erro: error.message });
    }
}