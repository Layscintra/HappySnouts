import { conexao } from "../config/db.js";

const CAMPOS = "id_forma_pagamento, codigo, nome, usa_cartao, max_parcelas, ativo";

function formatar(forma) {
    if (!forma) return forma;
    return {
        ...forma,
        usa_cartao: Boolean(forma.usa_cartao),
        ativo: Boolean(forma.ativo),
        max_parcelas: Number(forma.max_parcelas)
    };
}

export async function listarAtivas() {
    const [resultado] = await conexao.query(
        `SELECT ${CAMPOS} FROM formas_pagamento WHERE ativo = 1 ORDER BY id_forma_pagamento`
    );
    return resultado.map(formatar);
}

export async function buscarPorCodigo(codigo) {
    const [resultado] = await conexao.query(
        `SELECT ${CAMPOS} FROM formas_pagamento WHERE codigo = ?`,
        [codigo]
    );
    return formatar(resultado[0]);
}
