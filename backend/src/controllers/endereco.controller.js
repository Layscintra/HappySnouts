import * as enderecoModel from "../models/endereco.model.js";

export async function listarEnderecosPorUsuario1(req, res) {
    const usuario = await enderecoModel.listarEnderecosPorUsuario(req.usuario.id);
    return res.status(200).json(usuario);
} 

export async function buscarEnderecoPorId1(req, res) {
    const { id_endereco } = req.params;
    const endereco = await enderecoModel.buscarEnderecoPorId(id_endereco);

    if (!endereco) {
        return res.status(404).json({ msg: "Endereço não encontrado" });
    }

    return res.status(200).json(endereco);
}

export async function criarEndereco1(req, res) {
    const { id_usuario, cep, estado, cidade, bairro, endereco, numero, apelido, padrao } = req.body;

    if (!cep || !estado || !cidade || !bairro || !endereco || !numero) {
        return res.status(400).json({ msg: "CEP, estado, cidade, bairro, endereco e numero são obrigatório." });
    }
    const id = await enderecoModel.criarEndereco({id_usuario: req.usuario.id, cep, estado, cidade, bairro, endereco, numero, apelido, padrao });
    return res.status(201).json({ msg: "Endereço cadastrado com sucesso", id });
}

export async function contarEnderecosPorUsuario1(req, res) {
    try {
        const { id_usuario } = req.params;
        const total = await enderecoModel.contarEnderecosPorUsuario(id_usuario);

        return res.status(200).json({ total });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao contar endereços", erro: error.message });
    }
}

export async function definirEnderecoPadrao1(req, res) {
    try {
        const id_usuario = req.usuario.id;
        const { id_endereco } = req.params;

        const atualizado = await enderecoModel.definirEnderecoPadrao(id_usuario, id_endereco);

        if (!atualizado) {
            return res.status(404).json({ msg: "Endereço não encontrado" });
        }

        return res.status(200).json({ msg: "Endereço definido como padrão" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao definir endereço padrão", erro: error.message });
    }
}

export async function atualizarEndereco1(req, res) {
    const { id_endereco } = req.params;
    const { id_usuario, cep, estado, cidade, bairro, endereco, numero, apelido, padrao } = req.body;

    if (!cep || !estado || !cidade || !bairro || !endereco || !numero) {
        return res.status(400).json({ msg: "CEP, estado, cidade, bairro, endereco e numero são obrigatório." });
    }

    const endereço = await enderecoModel.buscarEnderecoPorId(id_endereco);

    if (!endereço) {
        return res.status(404).json({ msg: "Endereço não encontrado" });
    }

    const atualizado = await enderecoModel.atualizarEndereco(id_endereco, { id_usuario, cep, estado, cidade, bairro, endereco, numero, apelido, padrao });

    if (!atualizado) {
        return res.status(500).json({ msg: "Falha ao atualizar endereço" });
    }

    return res.status(200).json({ msg: "Endereço atualizado" });
}

export async function deletarEndereco1(req, res) {
    const { id_endereco } = req.params;
    const endereco = await enderecoModel.buscarEnderecoPorId(id_endereco);
    if (!endereco) {
        return res.status(404).json({ msg: "Endereço não encontrado" });
    }
    const deletado = await enderecoModel.deletarEndereco(id_endereco);
    if (!deletado) {
        return res.status(500).json({ msg: "Falha ao deletar endereço" });
    }
    return res.status(200).json({ msg: "Endereço removido" });
}
