import { conexao } from "../config/db.js";

export const STATUS_PAGAMENTO = ["pendente", "aprovado", "recusado", "cancelado", "estornado"];

export const PROXIMOS_PAGAMENTO = {
    pendente: ["aprovado", "recusado", "cancelado"],
    recusado: ["pendente", "aprovado", "cancelado"],
    aprovado: ["estornado"],
    cancelado: [],
    estornado: []
};

export const ROTULO_PAGAMENTO = {
    pendente: "Aguardando pagamento",
    aprovado: "Pagamento aprovado",
    recusado: "Pagamento recusado",
    cancelado: "Pagamento cancelado",
    estornado: "Pagamento estornado"
};

export const JOIN_PAGAMENTO = `
    LEFT JOIN pagamentos_pedido pg ON pg.id_pedido = p.id_pedido
    LEFT JOIN formas_pagamento fp ON fp.id_forma_pagamento = pg.id_forma_pagamento
    LEFT JOIN cartoes ct ON ct.id_cartao = pg.id_cartao
`;

export const CAMPOS_PAGAMENTO = `
    pg.id_pagamento AS pg_id_pagamento, pg.status AS pg_status, pg.parcelas AS pg_parcelas, pg.valor AS pg_valor,
    pg.pix_copia_cola AS pg_pix_copia_cola, pg.pix_expira_em AS pg_pix_expira_em,
    pg.data_pagamento AS pg_data_pagamento, pg.data_criacao AS pg_data_criacao,
    fp.codigo AS pg_forma_codigo, fp.nome AS pg_forma_nome,
    pg.id_cartao AS pg_id_cartao, ct.destinatario AS pg_cartao_bandeira, ct.ultimos_digitos AS pg_cartao_final
`;

export function separarPagamento(linha) {
    const pedido = {};
    const pg = {};
    for (const [chave, valor] of Object.entries(linha)) {
        if (chave.startsWith("pg_")) pg[chave.slice(3)] = valor;
        else pedido[chave] = valor;
    }
    pedido.pagamento = pg.id_pagamento == null ? null : {
        id_pagamento: pg.id_pagamento,
        forma: pg.forma_codigo,
        forma_nome: pg.forma_nome,
        status: pg.status,
        status_rotulo: ROTULO_PAGAMENTO[pg.status],
        proximos_status: PROXIMOS_PAGAMENTO[pg.status] ?? [],
        parcelas: Number(pg.parcelas),
        valor: Number(pg.valor),
        cartao: pg.id_cartao == null && pg.cartao_final == null ? null : {
            id_cartao: pg.id_cartao,
            bandeira: pg.cartao_bandeira,
            ultimos_digitos: pg.cartao_final
        },
        pix_copia_cola: pg.pix_copia_cola,
        pix_expira_em: pg.pix_expira_em,
        data_pagamento: pg.data_pagamento,
        data_criacao: pg.data_criacao
    };
    return pedido;
}

export async function criarPagamento(con, { id_pedido, id_forma_pagamento, id_cartao, parcelas, valor, status, pix_copia_cola, pix_expira_em }) {
    const [resultado] = await con.query(
        `INSERT INTO pagamentos_pedido
            (id_pedido, id_forma_pagamento, id_cartao, parcelas, valor, status, pix_copia_cola, pix_expira_em, data_pagamento)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${status === "aprovado" ? "NOW()" : "NULL"})`,
        [id_pedido, id_forma_pagamento, id_cartao ?? null, parcelas ?? 1, valor, status, pix_copia_cola ?? null, pix_expira_em ?? null]
    );
    return resultado.insertId;
}

export async function atualizarStatus(id_pedido, status, con = conexao) {
    const [resultado] = await con.query(
        `UPDATE pagamentos_pedido
         SET status = ?,
             data_pagamento = CASE
                 WHEN ? = 'aprovado' THEN NOW()
                 WHEN ? = 'pendente' THEN NULL
                 ELSE data_pagamento
             END
         WHERE id_pedido = ?`,
        [status, status, status, id_pedido]
    );
    return resultado.affectedRows > 0;
}

export async function cancelarPorPedido(con, id_pedido) {
    await con.query(
        `UPDATE pagamentos_pedido
         SET status = CASE status WHEN 'aprovado' THEN 'estornado' ELSE 'cancelado' END
         WHERE id_pedido = ? AND status IN ('pendente', 'recusado', 'aprovado')`,
        [id_pedido]
    );
}
