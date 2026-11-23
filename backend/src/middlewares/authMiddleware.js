import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

export function autenticarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ mensagem: "Token não informado" });
  }

  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ mensagem: "Formato do token inválido" });
  }

  try {
    const payload = jwt.verify(token, jwtConfig.secret);
    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({ mensagem: "Token inválido ou expirado" });
  }
}

export function autenticarOpcional(req, res, next) {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo === "Bearer" && token) {
    try {
      req.usuario = jwt.verify(token, jwtConfig.secret);
    } catch {
    }
  }
  next();
}