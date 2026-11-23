import { buscarCep } from "../services/cep.service.js";

export const consultar = async (req, res) => {
    const cep = String(req.params.cep || "").replace(/\D/g, "");

    if (cep.length !== 8) {
        return res.status(400).json({ mensagem: "CEP inválido. Use 8 números." });
    }

    try {
        const endereco = await buscarCep(cep);
        if (!endereco) {
            return res.status(404).json({ mensagem: "CEP não encontrado" });
        }
        return res.json(endereco);
    } catch (error) {
        return res.status(503).json({ mensagem: "Serviço de CEP indisponível. Preencha o endereço à mão.", erro: error.message });
    }
};
