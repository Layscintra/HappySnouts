import { conexao } from "../config/db.js";
import * as pagamentoPedidoModel from "./pagamentoPedido.model.js";
import { gerarPixCopiaECola, PIX_VALIDADE_MIN } from "../services/pix.service.js";

const CAMPOS_PEDIDO = `
    p.id_pedido, p.id_usuario, p.status, p.tipo_entrega, p.subtotal, p.frete, p.desconto, p.total,
    p.cupom, p.forma_pagamento, p.cep, p.estado, p.cidade, p.bairro, p.endereco, p.numero, p.apelido,
    p.codigo_rastreio, p.data_pedido, p.data_atualizacao,
    ${pagamentoPedidoModel.CAMPOS_PAGAMENTO}
`;

export async function criarPedidoDoCarrinho({ id_usuario, id_carrinho, itens, endereco, tipo_entrega, subtotal, frete, desconto, total, cupom, forma_pagamento, pagamento }) {
    const con = await conexao.getConnection();
    try {
        await con.beginTransaction();

        const [resultado] = await con.query(
            `INSERT INTO pedidos
                (id_usuario, status, tipo_entrega, subtotal, frete, desconto, total, cupom, forma_pagamento,
                 cep, estado, cidade, bairro, endereco, numero, apelido)
             VALUES (?, 'recebido', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_usuario, tipo_entrega, subtotal, frete, desconto, total, cupom ?? null, forma_pagamento ?? null,
                endereco.cep, endereco.estado, endereco.cidade, endereco.bairro, endereco.endereco, endereco.numero, endereco.apelido ?? null
            ]
        );
        const id_pedido = resultado.insertId;

        for (const item of itens) {
            await con.query(
                `INSERT INTO itens_pedido (id_pedido, id_produto, nome_produto, imagem_url, quantidade, preco_unico)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [id_pedido, item.id_produto, item.nome, item.imagem_url ?? null, item.quantidade, item.preco_unico]
            );
        }

        if (pagamento) {
            const ehPix = pagamento.forma.codigo === "pix";
            await pagamentoPedidoModel.criarPagamento(con, {
                id_pedido,
                id_forma_pagamento: pagamento.forma.id_forma_pagamento,
                id_cartao: pagamento.id_cartao,
                parcelas: pagamento.parcelas,
                valor: total,
                status: pagamento.forma.usa_cartao ? "aprovado" : "pendente",
                pix_copia_cola: ehPix ? gerarPixCopiaECola({ valor: total, id_pedido }) : null,
                pix_expira_em: ehPix ? new Date(Date.now() + PIX_VALIDADE_MIN * 60 * 1000) : null
            });
        }

        await con.query(
            "INSERT INTO pedido_historico (id_pedido, status, observacao) VALUES (?, 'recebido', 'Pedido recebido pela loja')",
            [id_pedido]
        );

        await con.query("DELETE FROM itens_carrinho WHERE id_carrinho = ?", [id_carrinho]);
        await con.query(
            `UPDATE carrinho SET id_endereco = NULL, tipo_entrega = NULL, cep_entrega = NULL, valor_frete = NULL
             WHERE id_carrinho = ?`,
            [id_carrinho]
        );

        await con.commit();
        return id_pedido;
    } catch (error) {
        await con.rollback();
        throw error;
    } finally {
        con.release();
    }
}

async function anexarDetalhes(linhas) {
    if (linhas.length === 0) return linhas;
    const pedidos = linhas.map(pagamentoPedidoModel.separarPagamento);
    const ids = pedidos.map((p) => p.id_pedido);
    const [itens] = await conexao.query(
        `SELECT id_pedido, id_produto, nome_produto AS nome, imagem_url, quantidade, preco_unico
         FROM itens_pedido WHERE id_pedido IN (?) ORDER BY id_item`,
        [ids]
    );
    const [historico] = await conexao.query(
        `SELECT h.id_pedido, h.status, h.observacao, h.data_hora, f.nome AS funcionario
         FROM pedido_historico h
         LEFT JOIN funcionarios f ON f.id_funcionario = h.id_funcionario
         WHERE h.id_pedido IN (?) ORDER BY h.data_hora, h.id_historico`,
        [ids]
    );
    return pedidos.map((pedido) => ({
        ...pedido,
        itens: itens.filter((i) => i.id_pedido === pedido.id_pedido),
        historico: historico.filter((h) => h.id_pedido === pedido.id_pedido)
    }));
}

export async function listarPorUsuario(id_usuario) {
    const [pedidos] = await conexao.query(
        `SELECT ${CAMPOS_PEDIDO} FROM pedidos p ${pagamentoPedidoModel.JOIN_PAGAMENTO} WHERE p.id_usuario = ? ORDER BY p.data_pedido DESC, p.id_pedido DESC`,
        [id_usuario]
    );
    return anexarDetalhes(pedidos);
}

export async function listarTodos({ status, pagamento } = {}) {
    const valores = [];
    const condicoes = [];
    if (status) {
        condicoes.push("p.status = ?");
        valores.push(status);
    }
    if (pagamento) {
        condicoes.push("pg.status = ?");
        valores.push(pagamento);
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
    const [pedidos] = await conexao.query(
        `SELECT ${CAMPOS_PEDIDO}, c.nome_completo AS cliente_nome, c.email AS cliente_email, c.telefone AS cliente_telefone
         FROM pedidos p
         JOIN clientes c ON c.Id_usuario = p.id_usuario
         ${pagamentoPedidoModel.JOIN_PAGAMENTO}
         ${where}
         ORDER BY p.data_pedido DESC, p.id_pedido DESC`,
        valores
    );
    return anexarDetalhes(pedidos);
}

export async function buscarPorId(id_pedido) {
    const [pedidos] = await conexao.query(
        `SELECT ${CAMPOS_PEDIDO}, c.nome_completo AS cliente_nome, c.email AS cliente_email, c.telefone AS cliente_telefone
         FROM pedidos p
         JOIN clientes c ON c.Id_usuario = p.id_usuario
         ${pagamentoPedidoModel.JOIN_PAGAMENTO}
         WHERE p.id_pedido = ?`,
        [id_pedido]
    );
    const [pedido] = await anexarDetalhes(pedidos);
    return pedido;
}

export async function atualizarStatus(id_pedido, { status, observacao, id_funcionario, codigo_rastreio }) {
    const con = await conexao.getConnection();
    try {
        await con.beginTransaction();
        await con.query(
            "UPDATE pedidos SET status = ?, codigo_rastreio = COALESCE(?, codigo_rastreio) WHERE id_pedido = ?",
            [status, codigo_rastreio || null, id_pedido]
        );
        await con.query(
            "INSERT INTO pedido_historico (id_pedido, status, observacao, id_funcionario) VALUES (?, ?, ?, ?)",
            [id_pedido, status, observacao || null, id_funcionario ?? null]
        );
        if (status === "cancelado") {
            await pagamentoPedidoModel.cancelarPorPedido(con, id_pedido);
        }
        await con.commit();
    } catch (error) {
        await con.rollback();
        throw error;
    } finally {
        con.release();
    }
}

export async function resumo() {
    const [porStatus] = await conexao.query("SELECT status, COUNT(*) AS total FROM pedidos GROUP BY status");
    const [[valores]] = await conexao.query(
        `SELECT
            COALESCE(SUM(CASE WHEN status <> 'cancelado' THEN total END), 0) AS faturamento,
            COALESCE(SUM(CASE WHEN status <> 'cancelado' AND DATE(data_pedido) = CURDATE() THEN total END), 0) AS faturamento_hoje,
            COUNT(CASE WHEN DATE(data_pedido) = CURDATE() THEN 1 END) AS pedidos_hoje
         FROM pedidos`
    );
    const contagem = { recebido: 0, em_preparacao: 0, enviado: 0, entregue: 0, cancelado: 0 };
    for (const linha of porStatus) contagem[linha.status] = Number(linha.total);

    const [porPagamento] = await conexao.query("SELECT status, COUNT(*) AS total FROM pagamentos_pedido GROUP BY status");
    const pagamentos = Object.fromEntries(pagamentoPedidoModel.STATUS_PAGAMENTO.map((s) => [s, 0]));
    for (const linha of porPagamento) pagamentos[linha.status] = Number(linha.total);

    return {
        por_status: contagem,
        pagamentos_por_status: pagamentos,
        faturamento: Number(valores.faturamento),
        faturamento_hoje: Number(valores.faturamento_hoje),
        pedidos_hoje: Number(valores.pedidos_hoje)
    };
}
