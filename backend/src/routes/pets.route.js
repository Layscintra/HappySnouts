import { Router } from "express";
import * as PetController from "../controllers/pets.controller.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

const router = Router();
router.use(autenticarToken);

/**
 * @swagger
 * /pets:
 *  get:
 *    summary: Pets do usuário logado
 *    tags: [Pets]
 *    responses:
 *      200: { description: Lista de pets }
 *  post:
 *    summary: Cadastra um pet
 *    tags: [Pets]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [nome_pet, raca]
 *            properties:
 *              nome_pet: { type: string }
 *              raca: { type: string }
 *              idade_pet: { type: integer }
 *              peso_atual: { type: number }
 *              foto_url: { type: string, description: "Caminho retornado por POST /upload" }
 *    responses:
 *      201: { description: Pet cadastrado (retorna id) }
 *      400: { description: Nome do pet e raça são obrigatórios }
 */
router.get("/", PetController.listarPet);

/**
 * @swagger
 * /pets/{id_pet}:
 *  get:
 *    summary: Busca um pet pelo ID
 *    tags: [Pets]
 *    parameters:
 *      - in: path
 *        name: id_pet
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Pet encontrado }
 *      404: { description: Pet não encontrado }
 *  put:
 *    summary: Atualiza um pet (inclui vínculo com coleira e alimentador)
 *    tags: [Pets]
 *    parameters:
 *      - in: path
 *        name: id_pet
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [nome_pet, raca]
 *            properties:
 *              nome_pet: { type: string }
 *              raca: { type: string }
 *              idade_pet: { type: integer }
 *              peso_atual: { type: number }
 *              foto_url: { type: string }
 *              id_coleira: { type: integer, nullable: true }
 *              id_alimentador: { type: integer, nullable: true }
 *    responses:
 *      200: { description: Pet atualizado }
 *      400: { description: Nome do pet e raça são obrigatórios }
 *      404: { description: Pet não encontrado }
 *  delete:
 *    summary: Remove um pet
 *    tags: [Pets]
 *    parameters:
 *      - in: path
 *        name: id_pet
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Pet removido }
 *      404: { description: Pet não encontrado }
 */
router.get("/:id_pet", PetController.buscarPetPorId);
router.post("/", PetController.criarPet);
router.put("/:id_pet", PetController.atualizarPet);
router.delete("/:id_pet", PetController.deletarPet);

/**
 * @swagger
 * /pets/{id_pet}/pesos:
 *  get:
 *    summary: Histórico de peso do pet (mais antigo primeiro)
 *    description: O cadastro do pet e cada mudança de peso_atual (site ou app) entram aqui automaticamente.
 *    tags: [Pets]
 *    parameters:
 *      - in: path
 *        name: id_pet
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: "Lista de { id_peso, id_pet, peso, data_registro }" }
 *      404: { description: Pet não encontrado }
 *  post:
 *    summary: Registra uma pesagem (o peso_atual do pet vira o da pesagem mais recente)
 *    tags: [Pets]
 *    parameters:
 *      - in: path
 *        name: id_pet
 *        required: true
 *        schema: { type: integer }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required: [peso]
 *            properties:
 *              peso: { type: number, example: 4.1 }
 *              data_registro: { type: string, example: "2026-11-19", description: "Opcional; sem ela usa agora" }
 *    responses:
 *      201: { description: Pesagem registrada (retorna id) }
 *      400: { description: Peso ou data inválidos }
 *      404: { description: Pet não encontrado }
 * /pets/{id_pet}/pesos/{id_peso}:
 *  delete:
 *    summary: Remove uma pesagem do histórico
 *    tags: [Pets]
 *    parameters:
 *      - in: path
 *        name: id_pet
 *        required: true
 *        schema: { type: integer }
 *      - in: path
 *        name: id_peso
 *        required: true
 *        schema: { type: integer }
 *    responses:
 *      200: { description: Pesagem removida }
 *      404: { description: Pet ou pesagem não encontrados }
 */
router.get("/:id_pet/pesos", PetController.listarPesos);
router.post("/:id_pet/pesos", PetController.registrarPeso);
router.delete("/:id_pet/pesos/:id_peso", PetController.deletarPeso);

export default router;
