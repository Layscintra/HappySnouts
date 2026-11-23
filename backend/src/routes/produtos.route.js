import { Router } from "express";
import * as produtoController from "../controllers/produtos.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";
import { verificarFuncionario } from "../middlewares/verificarFuncionario.js";

const router = Router();

/**
 * @swagger
 * /produtos/tudo:
 *  get:
 *    summary: Todos os produtos, inclusive inativos (funcionário)
 *    tags: [Produtos]
 *    responses:
 *      200: { description: Lista de produtos }
 *      403: { description: Acesso restrito a funcionários }
 */
router.get("/tudo",autenticarToken, verificarFuncionario, produtoController.listarTdProdutos);

/**
 * @swagger
 * /produtos:
 *  get:
 *    summary: Produtos ativos da loja (público)
 *    tags: [Produtos]
 *    security: []
 *    parameters:
 *      - in: query
 *        name: id_categoria
 *        schema: { type: integer }
 *        description: Filtra por categoria
 *    responses:
 *      200: { description: Lista de produtos }
 *  post:
 *    summary: Cadastra um produto (funcionário)
 *    tags: [Produtos]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/ProdutoInput'
 *    responses:
 *      201: { description: Produto cadastrado (retorna id) }
 *      400: { description: Campos obrigatórios faltando ou categoria inválida }
 *      403: { description: Acesso restrito a funcionários }
 */
router.get("/", produtoController.listarProdutosAtivos);

/**
 * @swagger
 * /produtos/{id_produto}:
 *  get:
 *    summary: Busca um produto pelo ID (público)
 *    tags: [Produtos]
 *    security: []
 *    parameters:
 *      - in: path
 *        name: id_produto
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Produto encontrado }
 *      404: { description: Produto não encontrado }
 *  put:
 *    summary: Atualiza um produto (funcionário)
 *    tags: [Produtos]
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
 *            $ref: '#/components/schemas/ProdutoInput'
 *    responses:
 *      200: { description: Produto atualizado }
 *      400: { description: Campos obrigatórios faltando ou categoria inválida }
 *      403: { description: Acesso restrito a funcionários }
 *      404: { description: Produto não encontrado }
 *  delete:
 *    summary: Remove um produto (funcionário)
 *    tags: [Produtos]
 *    parameters:
 *      - in: path
 *        name: id_produto
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Produto removido }
 *      403: { description: Acesso restrito a funcionários }
 *      404: { description: Produto não encontrado }
 */
router.get("/:id_produto", produtoController.buscarProdutoPorId);
router.post("/", autenticarToken, verificarFuncionario, produtoController.criarProduto);
router.put("/:id_produto", autenticarToken, verificarFuncionario, produtoController.atualizarProduto);
router.delete("/:id_produto", autenticarToken, verificarFuncionario, produtoController.deletarProduto);

export default router;
