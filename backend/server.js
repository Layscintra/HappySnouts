import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import app from "./src/app.js";

dotenv.config()

const port = process.env.PORT || 5000;

/**
 * @swagger
 * /:
 *  get:
 *      summary: Rota inicial da API
 *      tags: [inicial]
 *      responses:
 *         200:
 *             description: API funcionando
 */

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, ()=>{
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Documentação em http://localhost:${port}/api-docs`);
});








