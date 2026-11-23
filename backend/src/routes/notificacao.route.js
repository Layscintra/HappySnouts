import { Router } from "express";
import * as notificacaoModel from "../models/notificacao.model.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";
import { verificarCliente } from "../middlewares/verificarCliente.js";

const router = Router();
router.use(autenticarToken);
router.use(verificarCliente);

/**
 * @swagger
 * /notificacoes:
 *  get:
 *    summary: Notificações do cliente (mais novas primeiro) e quantas não foram lidas
 *    tags: [Notificações]
 *    responses:
 *      200: { description: "{ nao_lidas, notificacoes: [...] }" }
 */
router.get("/", async (req, res) => {
    try {
        const [notificacoes, nao_lidas] = await Promise.all([
            notificacaoModel.listarPorUsuario(req.usuario.id),
            notificacaoModel.contarNaoLidas(req.usuario.id)
        ]);
        return res.status(200).json({ nao_lidas, notificacoes });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar notificações", erro: error.message });
    }
});

/**
 * @swagger
 * /notificacoes/lidas:
 *  patch:
 *    summary: Marca todas como lidas
 *    tags: [Notificações]
 *    responses:
 *      200: { description: OK }
 */
router.patch("/lidas", async (req, res) => {
    try {
        await notificacaoModel.marcarTodasLidas(req.usuario.id);
        return res.status(200).json({ msg: "Notificações marcadas como lidas" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar notificações", erro: error.message });
    }
});

/**
 * @swagger
 * /notificacoes/{id}/lida:
 *  patch:
 *    summary: Marca uma notificação como lida
 *    tags: [Notificações]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: OK }
 */
router.patch("/:id/lida", async (req, res) => {
    try {
        const ok = await notificacaoModel.marcarLida(req.params.id, req.usuario.id);
        return ok ? res.status(200).json({ msg: "Notificação lida" }) : res.status(404).json({ msg: "Notificação não encontrada" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar notificação", erro: error.message });
    }
});

/**
 * @swagger
 * /notificacoes/{id}:
 *  delete:
 *    summary: Apaga uma notificação
 *    tags: [Notificações]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: OK }
 */
router.delete("/:id", async (req, res) => {
    try {
        const ok = await notificacaoModel.deletarNotificacao(req.params.id, req.usuario.id);
        return ok ? res.status(200).json({ msg: "Notificação removida" }) : res.status(404).json({ msg: "Notificação não encontrada" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao remover notificação", erro: error.message });
    }
});

export default router;
