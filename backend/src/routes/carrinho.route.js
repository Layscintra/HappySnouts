import { Router } from "express";
import * as carrinhoController from "../controllers/carrinho.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

function somenteCliente(req, res, next) {
    if (req.usuario.tipo !== "cliente") {
        return res.status(403).json({ msg: "Acesso restrito a clientes" });
    }
    next();
}

const router = Router();
router.use(autenticarToken);
router.use(somenteCliente);

/**
 * @swagger
 * /carrinho:
 *  get:
 *    summary: Carrinho do cliente logado (itens, subtotal, frete e total)
 *    tags: [Carrinho]
 *    responses:
 *      200:
 *        description: Carrinho
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                id_carrinho: { type: integer }
 *                id_endereco: { type: integer, nullable: true }
 *                tipo_entrega: { type: string, enum: [normal, rapida], nullable: true }
 *                cep_entrega: { type: string, nullable: true }
 *                itens:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      id_produto: { type: integer }
 *                      nome: { type: string }
 *                      imagem_url: { type: string }
 *                      ativo: { type: boolean }
 *                      quantidade: { type: integer }
 *                      preco_unico: { type: number }
 *                      subtotal: { type: number }
 *                subtotal: { type: number }
 *                frete: { type: number }
 *                total: { type: number }
 *      403: { description: Acesso restrito a clientes }
 *  delete:
 *    summary: Esvazia o carrinho
 *    tags: [Carrinho]
 *    responses:
 *      200: { description: Carrinho esvaziado }
 */
router.get("/", carrinhoController.verCarrinho);
router.delete("/", carrinhoController.limparCarrinho);

/**
 * @swagger
 * /carrinho/itens:
 *  post:
 *    summary: Adiciona um produto ao carrinho (soma à quantidade se já existir)
 *    tags: [Carrinho]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [id_produto, quantidade]
 *            properties:
 *              id_produto: { type: integer }
 *              quantidade: { type: integer, minimum: 1 }
 *    responses:
 *      201: { description: Item adicionado ao carrinho }
 *      400: { description: id_produto ou quantidade inválidos }
 *      404: { description: Produto não encontrado }
 */
router.post("/itens", carrinhoController.adicionarItem);

/**
 * @swagger
 * /carrinho/itens/{id_produto}:
 *  put:
 *    summary: Altera a quantidade de um item do carrinho
 *    tags: [Carrinho]
 *    parameters:
 *      - in: path
 *        name: id_produto
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [quantidade]
 *            properties:
 *              quantidade: { type: integer, minimum: 1 }
 *    responses:
 *      200: { description: Quantidade atualizada }
 *      400: { description: Quantidade inválida (para remover use DELETE) }
 *      404: { description: Item não encontrado no carrinho }
 *  delete:
 *    summary: Remove um item do carrinho
 *    tags: [Carrinho]
 *    parameters:
 *      - in: path
 *        name: id_produto
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Item removido }
 *      404: { description: Item não encontrado no carrinho }
 */
router.put("/itens/:id_produto", carrinhoController.atualizarQuantidade);
router.delete("/itens/:id_produto", carrinhoController.removerItem);

/**
 * @swagger
 * /carrinho/entrega:
 *  put:
 *    summary: Define endereço e tipo de entrega (frete normal R$ 10, rápida R$ 20)
 *    tags: [Carrinho]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [id_endereco, tipo_entrega]
 *            properties:
 *              id_endereco: { type: integer }
 *              tipo_entrega: { type: string, enum: [normal, rapida] }
 *    responses:
 *      200: { description: "Entrega definida (retorna o valor do frete)" }
 *      400: { description: Dados obrigatórios faltando ou tipo_entrega inválido }
 *      404: { description: Endereço não encontrado }
 */
router.put("/entrega", carrinhoController.definirEntrega);

/**
 * @swagger
 * /carrinho/finalizar:
 *  post:
 *    summary: Finaliza a compra e gera o pedido (cliente recebe notificação e e-mail)
 *    tags: [Carrinho]
 *    requestBody:
 *      required: false
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              forma_pagamento:
 *                type: string
 *                enum: [pix, cartao_credito, cartao_debito, boleto]
 *                description: "Código de /formas-pagamento. Texto livre antigo (ex.: \"Pix\", \"Visa •••• 1234\") ainda é aceito."
 *              id_cartao: { type: integer, description: "Obrigatório para cartao_credito e cartao_debito" }
 *              parcelas: { type: integer, minimum: 1, description: "Crédito: até max_parcelas. Débito, Pix e boleto: 1" }
 *              cupom: { type: string }
 *              desconto: { type: number, description: "Nunca passa do subtotal" }
 *              frete_gratis: { type: boolean }
 *          example: { forma_pagamento: "cartao_credito", id_cartao: 3, parcelas: 2 }
 *    responses:
 *      200: { description: "Compra finalizada (id_pedido, numero, pagamento e resumo). Cartão é aprovado na hora; Pix e boleto ficam pendentes e o Pix traz o copia e cola." }
 *      400: { description: Carrinho vazio, entrega não definida, produto indisponível, endereço removido ou pagamento inválido }
 */
router.post("/finalizar", carrinhoController.finalizarCompra);

export default router;
