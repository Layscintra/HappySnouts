import * as petsModel from "../models/pets.model.js";
import * as pesosModel from "../models/pesos.model.js";

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/;

function lerPeso(valor) {
    const peso = Number(valor);
    return Number.isFinite(peso) && peso > 0 && peso <= 200 ? Number(peso.toFixed(3)) : null;
}

async function registrarNoHistorico(id_pet, peso) {
    try {
        await pesosModel.registrar(id_pet, peso);
    } catch (erro) {
        console.warn("Não foi possível gravar o histórico de peso:", erro.message);
    }
}

export async function listarPet(req, res) {
    try {
        const pets = await petsModel.listarPetsPorUsuario(req.usuario.id);
        return res.status(200).json(pets);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar pets", erro: error.message });
    }
}

export async function buscarPetPorId(req, res) {
    try {
        const { id_pet } = req.params;
        const pet = await petsModel.buscarPetDoUsuario(id_pet, req.usuario.id);

        if (!pet) {
            return res.status(404).json({ msg: "Pet não encontrado" });
        }

        return res.status(200).json(pet);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao buscar pet", erro: error.message });
    }
}

export async function criarPet(req, res) {
    try {
        const { nome_pet, raca, idade_pet, peso_atual, foto_url } = req.body;

        if (!nome_pet || !raca ) {
            return res.status(400).json({ msg: "Nome do pet e raça são obrigatórios." });
        }

        const id = await petsModel.criarPet({
            id_usuario: req.usuario.id,
            nome_pet,
            raca,
            idade_pet,
            peso_atual,
            foto_url
        });

        const peso = lerPeso(peso_atual);
        if (peso !== null) await registrarNoHistorico(id, peso);

        return res.status(201).json({ msg: "Pet cadastrado com sucesso", id });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao cadastrar pet", erro: error.message });
    }
}

export async function atualizarPet(req, res) {
    try {
        const { id_pet } = req.params;
        const { nome_pet, raca, idade_pet, id_coleira, id_alimentador, peso_atual, foto_url } = req.body;

        if (!nome_pet || !raca) {
            return res.status(400).json({ msg: "Nome do pet e raça são obrigatórios." });
        }

        const pet = await petsModel.buscarPetDoUsuario(id_pet, req.usuario.id);
        if (!pet) {
            return res.status(404).json({ msg: "Pet não encontrado" });
        }

        const atualizado = await petsModel.atualizarPet(id_pet, {
            nome_pet,
            raca,
            idade_pet: idade_pet ?? pet.idade_pet,
            id_coleira: id_coleira !== undefined ? id_coleira : pet.id_coleira,
            id_alimentador: id_alimentador !== undefined ? id_alimentador : pet.id_alimentador,
            peso_atual: peso_atual ?? pet.peso_atual,
            foto_url: foto_url ?? pet.foto_url
        });

        if (!atualizado) {
            return res.status(500).json({ msg: "Falha ao atualizar pet" });
        }

        const novoPeso = lerPeso(peso_atual);
        if (novoPeso !== null && Number(pet.peso_atual) !== novoPeso) {
            const antigo = lerPeso(pet.peso_atual);
            const vazio = await pesosModel.listarPorPet(id_pet).then(l => !l.length).catch(() => false);
            if (antigo !== null && vazio) await registrarNoHistorico(id_pet, antigo);
            await registrarNoHistorico(id_pet, novoPeso);
        }

        return res.status(200).json({ msg: "Pet atualizado" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar pet", erro: error.message });
    }
}

export async function deletarPet(req, res) {
    try {
        const { id_pet } = req.params;
        const pet = await petsModel.buscarPetDoUsuario(id_pet, req.usuario.id);

        if (!pet) {
            return res.status(404).json({ msg: "Pet não encontrado" });
        }

        const deletado = await petsModel.deletarPet(id_pet);
        if (!deletado) {
            return res.status(500).json({ msg: "Falha ao deletar pet" });
        }

        return res.status(200).json({ msg: "Pet removido" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao deletar pet", erro: error.message });
    }
}

export async function listarPesos(req, res) {
    try {
        const { id_pet } = req.params;
        const pet = await petsModel.buscarPetDoUsuario(id_pet, req.usuario.id);
        if (!pet) {
            return res.status(404).json({ msg: "Pet não encontrado" });
        }

        let pesos = await pesosModel.listarPorPet(id_pet);

        const atual = lerPeso(pet.peso_atual);
        if (!pesos.length && atual !== null) {
            await pesosModel.registrar(id_pet, atual);
            pesos = await pesosModel.listarPorPet(id_pet);
        }

        return res.status(200).json(pesos);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar o histórico de peso", erro: error.message });
    }
}

export async function registrarPeso(req, res) {
    try {
        const { id_pet } = req.params;
        const pet = await petsModel.buscarPetDoUsuario(id_pet, req.usuario.id);
        if (!pet) {
            return res.status(404).json({ msg: "Pet não encontrado" });
        }

        const peso = lerPeso(req.body.peso);
        if (peso === null) {
            return res.status(400).json({ msg: "peso deve ser um número maior que 0 e até 200 (kg)" });
        }

        let data = null;
        if (req.body.data_registro) {
            if (!REGEX_DATA.test(req.body.data_registro)) {
                return res.status(400).json({ msg: "data_registro deve estar no formato AAAA-MM-DD ou AAAA-MM-DD HH:MM:SS" });
            }
            data = req.body.data_registro.length === 10 ? `${req.body.data_registro} 12:00:00` : req.body.data_registro;
            if (new Date(data.replace(" ", "T")) > new Date()) {
                return res.status(400).json({ msg: "A data da pesagem não pode ser no futuro" });
            }
        }

        const id = await pesosModel.registrar(id_pet, peso, data);
        await petsModel.atualizarPesoAtual(id_pet, await pesosModel.ultimo(id_pet));

        return res.status(201).json({ msg: "Pesagem registrada", id });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao registrar a pesagem", erro: error.message });
    }
}

export async function deletarPeso(req, res) {
    try {
        const { id_pet, id_peso } = req.params;
        const pet = await petsModel.buscarPetDoUsuario(id_pet, req.usuario.id);
        if (!pet) {
            return res.status(404).json({ msg: "Pet não encontrado" });
        }

        const deletado = await pesosModel.deletar(id_peso, id_pet);
        if (!deletado) {
            return res.status(404).json({ msg: "Pesagem não encontrada" });
        }

        await petsModel.atualizarPesoAtual(id_pet, await pesosModel.ultimo(id_pet));
        return res.status(200).json({ msg: "Pesagem removida" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao remover a pesagem", erro: error.message });
    }
}
