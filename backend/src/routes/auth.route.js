import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { protegerCadastroFuncionario } from "../middlewares/cadastroFuncionario.js";

const router = Router();

/**
 * @swagger
 * /auth/login:
 *  post:
 *    summary: Login único (cliente ou funcionário). O tipo vem na resposta e no token.
 *    tags: [Auth]
 *    security: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [email, senha]
 *            properties:
 *              email: { type: string }
 *              senha: { type: string }
 *    responses:
 *      200: { description: "Login realizado (tipo cliente ou funcionario)" }
 *      401: { description: Senha inválida }
 *      404: { description: Usuário não encontrado }
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/esqueci-senha:
 *  post:
 *    summary: Envia um código de 6 dígitos para o e-mail (vale 15 minutos)
 *    tags: [Auth]
 *    security: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email: { type: string }
 *    responses:
 *      200: { description: Resposta genérica (não revela se o e-mail existe) }
 *      429: { description: Pediu outro código há menos de 1 minuto }
 */
router.post("/esqueci-senha", authController.esqueciSenha);

/**
 * @swagger
 * /auth/verificar-codigo:
 *  post:
 *    summary: Confere o código recebido por e-mail
 *    tags: [Auth]
 *    security: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email: { type: string }
 *              codigo: { type: string }
 *    responses:
 *      200: { description: Código confirmado }
 *      400: { description: Código incorreto ou expirado }
 */
router.post("/verificar-codigo", authController.verificarCodigo);

/**
 * @swagger
 * /auth/redefinir-senha:
 *  post:
 *    summary: Troca a senha usando o código recebido por e-mail
 *    tags: [Auth]
 *    security: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email: { type: string }
 *              codigo: { type: string }
 *              nova_senha: { type: string }
 *    responses:
 *      200: { description: Senha alterada }
 *      400: { description: Código inválido ou senha curta }
 */
router.post("/redefinir-senha", authController.redefinirSenha);


/**
 * @swagger
 * /auth/cliente/registrar:
 *  post:
 *    summary: Cadastra um novo cliente
 *    tags: [Auth - Cliente]
 *    security: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [nome_completo, nome_usuario, email, cpf, senha]
 *            properties:
 *              nome_completo:
 *                type: string
 *              nome_usuario:
 *                type: string
 *              email:
 *                type: string
 *              cpf:
 *                type: string
 *              telefone:
 *                type: string
 *              data_nascimento:
 *                type: string
 *                format: date
 *              senha:
 *                type: string
 *              codigo_email:
 *                type: string
 *                description: Código de 6 dígitos enviado por /auth/cliente/codigo-cadastro
 *    responses:
 *      201:
 *        description: Cliente cadastrado com sucesso
 *      400:
 *        description: Dados obrigatórios faltando, email já cadastrado ou código do e-mail errado
 */
router.post("/cliente/registrar", authController.registrarCliente);

/**
 * @swagger
 * /auth/cliente/codigo-cadastro:
 *  post:
 *    summary: Envia um código para confirmar o e-mail antes do cadastro
 *    description: Confere se o e-mail é real (domínio que recebe e-mail, sem temporários) e se ainda não tem conta. O código pode ser conferido em /auth/verificar-codigo e é gasto em /auth/cliente/registrar (campo codigo_email).
 *    tags: [Auth - Cliente]
 *    security: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [email]
 *            properties:
 *              email:
 *                type: string
 *              nome:
 *                type: string
 *    responses:
 *      200:
 *        description: Código enviado
 *      400:
 *        description: E-mail inválido ou já cadastrado
 *      429:
 *        description: Pediu um código há menos de 1 minuto
 *      503:
 *        description: Não foi possível enviar o e-mail
 */
router.post("/cliente/codigo-cadastro", authController.codigoCadastro);

/**
 * @swagger
 * /auth/cliente/login:
 *  post:
 *    summary: Realiza login do cliente e retorna token JWT
 *    tags: [Auth - Cliente]
 *    security: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [email, senha]
 *            properties:
 *              email:
 *                type: string
 *              senha:
 *                type: string
 *    responses:
 *      200:
 *        description: Login realizado com sucesso
 *      401:
 *        description: Senha inválida
 *      404:
 *        description: Cliente não encontrado
 */
router.post("/cliente/login", authController.LoginCliente);

/**
 * @swagger
 * /auth/funcionario/registrar:
 *  post:
 *    summary: Cadastra um novo funcionário (exige token de funcionário; só o primeiro cadastro do sistema é liberado sem login)
 *    tags: [Auth - Funcionário]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [nome, email, senha]
 *            properties:
 *              nome:
 *                type: string
 *              cargo:
 *                type: string
 *              email:
 *                type: string
 *              telefone:
 *                type: string
 *              senha:
 *                type: string
 *    responses:
 *      201:
 *        description: Funcionario cadastrado com sucesso
 *      400:
 *        description: Dados obrigatórios faltando ou email já cadastrado
 *      401:
 *        description: Token não informado ou inválido
 *      403:
 *        description: Somente funcionários podem cadastrar outro funcionário
 */
router.post("/funcionario/registrar", protegerCadastroFuncionario, authController.registrarFuncionario);

/**
 * @swagger
 * /auth/funcionario/login:
 *  post:
 *    summary: Realiza login do funcionário e retorna token JWT
 *    tags: [Auth - Funcionário]
 *    security: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [email, senha]
 *            properties:
 *              email:
 *                type: string
 *              senha:
 *                type: string
 *    responses:
 *      200:
 *        description: Login realizado com sucesso
 *      401:
 *        description: Senha inválida
 *      403:
 *        description: Funcionário inativo, acesso negado
 *      404:
 *        description: Funcionario não encontrado
 */
router.post("/funcionario/login", authController.LoginFuncionario);


export default router;
