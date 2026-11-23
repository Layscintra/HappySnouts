import { Router } from "express";
import * as formasPagamentoController from "../controllers/formasPagamento.controller.js";

const router = Router();

/**
 * @swagger
 * /formas-pagamento:
 *  get:
 *    summary: Formas de pagamento aceitas no checkout (pix, cartao_credito, cartao_debito, boleto)
 *    tags: [Formas de pagamento]
 *    security: []
 *    responses:
 *      200:
 *        description: Lista das formas ativas
 *        content:
 *          application/json:
 *            example:
 *              - { id_forma_pagamento: 1, codigo: "pix", nome: "Pix", usa_cartao: false, max_parcelas: 1, ativo: true }
 *              - { id_forma_pagamento: 2, codigo: "cartao_credito", nome: "Cartão de crédito", usa_cartao: true, max_parcelas: 3, ativo: true }
 */
router.get("/", formasPagamentoController.listarFormas);

export default router;
