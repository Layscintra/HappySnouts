// Mesmos cupons do app (mobile/lib/data/mock_coupons.dart): se mudar aqui, mude lá também.

import { formatarPreco } from "./api.js";

export const CUPONS = [
  {
    codigo: "PRIMEIRACOMPRA",
    titulo: "Frete Grátis",
    descricao: "Frete grátis na sua primeira compra.",
    freteGratis: true,
    descontoPercentual: 0,
    pedidoMinimo: 0,
    validoAte: "2027-12-31"
  },
  {
    codigo: "AMIGOSNOUTS",
    titulo: "10% de desconto",
    descricao: "10% de desconto em pedidos acima de R$ 100,00.",
    freteGratis: false,
    descontoPercentual: 10,
    pedidoMinimo: 100,
    validoAte: "2027-06-30"
  }
];

const vencido = c => new Date(`${c.validoAte}T23:59:59`) < new Date();

export const cuponsDisponiveis = () => CUPONS.filter(c => !vencido(c));

// Desconto em reais (com 2 casas, como o app manda para o backend)
export const descontoDoCupom = (cupom, subtotal) =>
  cupom ? Number(((subtotal * cupom.descontoPercentual) / 100).toFixed(2)) : 0;

export function validarCupom(codigo, subtotal) {
  const normalizado = String(codigo || "")
    .trim()
    .toUpperCase();
  if (!normalizado) return { erro: "Digite o código do cupom." };
  const cupom = CUPONS.find(c => c.codigo === normalizado);
  if (!cupom) return { erro: "Cupom não encontrado." };
  if (vencido(cupom)) return { erro: "Este cupom expirou." };
  if (subtotal < cupom.pedidoMinimo)
    return { erro: `Cupom válido para pedidos a partir de ${formatarPreco(cupom.pedidoMinimo)}.` };
  return { cupom };
}
