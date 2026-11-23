export function verificarCliente(req, res, next) {
    if (req.usuario.tipo !== "cliente") {
        return res.status(403).json({ msg: "Acesso restrito a clientes" });
    }
    next();
}