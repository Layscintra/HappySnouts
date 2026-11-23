import { Router } from "express";
import * as enderecoController from "../controllers/endereco.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";
import { atualizarEndereco, buscarEnderecoPorId, contarEnderecosPorUsuario, criarEndereco, definirEnderecoPadrao, deletarEndereco, listarEnderecosPorUsuario } from "../models/endereco.model.js";

const router = Router();
router.use(autenticarToken);

/**
 * @swagger
 * /endereco/usuario/{id_usuario}:
 *  get:
 *    summary: Lista os endereços do usuário logado (o ID do token é o que vale)
 *    tags: [Endereços]
 *    parameters:
 *      - in: path
 *        name: id_usuario
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Lista de endereços }
 */
router.get("/usuario/:id_usuario", enderecoController.listarEnderecosPorUsuario1 );

/**
 * @swagger
 * /endereco/{id_endereco}:
 *  get:
 *    summary: Busca um endereço pelo ID
 *    tags: [Endereços]
 *    parameters:
 *      - in: path
 *        name: id_endereco
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Endereço encontrado }
 *      404: { description: Endereço não encontrado }
 *  put:
 *    summary: Atualiza um endereço
 *    tags: [Endereços]
 *    parameters:
 *      - in: path
 *        name: id_endereco
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/EnderecoInput'
 *    responses:
 *      200: { description: Endereço atualizado }
 *      400: { description: Campos obrigatórios faltando }
 *      404: { description: Endereço não encontrado }
 *  delete:
 *    summary: Remove um endereço
 *    tags: [Endereços]
 *    parameters:
 *      - in: path
 *        name: id_endereco
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Endereço removido }
 *      404: { description: Endereço não encontrado }
 */
router.get("/:id_endereco", enderecoController.buscarEnderecoPorId1);

/**
 * @swagger
 * /endereco:
 *  post:
 *    summary: Cadastra um endereço para o usuário logado
 *    tags: [Endereços]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/EnderecoInput'
 *    responses:
 *      201: { description: Endereço cadastrado (retorna id) }
 *      400: { description: Campos obrigatórios faltando }
 */
router.post("/", enderecoController.criarEndereco1);
router.put("/:id_endereco", enderecoController.atualizarEndereco1);
router.delete("/:id_endereco", enderecoController.deletarEndereco1);

/**
 * @swagger
 * /endereco/usuario/{id_usuario}/total:
 *  get:
 *    summary: Quantidade de endereços de um usuário
 *    tags: [Endereços]
 *    parameters:
 *      - in: path
 *        name: id_usuario
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: "{ total }" }
 */
router.get("/usuario/:id_usuario/total", enderecoController.contarEnderecosPorUsuario1);

/**
 * @swagger
 * /endereco/{id_endereco}/padrao:
 *  patch:
 *    summary: Define o endereço padrão do usuário logado (sem corpo)
 *    tags: [Endereços]
 *    parameters:
 *      - in: path
 *        name: id_endereco
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Endereço definido como padrão }
 *      404: { description: Endereço não encontrado ou de outro usuário }
 */
router.patch("/:id_endereco/padrao", enderecoController.definirEnderecoPadrao1);

export default router;
