import { erroDataNascimento } from "../services/idade.service.js";
import { erroTelefone, digitosTelefone } from "../services/telefone.service.js";
import { erroEmail } from "../services/emailValido.service.js";
import * as clientesModel from "../models/usuario.model.js";
import bcrypt from "bcryptjs";

export async function listarClientes(req, res) {
    try {
        const usuario = await clientesModel.listarClientes();
        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar clientes", erro: error.message });
    }
}

export async function buscarClientePorId(req, res) {
    try {
        const { id } = req.params;
        const usuario = await clientesModel.buscarClientePorId(id);

        if (!usuario) {
            return res.status(404).json({ msg: "Cliente não encontrado" });
        }

        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao buscar cliente", erro: error.message });
    }
}

export async function buscarClientePorEmail(req, res) {
    try {
        const { email } = req.params;
        const usuario = await clientesModel.buscarClientePorEmail(email);

        if (!usuario) {
            return res.status(404).json({ msg: "Cliente não encontrado" });
        }

        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao buscar cliente", erro: error.message });
    }
}

export async function atualizarCliente(req, res) {
    try {
        const { id } = req.params;

        const usuario = await clientesModel.buscarClientePorId(id);
        if (!usuario) {
            return res.status(404).json({ msg: "Cliente não encontrado" });
        }

        if (req.body.data_nascimento !== undefined && req.body.data_nascimento !== null && req.body.data_nascimento !== "") {
            const erroNascimento = erroDataNascimento(req.body.data_nascimento);
            if (erroNascimento) {
                return res.status(400).json({ msg: erroNascimento });
            }
        }

        if (req.body.email !== undefined && String(req.body.email).trim().toLowerCase() !== String(usuario.email || "").toLowerCase()) {
            const erroMail = await erroEmail(req.body.email);
            if (erroMail) {
                return res.status(400).json({ msg: erroMail });
            }
            req.body.email = String(req.body.email).trim().toLowerCase();
        }

        if (req.body.telefone !== undefined && req.body.telefone !== null && req.body.telefone !== "") {
            const erroTel = erroTelefone(req.body.telefone);
            if (erroTel) {
                return res.status(400).json({ msg: erroTel });
            }
            req.body.telefone = digitosTelefone(req.body.telefone);
        }

        const atualizado = await clientesModel.atualizarCliente(id, req.body);
        if (!atualizado) {
            return res.status(400).json({ msg: "Nenhum campo válido para atualizar" });
        }

        return res.status(200).json({ msg: "Cliente atualizado" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar cliente", erro: error.message });
    }
}

export async function atualizarSenhaCliente(req, res) {
    try {
        const { id } = req.params;
        const { senha_atual, nova_senha } = req.body;

        if (!senha_atual || !nova_senha) {
            return res.status(400).json({ msg: "senha_atual e nova_senha são obrigatórias" });
        }

        const usuario = await clientesModel.buscarClientePorId(id);
        if (!usuario) {
            return res.status(404).json({ msg: "Cliente não encontrado" });
        }

        const senhaHash = await clientesModel.buscarSenhaHashPorId(id);

        if (!senhaHash) {
            return res.status(400).json({ msg: "Essa conta ainda não tem senha. Use \"Esqueci minha senha\" no login para criar uma." });
        }

        const senhaValida = await bcrypt.compare(senha_atual, senhaHash);
        if (!senhaValida) {
            return res.status(401).json({ msg: "Senha atual inválida" });
        }

        const novoHash = await bcrypt.hash(nova_senha, 10);
        await clientesModel.atualizarSenhaCliente(id, novoHash);

        return res.status(200).json({ msg: "Senha atualizada" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar senha", erro: error.message });
    }
}

export async function deletarCliente(req, res) {
    try {
        const { id } = req.params;

        const usuario = await clientesModel.buscarClientePorId(id);
        if (!usuario) {
            return res.status(404).json({ msg: "Cliente não encontrado" });
        }

        const deletado = await clientesModel.deletarCliente(id);
        if (!deletado) {
            return res.status(500).json({ msg: "Falha ao deletar cliente" });
        }

        return res.status(200).json({ msg: "Cliente removido" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao deletar cliente", erro: error.message });
    }
}

