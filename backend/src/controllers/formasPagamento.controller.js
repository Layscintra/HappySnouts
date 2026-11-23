import * as formasPagamentoModel from "../models/formasPagamento.model.js";

export async function listarFormas(req, res) {
    try {
        return res.status(200).json(await formasPagamentoModel.listarAtivas());
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar formas de pagamento", erro: error.message });
    }
}
