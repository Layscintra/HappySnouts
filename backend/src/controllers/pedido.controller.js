import * as pedidoModel from "../models/pedido.model.js";
import * as pagamentoPedidoModel from "../models/pagamentoPedido.model.js";
import { notificarCliente } from "../services/notificacao.service.js";

export const STATUS = ["recebido", "em_preparacao", "enviado", "entregue", "cancelado"];

const ROTULO = {
    recebido: "Pedido recebido",
    em_preparacao: "Em preparação",
    enviado: "A caminho",
    entregue: "Entregue",
    cancelado: "Cancelado"
};

const PROXIMOS = {
    recebido: ["em_preparacao", "enviado", "cancelado"],
    em_preparacao: ["enviado", "cancelado"],
    enviado: ["entregue"],
    entregue: [],
    cancelado: []
};

const MENSAGEM_CLIENTE = {
    em_preparacao: "Seu pedido está sendo separado e embalado com carinho. 📦",
    enviado: "Seu pedido saiu para entrega e já está a caminho! 🚚",
    entregue: "Seu pedido foi entregue. Esperamos que seu pet aproveite! 🐾",
    cancelado: "Seu pedido foi cancelado. Se tiver dúvidas, fale com a gente pelo Fale conosco."
};

export function numeroPedido(id) {
    return `#${String(id).padStart(5, "0")}`;
}

function formatar(pedido) {
    if (!pedido) return pedido;
    const numero = (v) => Number(v ?? 0);
    return {
        ...pedido,
        numero_pedido: numeroPedido(pedido.id_pedido),
        status_rotulo: ROTULO[pedido.status],
        proximos_status: PROXIMOS[pedido.status],
        subtotal: numero(pedido.subtotal),
        frete: numero(pedido.frete),
        desconto: numero(pedido.desconto),
        total: numero(pedido.total),
        itens: (pedido.itens || []).map((item) => ({ ...item, preco_unico: numero(item.preco_unico) }))
    };
}

export async function listarMeusPedidos(req, res) {
    try {
        const pedidos = await pedidoModel.listarPorUsuario(req.usuario.id);
        return res.status(200).json(pedidos.map(formatar));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar pedidos", erro: error.message });
    }
}

export async function buscarPedido(req, res) {
    try {
        const pedido = await pedidoModel.buscarPorId(req.params.id_pedido);
        const ehDono = pedido && req.usuario.tipo === "cliente" && Number(pedido.id_usuario) === Number(req.usuario.id);
        if (!pedido || (!ehDono && req.usuario.tipo !== "funcionario")) {
            return res.status(404).json({ msg: "Pedido não encontrado" });
        }
        return res.status(200).json(formatar(pedido));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao buscar pedido", erro: error.message });
    }
}

export async function cancelarMeuPedido(req, res) {
    try {
        const pedido = await pedidoModel.buscarPorId(req.params.id_pedido);
        if (!pedido || Number(pedido.id_usuario) !== Number(req.usuario.id)) {
            return res.status(404).json({ msg: "Pedido não encontrado" });
        }
        if (!["recebido", "em_preparacao"].includes(pedido.status)) {
            return res.status(400).json({ msg: "Esse pedido já saiu para entrega e não pode mais ser cancelado." });
        }
        await pedidoModel.atualizarStatus(pedido.id_pedido, { status: "cancelado", observacao: "Cancelado pelo cliente" });
        await notificarCliente(pedido.id_usuario, {
            titulo: `Pedido ${numeroPedido(pedido.id_pedido)} cancelado`,
            mensagem: "Você cancelou este pedido. Se foi engano, é só fazer um novo pedido.",
            tipo: "pedido",
            referencia_id: pedido.id_pedido,
            email: {}
        });
        return res.status(200).json(formatar(await pedidoModel.buscarPorId(pedido.id_pedido)));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao cancelar pedido", erro: error.message });
    }
}

export async function listarTodosPedidos(req, res) {
    try {
        const { status } = req.query;
        if (status && !STATUS.includes(status)) {
            return res.status(400).json({ msg: "Status inválido" });
        }
        const { pagamento } = req.query;
        if (pagamento && !pagamentoPedidoModel.STATUS_PAGAMENTO.includes(pagamento)) {
            return res.status(400).json({ msg: "Status de pagamento inválido" });
        }
        const pedidos = await pedidoModel.listarTodos({ status, pagamento });
        return res.status(200).json(pedidos.map(formatar));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar pedidos", erro: error.message });
    }
}

export async function resumoPedidos(req, res) {
    try {
        return res.status(200).json(await pedidoModel.resumo());
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao carregar o resumo", erro: error.message });
    }
}

const MENSAGEM_PAGAMENTO = {
    aprovado: "Recebemos o seu pagamento. Obrigado! 💚",
    recusado: "O pagamento não foi aprovado. Fale com a gente pelo Fale conosco para resolver.",
    pendente: "O pagamento voltou a ficar pendente. Se já pagou, fale com a gente pelo Fale conosco.",
    cancelado: "O pagamento deste pedido foi cancelado.",
    estornado: "O valor do pagamento foi estornado."
};

export async function atualizarPagamentoPedido(req, res) {
    try {
        const { status } = req.body ?? {};
        const { STATUS_PAGAMENTO, PROXIMOS_PAGAMENTO, ROTULO_PAGAMENTO } = pagamentoPedidoModel;
        if (!STATUS_PAGAMENTO.includes(status)) {
            return res.status(400).json({ msg: `status deve ser um destes: ${STATUS_PAGAMENTO.join(", ")}` });
        }

        const pedido = await pedidoModel.buscarPorId(req.params.id_pedido);
        if (!pedido) {
            return res.status(404).json({ msg: "Pedido não encontrado" });
        }
        if (!pedido.pagamento) {
            return res.status(400).json({ msg: "Este pedido não tem registro de pagamento." });
        }
        if (!PROXIMOS_PAGAMENTO[pedido.pagamento.status].includes(status)) {
            return res.status(400).json({
                msg: `Um pagamento "${ROTULO_PAGAMENTO[pedido.pagamento.status]}" não pode ir para "${ROTULO_PAGAMENTO[status]}".`
            });
        }

        await pagamentoPedidoModel.atualizarStatus(pedido.id_pedido, status);

        const numero = numeroPedido(pedido.id_pedido);
        await notificarCliente(pedido.id_usuario, {
            titulo: `Pedido ${numero}: ${ROTULO_PAGAMENTO[status].toLowerCase()}`,
            mensagem: MENSAGEM_PAGAMENTO[status],
            tipo: "pedido",
            referencia_id: pedido.id_pedido,
            email: {
                assunto: `Pedido ${numero} - ${ROTULO_PAGAMENTO[status]}`,
                titulo: `Pedido ${numero}: ${ROTULO_PAGAMENTO[status]}`,
                paragrafos: [MENSAGEM_PAGAMENTO[status], "Acompanhe tudo em Perfil > Meus Pedidos no app."]
            }
        });

        return res.status(200).json(formatar(await pedidoModel.buscarPorId(pedido.id_pedido)));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar o pagamento", erro: error.message });
    }
}

export async function atualizarStatusPedido(req, res) {
    try {
        const { status, observacao, codigo_rastreio } = req.body;
        if (!STATUS.includes(status)) {
            return res.status(400).json({ msg: `status deve ser um destes: ${STATUS.join(", ")}` });
        }

        const pedido = await pedidoModel.buscarPorId(req.params.id_pedido);
        if (!pedido) {
            return res.status(404).json({ msg: "Pedido não encontrado" });
        }
        if (!PROXIMOS[pedido.status].includes(status)) {
            return res.status(400).json({
                msg: `Um pedido "${ROTULO[pedido.status]}" não pode ir para "${ROTULO[status]}".`
            });
        }

        await pedidoModel.atualizarStatus(pedido.id_pedido, {
            status,
            observacao: observacao?.trim() || null,
            id_funcionario: req.usuario.id,
            codigo_rastreio: codigo_rastreio?.trim()
        });

        const numero = numeroPedido(pedido.id_pedido);
        const extra = [observacao?.trim(), codigo_rastreio?.trim() ? `Código de rastreio: ${codigo_rastreio.trim()}` : null].filter(Boolean);
        await notificarCliente(pedido.id_usuario, {
            titulo: `Pedido ${numero}: ${ROTULO[status].toLowerCase()}`,
            mensagem: [MENSAGEM_CLIENTE[status], ...extra].join(" "),
            tipo: "pedido",
            referencia_id: pedido.id_pedido,
            email: {
                assunto: `Seu pedido ${numero} - ${ROTULO[status]}`,
                titulo: `Pedido ${numero}: ${ROTULO[status]}`,
                paragrafos: [MENSAGEM_CLIENTE[status], ...extra, "Acompanhe tudo em Perfil > Meus Pedidos no app."]
            }
        });

        return res.status(200).json(formatar(await pedidoModel.buscarPorId(pedido.id_pedido)));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar o pedido", erro: error.message });
    }
}
