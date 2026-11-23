import { Router } from "express";
import * as lembretesController from "../controllers/lembretes.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";
import { verificarCliente } from "../middlewares/verificarCliente.js";

const router = Router();
router.use(autenticarToken);
router.use(verificarCliente);

/**
 * @swagger
 * /lembretes:
 *  get:
 *    summary: Lembretes do cliente no mês (sem ?mes usa o mês atual)
 *    tags: [Lembretes]
 *    parameters:
 *      - in: query
 *        name: mes
 *        schema: { type: string, example: "2026-09" }
 *        description: Mês no formato AAAA-MM
 *    responses:
 *      200: { description: Lista de lembretes }
 *      400: { description: mes fora do formato AAAA-MM }
 *  post:
 *    summary: Cria um lembrete para um pet do cliente
 *    tags: [Lembretes]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [id_pet, titulo, tipo, data_hora]
 *            properties:
 *              id_pet: { type: integer }
 *              titulo: { type: string, maxLength: 100 }
 *              tipo: { type: string, enum: [remedio, banho, vacina, consulta, outro] }
 *              cor: { type: string, example: "#E57373" }
 *              descricao: { type: string, maxLength: 150 }
 *              data_hora: { type: string, example: "2026-09-10 10:00:00" }
 *              recorrente: { type: boolean }
 *    responses:
 *      201: { description: Lembrete cadastrado (retorna id) }
 *      400: { description: Dados inválidos }
 *      404: { description: Pet não encontrado }
 */
router.get("/", lembretesController.listarLembretes);

/**
 * @swagger
 * /lembretes/proximos:
 *  get:
 *    summary: Próximos lembretes pendentes
 *    tags: [Lembretes]
 *    parameters:
 *      - in: query
 *        name: limite
 *        schema: { type: integer, default: 5 }
 *    responses:
 *      200: { description: Lista de lembretes }
 */
router.get("/proximos", lembretesController.listarProximos);

/**
 * @swagger
 * /lembretes/{id_lembrete}:
 *  get:
 *    summary: Busca um lembrete pelo ID
 *    tags: [Lembretes]
 *    parameters:
 *      - in: path
 *        name: id_lembrete
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Lembrete encontrado }
 *      404: { description: Lembrete não encontrado }
 *  put:
 *    summary: Atualiza um lembrete (envie só os campos que mudaram)
 *    tags: [Lembretes]
 *    parameters:
 *      - in: path
 *        name: id_lembrete
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              titulo: { type: string, maxLength: 100 }
 *              tipo: { type: string, enum: [remedio, banho, vacina, consulta, outro] }
 *              cor: { type: string, example: "#E57373" }
 *              descricao: { type: string, maxLength: 150 }
 *              data_hora: { type: string, example: "2026-09-10 10:00:00" }
 *              recorrente: { type: boolean }
 *    responses:
 *      200: { description: Lembrete atualizado }
 *      400: { description: Dados inválidos ou nenhum campo para atualizar }
 *      404: { description: Lembrete não encontrado }
 *  delete:
 *    summary: Remove um lembrete
 *    tags: [Lembretes]
 *    parameters:
 *      - in: path
 *        name: id_lembrete
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Lembrete removido }
 *      404: { description: Lembrete não encontrado }
 */
router.get("/:id_lembrete", lembretesController.buscarLembretePorId);
router.post("/", lembretesController.criarLembrete);
router.put("/:id_lembrete", lembretesController.atualizarLembrete);

/**
 * @swagger
 * /lembretes/{id_lembrete}/concluir:
 *  patch:
 *    summary: Marca um lembrete como concluído
 *    tags: [Lembretes]
 *    parameters:
 *      - in: path
 *        name: id_lembrete
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Lembrete concluído }
 *      404: { description: Lembrete não encontrado }
 */
router.patch("/:id_lembrete/concluir", lembretesController.concluirLembrete);
router.delete("/:id_lembrete", lembretesController.deletarLembrete);

export default router;
