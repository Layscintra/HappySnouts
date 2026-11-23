import { Router } from "express";
import * as categoriaProdutoController from "../controllers/categoriaProduto.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";
import { verificarFuncionario } from "../middlewares/verificarFuncionario.js";

const router = Router();
router.use(autenticarToken);

/**
 * @swagger
 * /categoriaProduto:
 *  get:
 *    summary: Lista as categorias de produto
 *    tags: [Categorias de Produto]
 *    responses:
 *      200: { description: Lista de categorias }
 *  post:
 *    summary: Cria uma categoria de produto (funcionário)
 *    tags: [Categorias de Produto]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/CategoriaProdutoInput'
 *    responses:
 *      201: { description: Categoria cadastrada (retorna id) }
 *      400: { description: nome e icone são obrigatórios }
 *      403: { description: Acesso restrito a funcionários }
 *      409: { description: Já existe uma categoria com esse nome }
 */
router.get("/", categoriaProdutoController.listarCategoriaP);

/**
 * @swagger
 * /categoriaProduto/{id_categoria}:
 *  get:
 *    summary: Busca uma categoria de produto pelo ID
 *    tags: [Categorias de Produto]
 *    parameters:
 *      - in: path
 *        name: id_categoria
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Categoria encontrada }
 *      404: { description: Categoria não encontrada }
 *  put:
 *    summary: Atualiza uma categoria de produto (funcionário)
 *    tags: [Categorias de Produto]
 *    parameters:
 *      - in: path
 *        name: id_categoria
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/CategoriaProdutoInput'
 *    responses:
 *      200: { description: Categoria atualizada }
 *      400: { description: nome e icone são obrigatórios }
 *      403: { description: Acesso restrito a funcionários }
 *      404: { description: Categoria não encontrada }
 *  delete:
 *    summary: Remove uma categoria de produto (funcionário)
 *    tags: [Categorias de Produto]
 *    parameters:
 *      - in: path
 *        name: id_categoria
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Categoria removida }
 *      403: { description: Acesso restrito a funcionários }
 *      404: { description: Categoria não encontrada }
 *      409: { description: Categoria tem produtos vinculados }
 */
router.get("/:id_categoria", categoriaProdutoController.buscarCategoriaPorIdP);
router.post("/", verificarFuncionario, categoriaProdutoController.criarCategoriaP);
router.put("/:id_categoria", verificarFuncionario, categoriaProdutoController.atualizarCategoriaP);
router.delete("/:id_categoria", verificarFuncionario, categoriaProdutoController.deletarCategoriaP);

export default router;
