import { Router } from "express";
import * as favoritosController from "../controllers/favoritos.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

const router = Router();
router.use(autenticarToken);

/**
 * @swagger
 * /favoritos:
 *  get:
 *    summary: Produtos favoritos do usuário logado
 *    tags: [Favoritos]
 *    responses:
 *      200: { description: Lista de favoritos }
 *  post:
 *    summary: Adiciona um produto aos favoritos
 *    tags: [Favoritos]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [id_produto]
 *            properties:
 *              id_produto: { type: integer }
 *    responses:
 *      201: { description: Produto adicionado aos favoritos (retorna id) }
 *      400: { description: id_produto faltando ou produto já favoritado }
 */
router.get("/", favoritosController.listarFavoritosPorUsuario );
router.post("/", favoritosController.adicionarFavorito );

/**
 * @swagger
 * /favoritos/{id_produto}:
 *  delete:
 *    summary: Remove um produto dos favoritos
 *    tags: [Favoritos]
 *    parameters:
 *      - in: path
 *        name: id_produto
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Produto removido dos favoritos }
 *      404: { description: Favorito não encontrado }
 */
router.delete("/:id_produto", favoritosController.removerFavorito );

export default router;
