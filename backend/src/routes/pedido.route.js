import { Router } from "express";
import * as pedidoController from "../controllers/pedido.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";
import { verificarCliente } from "../middlewares/verificarCliente.js";
import { verificarFuncionario } from "../middlewares/verificarFuncionario.js";

const router = Router();
router.use(autenticarToken);

/**
 * @swagger
 * /pedidos:
 *  get:
 *    summary: Pedidos do cliente logado (com itens e linha do tempo)
 *    tags: [Pedidos]
 *    responses:
 *      200: { description: Lista de pedidos }
 */
router.get("/", verificarCliente, pedidoController.listarMeusPedidos);

/**
 * @swagger
 * /pedidos/admin/todos:
 *  get:
 *    summary: Todos os pedidos (funcionário). Filtros opcionais ?status= e ?pagamento=
 *    tags: [Pedidos]
 *    parameters:
 *      - in: query
 *        name: status
 *        schema: { type: string, enum: [recebido, em_preparacao, enviado, entregue, cancelado] }
 *      - in: query
 *        name: pagamento
 *        description: "Status do pagamento (ex.: pendente para ver quem ainda não pagou)"
 *        schema: { type: string, enum: [pendente, aprovado, recusado, cancelado, estornado] }
 *    responses:
 *      200: { description: Lista de pedidos com dados do cliente }
 */
router.get("/admin/todos", verificarFuncionario, pedidoController.listarTodosPedidos);

/**
 * @swagger
 * /pedidos/admin/resumo:
 *  get:
 *    summary: Quantidade de pedidos por status e faturamento (funcionário)
 *    tags: [Pedidos]
 *    responses:
 *      200: { description: Resumo }
 */
router.get("/admin/resumo", verificarFuncionario, pedidoController.resumoPedidos);

/**
 * @swagger
 * /pedidos/{id_pedido}:
 *  get:
 *    summary: Detalhe de um pedido (dono ou funcionário)
 *    tags: [Pedidos]
 *    parameters:
 *      - in: path
 *        name: id_pedido
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Pedido }
 *      404: { description: Não encontrado }
 */
router.get("/:id_pedido", pedidoController.buscarPedido);

/**
 * @swagger
 * /pedidos/{id_pedido}/cancelar:
 *  patch:
 *    summary: Cliente cancela o próprio pedido (só antes de sair para entrega)
 *    tags: [Pedidos]
 *    parameters:
 *      - in: path
 *        name: id_pedido
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Pedido cancelado }
 */
router.patch("/:id_pedido/cancelar", verificarCliente, pedidoController.cancelarMeuPedido);

/**
 * @swagger
 * /pedidos/{id_pedido}/status:
 *  patch:
 *    summary: Funcionário muda o status do pedido (o cliente recebe notificação e e-mail)
 *    tags: [Pedidos]
 *    parameters:
 *      - in: path
 *        name: id_pedido
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [status]
 *            properties:
 *              status: { type: string, enum: [em_preparacao, enviado, entregue, cancelado] }
 *              observacao: { type: string }
 *              codigo_rastreio: { type: string }
 *    responses:
 *      200: { description: Pedido atualizado }
 *      400: { description: Mudança de status não permitida }
 */
router.patch("/:id_pedido/status", verificarFuncionario, pedidoController.atualizarStatusPedido);

/**
 * @swagger
 * /pedidos/{id_pedido}/pagamento:
 *  patch:
 *    summary: Funcionário confirma, recusa ou estorna o pagamento (o cliente recebe notificação e e-mail)
 *    description: |
 *      pendente → aprovado | recusado | cancelado;
 *      recusado → pendente | aprovado | cancelado;
 *      aprovado → estornado. Ao aprovar, data_pagamento recebe a data e hora atuais.
 *      Cancelar o pedido já cancela (pendente) ou estorna (aprovado) o pagamento sozinho.
 *    tags: [Pedidos]
 *    parameters:
 *      - in: path
 *        name: id_pedido
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [status]
 *            properties:
 *              status: { type: string, enum: [pendente, aprovado, recusado, cancelado, estornado] }
 *    responses:
 *      200: { description: Pedido atualizado (campo pagamento) }
 *      400: { description: Mudança não permitida ou pedido sem pagamento }
 *      404: { description: Pedido não encontrado }
 */
router.patch("/:id_pedido/pagamento", verificarFuncionario, pedidoController.atualizarPagamentoPedido);

export default router;
