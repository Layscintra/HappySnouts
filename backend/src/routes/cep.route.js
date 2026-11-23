import { Router } from "express";
import * as cepController from "../controllers/cep.controller.js";

const router = Router();

/**
 * @swagger
 * /cep/{cep}:
 *  get:
 *    summary: Busca o endereço de um CEP (ViaCEP, com BrasilAPI de reserva)
 *    tags: [CEP]
 *    security: []
 *    parameters:
 *      - in: path
 *        name: cep
 *        required: true
 *        schema: { type: string, example: "01310-100" }
 *    responses:
 *      200:
 *        description: Endereço encontrado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                cep: { type: string }
 *                rua: { type: string }
 *                bairro: { type: string }
 *                cidade: { type: string }
 *                estado: { type: string }
 *      400: { description: CEP inválido }
 *      404: { description: CEP não encontrado }
 *      503: { description: Serviço de CEP indisponível }
 */
router.get("/:cep", cepController.consultar);

export default router;
