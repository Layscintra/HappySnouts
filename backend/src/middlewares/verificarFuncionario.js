export function verificarFuncionario(req, res, next) {
    if (req.usuario.tipo !== "funcionario") {
        return res.status(403).json({ msg: "Acesso restrito a funcionários" });
    }
    next();
}