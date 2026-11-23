import { Router } from "express";
import * as cartoesController from "../controllers/cartoes.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";
import { verificarCliente } from "../middlewares/verificarCliente.js";

const router = Router();
router.use(autenticarToken);
router.use(verificarCliente);

/**
 * @swagger
 * /cartoes:
 *  get:
 *    summary: Cartões salvos do cliente
 *    tags: [Cartões]
 *    responses:
 *      200: { description: Lista de cartões }
 *  post:
 *    summary: Salva um cartão (apenas os 4 últimos dígitos; número completo e CVV são recusados)
 *    tags: [Cartões]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [destinatario, ultimos_digitos]
 *            properties:
 *              icone: { type: string, example: "visa" }
 *              destinatario: { type: string }
 *              ultimos_digitos: { type: string, pattern: '^\d{4}$', example: "1234" }
 *              nome_titular: { type: string }
 *              padrao: { type: boolean, description: "O primeiro cartão vira padrão automaticamente" }
 *    responses:
 *      201: { description: Cartão cadastrado (retorna id) }
 *      400: { description: Dados inválidos ou número completo/CVV enviado }
 */
router.get("/", cartoesController.listarCartoes);

/**
 * @swagger
 * /cartoes/{id_cartao}:
 *  get:
 *    summary: Busca um cartão pelo ID
 *    tags: [Cartões]
 *    parameters:
 *      - in: path
 *        name: id_cartao
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Cartão encontrado }
 *      404: { description: Cartão não encontrado }
 *  put:
 *    summary: Atualiza apelido/ícone/titular do cartão
 *    tags: [Cartões]
 *    parameters:
 *      - in: path
 *        name: id_cartao
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              icone: { type: string }
 *              destinatario: { type: string }
 *              nome_titular: { type: string }
 *    responses:
 *      200: { description: Cartão atualizado }
 *      400: { description: Nenhum campo válido para atualizar }
 *      404: { description: Cartão não encontrado }
 *  delete:
 *    summary: Remove um cartão
 *    tags: [Cartões]
 *    parameters:
 *      - in: path
 *        name: id_cartao
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Cartão removido }
 *      404: { description: Cartão não encontrado }
 */
router.get("/:id_cartao", cartoesController.buscarCartaoPorId);
router.post("/", cartoesController.criarCartao);
router.put("/:id_cartao", cartoesController.atualizarCartao);

/**
 * @swagger
 * /cartoes/{id_cartao}/padrao:
 *  patch:
 *    summary: Define o cartão padrão
 *    tags: [Cartões]
 *    parameters:
 *      - in: path
 *        name: id_cartao
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Cartão definido como padrão }
 *      404: { description: Cartão não encontrado }
 */
router.patch("/:id_cartao/padrao", cartoesController.definirCartaoPadrao);
router.delete("/:id_cartao", cartoesController.deletarCartao);

export default router;
