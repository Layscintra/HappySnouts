import { Router } from "express";
import * as contatoController from "../controllers/contato.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";
import { verificarCliente } from "../middlewares/verificarCliente.js";
import { verificarFuncionario } from "../middlewares/verificarFuncionario.js";

const router = Router();

/**
 * @swagger
 * /contato:
 *  post:
 *    summary: Envia uma mensagem do Fale conosco (logado ou visitante)
 *    tags: [Fale conosco]
 *    security: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [assunto, mensagem]
 *            properties:
 *              nome: { type: string, description: "Obrigatório para visitante" }
 *              email: { type: string, description: "Obrigatório para visitante" }
 *              assunto: { type: string, enum: ["Dúvida", "Problema no app", "Pedido", "Sugestão", "Dispositivos", "Outro"] }
 *              mensagem: { type: string }
 *    responses:
 *      201: { description: Mensagem registrada (protocolo na resposta) }
 *      400: { description: Dados inválidos }
 */
router.post("/", contatoController.enviarMensagem);

/**
 * @swagger
 * /contato/minhas:
 *  get:
 *    summary: Mensagens do cliente logado, com as respostas da equipe
 *    tags: [Fale conosco]
 *    responses:
 *      200: { description: Lista de mensagens }
 */
router.get("/minhas", autenticarToken, verificarCliente, contatoController.listarMinhasMensagens);

/**
 * @swagger
 * /contato/admin/todas:
 *  get:
 *    summary: Todas as mensagens (funcionário). Filtro opcional ?status=aberta|respondida|fechada
 *    tags: [Fale conosco]
 *    responses:
 *      200: { description: Lista de mensagens }
 */
router.get("/admin/todas", autenticarToken, verificarFuncionario, contatoController.listarTodasMensagens);

/**
 * @swagger
 * /contato/{id_mensagem}/responder:
 *  patch:
 *    summary: Funcionário responde (cliente recebe e-mail e notificação)
 *    tags: [Fale conosco]
 *    parameters:
 *      - in: path
 *        name: id_mensagem
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              resposta: { type: string }
 *    responses:
 *      200: { description: Mensagem respondida }
 */
router.patch("/:id_mensagem/responder", autenticarToken, verificarFuncionario, contatoController.responderMensagem);

/**
 * @swagger
 * /contato/{id_mensagem}/status:
 *  patch:
 *    summary: Funcionário reabre ou encerra o atendimento
 *    tags: [Fale conosco]
 *    parameters:
 *      - in: path
 *        name: id_mensagem
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              status: { type: string, enum: [aberta, respondida, fechada] }
 *    responses:
 *      200: { description: Status alterado }
 */
router.patch("/:id_mensagem/status", autenticarToken, verificarFuncionario, contatoController.mudarStatusMensagem);

export default router;
