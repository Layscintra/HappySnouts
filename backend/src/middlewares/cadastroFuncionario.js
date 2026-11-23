import { autenticarToken } from "./authMiddleware.js";
import { verificarFuncionario } from "./verificarFuncionario.js";
import { contarFuncionarios } from "../models/funcionario.model.js";

export async function protegerCadastroFuncionario(req, res, next) {
    try {
        if ((await contarFuncionarios()) === 0) {
            return next();
        }
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao verificar funcionários", erro: error.message });
    }

    autenticarToken(req, res, () => verificarFuncionario(req, res, next));
}
