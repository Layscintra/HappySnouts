import * as lembretesModel from "../models/lembretes.model.js";

const TIPOS_VALIDOS = ["remedio", "banho", "vacina", "consulta", "outro"];
const REGEX_COR = /^#[0-9A-Fa-f]{6}$/;
const REGEX_DATA_HORA = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/;
const REGEX_MES = /^(\d{4})-(0[1-9]|1[0-2])$/;

function normalizarDataHora(valor) {
    if (typeof valor !== "string" || !REGEX_DATA_HORA.test(valor)) return null;
    let texto = valor.replace("T", " ");
    if (texto.length === 16) texto += ":00";
    if (Number.isNaN(Date.parse(texto.replace(" ", "T")))) return null;
    return texto;
}

export async function listarLembretes(req, res) {
    try {
        let ano, mes;

        if (req.query.mes) {
            const partes = REGEX_MES.exec(req.query.mes);
            if (!partes) {
                return res.status(400).json({ msg: "mes deve estar no formato AAAA-MM (ex: 2026-09)" });
            }
            ano = Number(partes[1]);
            mes = Number(partes[2]);
        } else {
            const hoje = new Date();
            ano = hoje.getFullYear();
            mes = hoje.getMonth() + 1;
        }

        const lembretes = await lembretesModel.listarPorMes(req.usuario.id, ano, mes);
        return res.status(200).json(lembretes);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar lembretes", erro: error.message });
    }
}

export async function listarProximos(req, res) {
    try {
        let limite = Number(req.query.limite ?? 5);
        if (!Number.isInteger(limite) || limite < 1) limite = 5;
        if (limite > 50) limite = 50;

        const lembretes = await lembretesModel.listarProximos(req.usuario.id, limite);
        return res.status(200).json(lembretes);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar próximos cuidados", erro: error.message });
    }
}

export async function buscarLembretePorId(req, res) {
    try {
        const { id_lembrete } = req.params;
        const lembrete = await lembretesModel.buscarPorId(id_lembrete, req.usuario.id);

        if (!lembrete) {
            return res.status(404).json({ msg: "Lembrete não encontrado" });
        }

        return res.status(200).json(lembrete);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao buscar lembrete", erro: error.message });
    }
}

export async function criarLembrete(req, res) {
    try {
        const { id_pet, titulo, tipo, cor, descricao, data_hora, recorrente } = req.body;

        if (!id_pet || !titulo || !tipo || !data_hora) {
            return res.status(400).json({ msg: "id_pet, titulo, tipo e data_hora são obrigatórios" });
        }

        if (titulo.length > 100) {
            return res.status(400).json({ msg: "titulo deve ter no máximo 100 caracteres" });
        }

        if (!TIPOS_VALIDOS.includes(tipo)) {
            return res.status(400).json({ msg: `tipo deve ser um destes: ${TIPOS_VALIDOS.join(", ")}` });
        }

        if (cor !== undefined && !REGEX_COR.test(cor)) {
            return res.status(400).json({ msg: "cor deve estar no formato #RRGGBB (ex: #E57373)" });
        }

        if (descricao !== undefined && descricao !== null && descricao.length > 150) {
            return res.status(400).json({ msg: "descricao deve ter no máximo 150 caracteres" });
        }

        const dataFormatada = normalizarDataHora(data_hora);
        if (!dataFormatada) {
            return res.status(400).json({ msg: "data_hora inválida. Use o formato AAAA-MM-DD HH:MM:SS" });
        }

        const pet = await lembretesModel.buscarPetDoUsuario(id_pet, req.usuario.id);
        if (!pet) {
            return res.status(404).json({ msg: "Pet não encontrado" });
        }

        const id = await lembretesModel.criarLembrete({
            id_pet,
            titulo,
            tipo,
            cor,
            descricao,
            data_hora: dataFormatada,
            recorrente
        });

        return res.status(201).json({ msg: "Lembrete cadastrado com sucesso", id });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao cadastrar lembrete", erro: error.message });
    }
}

export async function atualizarLembrete(req, res) {
    try {
        const { id_lembrete } = req.params;
        const { titulo, tipo, cor, descricao, data_hora, recorrente } = req.body;

        if (titulo !== undefined && (!titulo || titulo.length > 100)) {
            return res.status(400).json({ msg: "titulo deve ter entre 1 e 100 caracteres" });
        }

        if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo)) {
            return res.status(400).json({ msg: `tipo deve ser um destes: ${TIPOS_VALIDOS.join(", ")}` });
        }

        if (cor !== undefined && !REGEX_COR.test(cor)) {
            return res.status(400).json({ msg: "cor deve estar no formato #RRGGBB (ex: #E57373)" });
        }

        if (descricao !== undefined && descricao !== null && descricao.length > 150) {
            return res.status(400).json({ msg: "descricao deve ter no máximo 150 caracteres" });
        }

        let dataFormatada;
        if (data_hora !== undefined) {
            dataFormatada = normalizarDataHora(data_hora);
            if (!dataFormatada) {
                return res.status(400).json({ msg: "data_hora inválida. Use o formato AAAA-MM-DD HH:MM:SS" });
            }
        }

        const lembrete = await lembretesModel.buscarPorId(id_lembrete, req.usuario.id);
        if (!lembrete) {
            return res.status(404).json({ msg: "Lembrete não encontrado" });
        }

        const atualizado = await lembretesModel.atualizarLembrete(id_lembrete, req.usuario.id, {
            titulo,
            tipo,
            cor,
            descricao,
            data_hora: dataFormatada,
            recorrente
        });

        if (!atualizado) {
            return res.status(400).json({ msg: "Nenhum campo válido para atualizar" });
        }

        return res.status(200).json({ msg: "Lembrete atualizado" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar lembrete", erro: error.message });
    }
}

export async function concluirLembrete(req, res) {
    try {
        const { id_lembrete } = req.params;

        const lembrete = await lembretesModel.buscarPorId(id_lembrete, req.usuario.id);
        if (!lembrete) {
            return res.status(404).json({ msg: "Lembrete não encontrado" });
        }

        await lembretesModel.concluirLembrete(id_lembrete, req.usuario.id);
        return res.status(200).json({ msg: "Lembrete concluído" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao concluir lembrete", erro: error.message });
    }
}

export async function deletarLembrete(req, res) {
    try {
        const { id_lembrete } = req.params;

        const lembrete = await lembretesModel.buscarPorId(id_lembrete, req.usuario.id);
        if (!lembrete) {
            return res.status(404).json({ msg: "Lembrete não encontrado" });
        }

        const deletado = await lembretesModel.deletarLembrete(id_lembrete, req.usuario.id);
        if (!deletado) {
            return res.status(500).json({ msg: "Falha ao remover lembrete" });
        }

        return res.status(200).json({ msg: "Lembrete removido" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao remover lembrete", erro: error.message });
    }
}