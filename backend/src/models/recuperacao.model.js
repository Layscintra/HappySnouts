import { conexao } from "../config/db.js";

export async function ultimoCodigo(email) {
    const [resultado] = await conexao.query(
        `SELECT * FROM recuperacao_senha
         WHERE email = ? AND usado = 0
         ORDER BY id_recuperacao DESC LIMIT 1`,
        [email]
    );
    return resultado[0];
}

export async function invalidarCodigos(email) {
    await conexao.query("UPDATE recuperacao_senha SET usado = 1 WHERE email = ? AND usado = 0", [email]);
}

export async function criarCodigo({ email, tipo_usuario, codigo_hash, minutos }) {
    await conexao.query(
        `INSERT INTO recuperacao_senha (email, tipo_usuario, codigo_hash, expira_em)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
        [email, tipo_usuario, codigo_hash, minutos]
    );
}

export async function somarTentativa(id_recuperacao) {
    await conexao.query("UPDATE recuperacao_senha SET tentativas = tentativas + 1 WHERE id_recuperacao = ?", [id_recuperacao]);
}

export async function marcarUsado(id_recuperacao) {
    await conexao.query("UPDATE recuperacao_senha SET usado = 1 WHERE id_recuperacao = ?", [id_recuperacao]);
}

export async function estaValido(id_recuperacao) {
    const [resultado] = await conexao.query(
        "SELECT expira_em > NOW() AS valido, TIMESTAMPDIFF(SECOND, criado_em, NOW()) AS idade FROM recuperacao_senha WHERE id_recuperacao = ?",
        [id_recuperacao]
    );
    return { valido: Boolean(resultado[0]?.valido), idadeSegundos: Number(resultado[0]?.idade ?? 0) };
}

export async function atualizarSenhaFuncionario(email, senha_hash) {
    const [resultado] = await conexao.query("UPDATE funcionarios SET senha_hash = ? WHERE email = ?", [senha_hash, email]);
    return resultado.affectedRows > 0;
}

export async function atualizarSenhaClientePorEmail(email, senha_hash) {
    const [resultado] = await conexao.query("UPDATE clientes SET senha_hash = ? WHERE email = ?", [senha_hash, email]);
    return resultado.affectedRows > 0;
}
