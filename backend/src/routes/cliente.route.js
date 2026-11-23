import { Router } from "express";
import * as clienteController from "../controllers/cliente.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";
import { verificarFuncionario } from "../middlewares/verificarFuncionario.js";

const router = Router();
router.use(autenticarToken);

router.param("id", (req, res, next, id) => {
    if (req.usuario.tipo === "cliente" && Number(id) !== Number(req.usuario.id)) {
        return res.status(403).json({ msg: "Você só pode acessar a sua própria conta" });
    }
    next();
});


/**
 * @swagger
 * /cliente:
 *  get:
 *    summary: Lista todos os clientes (funcionário)
 *    tags: [Cliente]
 *    responses:
 *      200:
 *        description: Lista de clientes retornada com sucesso
 *      403:
 *        description: Acesso restrito a funcionários
 */
router.get("/", verificarFuncionario, clienteController.listarClientes);

/**
 * @swagger
 * /cliente/{id}:
 *  get:
 *    summary: Busca um cliente pelo ID
 *    tags: [Cliente]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: integer
 *    responses:
 *      200:
 *        description: Cliente encontrado
 *      404:
 *        description: Cliente não encontrado
 */
router.get("/:id", clienteController.buscarClientePorId);

/**
 * @swagger
 * /cliente/email/{email}:
 *  get:
 *    summary: Busca um cliente pelo email (funcionário)
 *    tags: [Cliente]
 *    parameters:
 *      - in: path
 *        name: email
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: Cliente encontrado
 *      403:
 *        description: Acesso restrito a funcionários
 *      404:
 *        description: Cliente não encontrado
 */
router.get("/email/:email", verificarFuncionario, clienteController.buscarClientePorEmail);

/**
 * @swagger
 * /cliente/{id}:
 *  put:
 *    summary: Atualiza os dados de um cliente
 *    tags: [Cliente]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: integer
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              nome_completo:
 *                type: string
 *              nome_usuario:
 *                type: string
 *              email:
 *                type: string
 *              telefone:
 *                type: string
 *              data_nascimento:
 *                type: string
 *                format: date
 *    responses:
 *      200:
 *        description: Cliente atualizado com sucesso
 *      400:
 *        description: Nenhum campo válido para atualizar
 */
router.put("/:id", clienteController.atualizarCliente);

/**
 * @swagger
 * /cliente/{id}/senha:
 *  put:
 *    summary: Atualiza a senha de um cliente
 *    tags: [Cliente]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: integer
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [novaSenha]
 *            properties:
 *              novaSenha:
 *                type: string
 *    responses:
 *      200:
 *        description: Senha atualizada com sucesso
 *      404:
 *        description: Cliente não encontrado
 */
router.put("/:id/senha", clienteController.atualizarSenhaCliente);

/**
 * @swagger
 * /cliente/{id}:
 *  delete:
 *    summary: Remove um cliente
 *    tags: [Cliente]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: integer
 *    responses:
 *      200:
 *        description: Cliente removido
 *      404:
 *        description: Cliente não encontrado
 */
router.delete("/:id", clienteController.deletarCliente);
export default router;
