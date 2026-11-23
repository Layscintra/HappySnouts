import { Router } from "express";
import * as categoriaBlogController from "../controllers/categoriaBlog.controller.js";
import { autenticarToken, autenticarOpcional } from "../middlewares/authMiddleware.js";
import { verificarFuncionario } from "../middlewares/verificarFuncionario.js";

const router = Router();

/**
 * @swagger
 * /categoriaBlog:
 *  get:
 *    summary: Lista as categorias do blog
 *    tags: [Categorias do Blog]
 *    responses:
 *      200: { description: Lista de categorias }
 *  post:
 *    summary: Cria uma categoria do blog (funcionário)
 *    tags: [Categorias do Blog]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/CategoriaBlogInput'
 *    responses:
 *      201: { description: Categoria cadastrada (retorna id) }
 *      400: { description: nome, cor e icone são obrigatórios }
 *      403: { description: Acesso restrito a funcionários }
 *      409: { description: Já existe uma categoria com esse nome }
 */
router.get("/",autenticarOpcional, categoriaBlogController.listarCategorias);

/**
 * @swagger
 * /categoriaBlog/{id_categoria}:
 *  get:
 *    summary: Busca uma categoria do blog pelo ID
 *    tags: [Categorias do Blog]
 *    parameters:
 *      - in: path
 *        name: id_categoria
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Categoria encontrada }
 *      404: { description: Categoria não encontrada }
 *  put:
 *    summary: Atualiza uma categoria do blog (funcionário)
 *    tags: [Categorias do Blog]
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
 *            $ref: '#/components/schemas/CategoriaBlogInput'
 *    responses:
 *      200: { description: Categoria atualizada }
 *      400: { description: nome, cor e icone são obrigatórios }
 *      403: { description: Acesso restrito a funcionários }
 *      404: { description: Categoria não encontrada }
 *      409: { description: Já existe uma categoria com esse nome }
 *  delete:
 *    summary: Remove uma categoria do blog (funcionário)
 *    tags: [Categorias do Blog]
 *    parameters:
 *      - in: path
 *        name: id_categoria
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Categoria removida }
 *      403: { description: Acesso restrito a funcionários }
 *      404: { description: Categoria não encontrada }
 *      409: { description: Categoria tem posts vinculados }
 */
router.get("/:id_categoria", autenticarOpcional, categoriaBlogController.buscarCategoriaPorId);
router.post("/", autenticarToken, verificarFuncionario, categoriaBlogController.criarCategoria);
router.put("/:id_categoria", autenticarToken, verificarFuncionario, categoriaBlogController.atualizarCategoria);
router.delete("/:id_categoria", autenticarToken, verificarFuncionario, categoriaBlogController.deletarCategoria);

export default router;
