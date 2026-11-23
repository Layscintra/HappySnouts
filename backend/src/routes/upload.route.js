import { Router } from "express";
import { autenticarToken } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/upload.js";

const router = Router();
router.use(autenticarToken);

/**
 * @swagger
 * /upload:
 *  post:
 *    summary: Envia uma imagem (JPG, PNG ou WEBP, até 2 MB) e devolve o caminho em /uploads
 *    tags: [Upload]
 *    requestBody:
 *      required: true
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            required: [imagem]
 *            properties:
 *              imagem:
 *                type: string
 *                format: binary
 *    responses:
 *      201:
 *        description: Imagem salva
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                caminho: { type: string, example: "/uploads/3f2a...png" }
 *      400: { description: Nenhuma imagem enviada, tipo não permitido ou arquivo grande demais }
 */
router.post("/", (req, res) => {
    upload.single("imagem")(req, res, (erro) => {
        if (erro) return res.status(400).json({ msg: erro.message });
        if (!req.file) return res.status(400).json({ msg: "Nenhuma imagem enviada" });
        return res.status(201).json({ caminho: `/uploads/${req.file.filename}` });
    });
});

export default router;
