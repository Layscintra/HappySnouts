import { Router } from "express";
import * as postBlogController from "../controllers/postBlog.controller.js";
import * as comentarioBlogController from "../controllers/comentarioBlog.controller.js";
import { autenticarToken, autenticarOpcional } from "../middlewares/authMiddleware.js";
import { verificarCliente } from "../middlewares/verificarCliente.js";
import { verificarFuncionario } from "../middlewares/verificarFuncionario.js";

const router = Router();

function clienteOuFuncionario(req, res, next) {
    if (!["cliente", "funcionario"].includes(req.usuario?.tipo)) {
        return res.status(403).json({ msg: "Acesso negado" });
    }
    next();
}


/**
 * @swagger
 * /postBlog:
 *  get:
 *    summary: Lista posts publicados (com filtros e paginação)
 *    tags: [Blog]
 *    parameters:
 *      - in: query
 *        name: categoria
 *        schema: { type: integer }
 *        description: ID da categoria
 *      - in: query
 *        name: busca
 *        schema: { type: string }
 *        description: Texto buscado no título/conteúdo
 *      - in: query
 *        name: meus
 *        schema: { type: string, enum: ["1"] }
 *        description: "1 = só os posts do cliente logado"
 *      - in: query
 *        name: pagina
 *        schema: { type: integer, default: 1 }
 *      - in: query
 *        name: limite
 *        schema: { type: integer, default: 10, maximum: 50 }
 *    responses:
 *      200: { description: Lista de posts }
 *  post:
 *    summary: Publica um post (cliente ou funcionário)
 *    tags: [Blog]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [id_categoria, titulo, conteudo]
 *            properties:
 *              id_categoria: { type: integer }
 *              titulo: { type: string, maxLength: 200 }
 *              resumo: { type: string, maxLength: 300 }
 *              conteudo: { type: string }
 *              imagem_capa_url: { type: string, description: "Caminho retornado por POST /upload" }
 *    responses:
 *      201: { description: Post cadastrado (retorna id_post) }
 *      400: { description: Dados inválidos }
 *      404: { description: Categoria não encontrada }
 */
router.get("/", autenticarOpcional, postBlogController.listarPosts);

/**
 * @swagger
 * /postBlog/admin/todos:
 *  get:
 *    summary: Todos os posts, inclusive inativos (funcionário)
 *    tags: [Blog]
 *    responses:
 *      200: { description: Lista de posts }
 *      403: { description: Acesso restrito a funcionários }
 */
router.get("/admin/todos", autenticarToken, verificarFuncionario, postBlogController.listarTdPosts);

/**
 * @swagger
 * /postBlog/{id_post}:
 *  get:
 *    summary: Busca um post pelo ID
 *    tags: [Blog]
 *    parameters:
 *      - in: path
 *        name: id_post
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Post encontrado }
 *      404: { description: Post não encontrado }
 *  put:
 *    summary: Edita um post (cliente só os próprios; funcionário qualquer um)
 *    tags: [Blog]
 *    parameters:
 *      - in: path
 *        name: id_post
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              id_categoria: { type: integer }
 *              titulo: { type: string, maxLength: 200 }
 *              resumo: { type: string, maxLength: 300 }
 *              conteudo: { type: string }
 *              imagem_capa_url: { type: string }
 *    responses:
 *      200: { description: Post atualizado }
 *      400: { description: Dados inválidos ou nenhum campo para atualizar }
 *      403: { description: Você só pode editar seus próprios posts }
 *      404: { description: Post ou categoria não encontrado }
 *  delete:
 *    summary: Exclui um post (cliente só os próprios; funcionário qualquer um)
 *    tags: [Blog]
 *    parameters:
 *      - in: path
 *        name: id_post
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Post removido }
 *      403: { description: Você só pode excluir seus próprios posts }
 *      404: { description: Post não encontrado }
 */
router.get("/:id_post", autenticarOpcional, postBlogController.buscarPostsPorId);

router.post("/", autenticarToken, clienteOuFuncionario, postBlogController.criarPosts);

router.put("/:id_post", autenticarToken, clienteOuFuncionario, postBlogController.atualizarPosts);
router.delete("/:id_post", autenticarToken, clienteOuFuncionario, postBlogController.deletarPosts);

/**
 * @swagger
 * /postBlog/{id_post}/comentarios:
 *  get:
 *    summary: Lista os comentários de um post (público)
 *    tags: [Blog]
 *    parameters:
 *      - in: path
 *        name: id_post
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Lista de comentários (mais antigos primeiro) }
 *      404: { description: Post não encontrado }
 *  post:
 *    summary: Comenta em qualquer post (cliente ou funcionário)
 *    tags: [Blog]
 *    parameters:
 *      - in: path
 *        name: id_post
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [texto]
 *            properties:
 *              texto: { type: string, maxLength: 1000 }
 *    responses:
 *      201: { description: Comentário publicado (retorna id_comentario) }
 *      400: { description: Texto inválido }
 *      404: { description: Post não encontrado }
 */
router.get("/:id_post/comentarios", autenticarOpcional, comentarioBlogController.listarComentarios);
router.post("/:id_post/comentarios", autenticarToken, clienteOuFuncionario, comentarioBlogController.criarComentario);

/**
 * @swagger
 * /postBlog/{id_post}/comentarios/{id_comentario}:
 *  delete:
 *    summary: Remove um comentário (autor do comentário, autor do post ou funcionário)
 *    tags: [Blog]
 *    parameters:
 *      - in: path
 *        name: id_post
 *        required: true
 *        schema: { type: integer }
 *      - in: path
 *        name: id_comentario
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Comentário removido }
 *      403: { description: Sem permissão }
 *      404: { description: Comentário não encontrado }
 */
router.delete("/:id_post/comentarios/:id_comentario", autenticarToken, clienteOuFuncionario, comentarioBlogController.deletarComentario);

/**
 * @swagger
 * /postBlog/{id_post}/curtir:
 *  post:
 *    summary: Curte (favorita) um post (cliente)
 *    tags: [Blog]
 *    parameters:
 *      - in: path
 *        name: id_post
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: "{ curtido, total_curtidas }" }
 *      404: { description: Post não encontrado }
 *  delete:
 *    summary: Remove a curtida de um post (cliente)
 *    tags: [Blog]
 *    parameters:
 *      - in: path
 *        name: id_post
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: "{ curtido, total_curtidas }" }
 */
router.post("/:id_post/curtir", autenticarToken, verificarCliente, comentarioBlogController.curtirPost);
router.delete("/:id_post/curtir", autenticarToken, verificarCliente, comentarioBlogController.descurtirPost);

/**
 * @swagger
 * /postBlog/{id_post}/comentarios/{id_comentario}/curtir:
 *  post:
 *    summary: Curte (favorita) um comentário (cliente)
 *    tags: [Blog]
 *    parameters:
 *      - in: path
 *        name: id_post
 *        required: true
 *        schema: { type: integer }
 *      - in: path
 *        name: id_comentario
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: "{ curtido, total_curtidas }" }
 *      404: { description: Comentário não encontrado }
 *  delete:
 *    summary: Remove a curtida de um comentário (cliente)
 *    tags: [Blog]
 *    parameters:
 *      - in: path
 *        name: id_post
 *        required: true
 *        schema: { type: integer }
 *      - in: path
 *        name: id_comentario
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: "{ curtido, total_curtidas }" }
 */
router.post("/:id_post/comentarios/:id_comentario/curtir", autenticarToken, verificarCliente, comentarioBlogController.curtirComentario);
router.delete("/:id_post/comentarios/:id_comentario/curtir", autenticarToken, verificarCliente, comentarioBlogController.descurtirComentario);

export default router;
