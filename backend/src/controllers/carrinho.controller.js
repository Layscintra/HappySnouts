import * as carrinhoModel from "../models/carrinho.model.js";
import * as produtosModel from "../models/produtos.model.js";
import * as pedidoModel from "../models/pedido.model.js";
import { numeroPedido } from "./pedido.controller.js";
import { notificarCliente } from "../services/notificacao.service.js";
import * as formasPagamentoModel from "../models/formasPagamento.model.js";
import * as cartoesModel from "../models/cartoes.model.js";

const FRETE = { normal: 10, rapida: 20 };

async function resolverPagamento(body, id_usuario) {
    const enviado = body.forma_pagamento == null ? "" : String(body.forma_pagamento).trim();
    if (!enviado) return { pagamento: null, descricao: null };

    let forma = await formasPagamentoModel.buscarPorCodigo(enviado);
    let id_cartao = body.id_cartao;
    let parcelas = body.parcelas;

    if (!forma) {
        const texto = enviado.toLowerCase();
        const final = enviado.match(/(?:•{2,}|final)\s*(\d{4})/i)?.[1];
        let codigo = null;
        if (texto.startsWith("pix")) codigo = "pix";
        else if (texto.startsWith("boleto")) codigo = "boleto";
        else if (final) codigo = texto.includes("débito") || texto.includes("debito") ? "cartao_debito" : "cartao_credito";

        if (!codigo) {
            return { erro: "forma_pagamento inválida. Use pix, cartao_credito, cartao_debito ou boleto." };
        }
        forma = await formasPagamentoModel.buscarPorCodigo(codigo);
        if (final && id_cartao == null) {
            const cartoes = await cartoesModel.listarCartoesPorUsuario(id_usuario);
            const doFinal = cartoes.filter((c) => c.ultimos_digitos === final);
            const cartao = doFinal.find((c) => texto.startsWith(String(c.destinatario).toLowerCase())) ?? doFinal[0];
            id_cartao = cartao?.id_cartao;
        }
        if (parcelas == null) parcelas = Number(enviado.match(/(\d+)\s*[×x]/)?.[1]) || 1;
    }

    if (!forma || !forma.ativo) {
        return { erro: "Essa forma de pagamento não está disponível." };
    }

    parcelas = parcelas == null ? 1 : Number(parcelas);
    if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > forma.max_parcelas) {
        return {
            erro: forma.max_parcelas === 1
                ? `${forma.nome} é só à vista (1 parcela).`
                : `${forma.nome}: escolha de 1 a ${forma.max_parcelas} parcelas.`
        };
    }

    let cartao = null;
    if (forma.usa_cartao) {
        if (id_cartao == null) {
            return { erro: "Escolha o cartão (id_cartao) para pagar com cartão." };
        }
        cartao = await cartoesModel.buscarCartaoPorId(id_cartao, id_usuario);
        if (!cartao) {
            return { erro: "Cartão não encontrado." };
        }
    }

    const descricao = cartao
        ? `${forma.nome} ${cartao.destinatario} final ${cartao.ultimos_digitos} - ${parcelas > 1 ? `${parcelas}x sem juros` : "à vista"}`
        : forma.nome;

    return {
        pagamento: { forma, id_cartao: cartao?.id_cartao ?? null, parcelas },
        descricao
    };
}

function quantidadeValida(quantidade) {
    const qtd = Number(quantidade);
    return Number.isInteger(qtd) && qtd > 0 ? qtd : null;
}

async function montarCarrinho(carrinho) {
    const itens = await carrinhoModel.listarItens(carrinho.id_carrinho);

    const itensFormatados = itens.map((item) => ({
        id_produto: item.id_produto,
        nome: item.nome,
        imagem_url: item.imagem_url,
        ativo: Boolean(item.ativo),
        quantidade: item.quantidade,
        preco_unico: Number(item.preco_unico),
        subtotal: Number(item.preco_unico) * item.quantidade
    }));

    const subtotal = itensFormatados.reduce((soma, item) => soma + item.subtotal, 0);
    const frete = Number(carrinho.valor_frete ?? 0);

    return {
        id_carrinho: carrinho.id_carrinho,
        id_endereco: carrinho.id_endereco,
        tipo_entrega: carrinho.tipo_entrega,
        cep_entrega: carrinho.cep_entrega,
        itens: itensFormatados,
        subtotal,
        frete,
        total: subtotal + frete
    };
}

export async function verCarrinho(req, res) {
    try {
        const carrinho = await carrinhoModel.obterOuCriarCarrinho(req.usuario.id);
        return res.status(200).json(await montarCarrinho(carrinho));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao buscar carrinho", erro: error.message });
    }
}

export async function adicionarItem(req, res) {
    try {
        const { id_produto, quantidade } = req.body;
        const qtd = quantidadeValida(quantidade);

        if (!id_produto || !qtd) {
            return res.status(400).json({ msg: "id_produto e quantidade (inteiro maior que 0) são obrigatórios." });
        }

        const produto = await produtosModel.buscarProdutoPorId(id_produto);

        if (!produto || !produto.ativo) {
            return res.status(404).json({ msg: "Produto não encontrado" });
        }

        const preco = produto.preco_promocional ?? produto.preco;
        const carrinho = await carrinhoModel.obterOuCriarCarrinho(req.usuario.id);

        await carrinhoModel.adicionarItem(carrinho.id_carrinho, produto.id_produto, qtd, preco);

        return res.status(201).json({ msg: "Item adicionado ao carrinho" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao adicionar item", erro: error.message });
    }
}

export async function atualizarQuantidade(req, res) {
    try {
        const { id_produto } = req.params;
        const qtd = quantidadeValida(req.body.quantidade);

        if (!qtd) {
            return res.status(400).json({ msg: "quantidade deve ser um inteiro maior que 0. Para remover, use DELETE." });
        }

        const carrinho = await carrinhoModel.obterOuCriarCarrinho(req.usuario.id);
        const item = await carrinhoModel.buscarItem(carrinho.id_carrinho, id_produto);

        if (!item) {
            return res.status(404).json({ msg: "Item não encontrado no carrinho" });
        }

        await carrinhoModel.atualizarQuantidade(carrinho.id_carrinho, id_produto, qtd);

        return res.status(200).json({ msg: "Quantidade atualizada" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar quantidade", erro: error.message });
    }
}

export async function removerItem(req, res) {
    try {
        const { id_produto } = req.params;
        const carrinho = await carrinhoModel.obterOuCriarCarrinho(req.usuario.id);

        const removido = await carrinhoModel.removerItem(carrinho.id_carrinho, id_produto);

        if (!removido) {
            return res.status(404).json({ msg: "Item não encontrado no carrinho" });
        }

        return res.status(200).json({ msg: "Item removido" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao remover item", erro: error.message });
    }
}

export async function limparCarrinho(req, res) {
    try {
        const carrinho = await carrinhoModel.obterOuCriarCarrinho(req.usuario.id);
        await carrinhoModel.limparCarrinho(carrinho.id_carrinho);

        return res.status(200).json({ msg: "Carrinho esvaziado" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao esvaziar carrinho", erro: error.message });
    }
}

export async function definirEntrega(req, res) {
    try {
        const { id_endereco, tipo_entrega } = req.body;

        if (!id_endereco || !tipo_entrega) {
            return res.status(400).json({ msg: "id_endereco e tipo_entrega são obrigatórios." });
        }

        if (!(tipo_entrega in FRETE)) {
            return res.status(400).json({ msg: "tipo_entrega deve ser 'rapida' ou 'normal'." });
        }

        const endereco = await carrinhoModel.buscarEnderecoDoUsuario(id_endereco, req.usuario.id);

        if (!endereco) {
            return res.status(404).json({ msg: "Endereço não encontrado" });
        }

        const carrinho = await carrinhoModel.obterOuCriarCarrinho(req.usuario.id);

        await carrinhoModel.definirEntrega(carrinho.id_carrinho, {
            id_endereco: endereco.id_endereco,
            cep_entrega: endereco.cep,
            tipo_entrega,
            valor_frete: FRETE[tipo_entrega]
        });

        return res.status(200).json({ msg: "Entrega definida", frete: FRETE[tipo_entrega] });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao definir entrega", erro: error.message });
    }
}

export async function finalizarCompra(req, res) {
    try {
        const carrinho = await carrinhoModel.obterOuCriarCarrinho(req.usuario.id);
        const dados = await montarCarrinho(carrinho);

        if (dados.itens.length === 0) {
            return res.status(400).json({ msg: "Carrinho vazio" });
        }

        if (!carrinho.id_endereco || !carrinho.tipo_entrega) {
            return res.status(400).json({ msg: "Defina o endereço e o tipo de entrega antes de finalizar" });
        }

        const inativos = dados.itens.filter((item) => !item.ativo);

        if (inativos.length > 0) {
            return res.status(400).json({
                msg: "Alguns produtos não estão mais disponíveis",
                produtos: inativos.map((item) => item.nome)
            });
        }

        const endereco = await carrinhoModel.buscarEnderecoDoUsuario(carrinho.id_endereco, req.usuario.id);
        if (!endereco) {
            return res.status(400).json({ msg: "O endereço de entrega não existe mais. Escolha outro." });
        }

        const { cupom, frete_gratis } = req.body ?? {};
        const desconto = Math.min(Math.max(Number(req.body?.desconto) || 0, 0), dados.subtotal);
        const frete = frete_gratis ? 0 : dados.frete;
        const total = Math.max(dados.subtotal + frete - desconto, 0);

        const { pagamento, descricao, erro } = await resolverPagamento(req.body ?? {}, req.usuario.id);
        if (erro) {
            return res.status(400).json({ msg: erro });
        }

        const id_pedido = await pedidoModel.criarPedidoDoCarrinho({
            id_usuario: req.usuario.id,
            id_carrinho: carrinho.id_carrinho,
            itens: dados.itens,
            endereco,
            tipo_entrega: carrinho.tipo_entrega,
            subtotal: dados.subtotal,
            frete,
            desconto,
            total,
            cupom: cupom ? String(cupom).slice(0, 30) : null,
            forma_pagamento: descricao ? descricao.slice(0, 100) : null,
            pagamento
        });

        const numero = numeroPedido(id_pedido);
        const reais = (v) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
        const registroPagamento = (await pedidoModel.buscarPorId(id_pedido))?.pagamento ?? null;
        const linhaPagamento = !registroPagamento
            ? null
            : registroPagamento.pix_copia_cola
                ? `Pagamento: Pix (aguardando). Pix copia e cola:\n${registroPagamento.pix_copia_cola}`
                : `Pagamento: ${descricao} - ${registroPagamento.status_rotulo.toLowerCase()}.`;
        await notificarCliente(req.usuario.id, {
            titulo: `Pedido ${numero} recebido!`,
            mensagem: `Recebemos seu pedido de ${reais(total)}. Avisaremos a cada etapa da entrega.`,
            tipo: "pedido",
            referencia_id: id_pedido,
            email: {
                assunto: `Recebemos seu pedido ${numero} 🐾`,
                titulo: `Pedido ${numero} confirmado`,
                paragrafos: [
                    "Seu pedido foi recebido e já está com a nossa equipe.",
                    dados.itens.map((i) => `${i.quantidade}× ${i.nome} - ${reais(i.subtotal)}`).join("\n"),
                    `Subtotal: ${reais(dados.subtotal)}\nFrete: ${frete === 0 ? "Grátis" : reais(frete)}${desconto > 0 ? `\nDesconto: -${reais(desconto)}` : ""}\nTotal: ${reais(total)}`,
                    `Entrega em: ${endereco.endereco}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade}/${endereco.estado}`,
                    linhaPagamento,
                    "Você recebe um aviso no app e por e-mail sempre que o status mudar."
                ].filter(Boolean)
            }
        });

        return res.status(200).json({
            msg: "Compra finalizada com sucesso",
            id_pedido,
            numero,
            pagamento: registroPagamento,
            resumo: { ...dados, frete, desconto, total }
        });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao finalizar compra", erro: error.message });
    }
}