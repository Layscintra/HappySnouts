import { api, ENDPOINTS, lerErro } from "./api.js";

// tipos de compromisso (os mesmos do backend e do app)
export const TIPOS = {
  vacina: { nome: "Vacina", emoji: "💉", cor: "#2FA84F", exemplo: "Ex.: Vacina V10" },
  consulta: { nome: "Consulta", emoji: "🩺", cor: "#2C5282", exemplo: "Ex.: Consulta com a Dra. Ana" },
  banho: { nome: "Banho e tosa", emoji: "🛁", cor: "#2F9BB5", exemplo: "Ex.: Banho e tosa no petshop" },
  remedio: { nome: "Medicamento", emoji: "💊", cor: "#FF7A00", exemplo: "Ex.: Vermífugo, 1 comprimido" },
  outro: { nome: "Outro", emoji: "🐾", cor: "#8A7565", exemplo: "Ex.: Comprar ração" }
};
export const tipoDe = t => TIPOS[t] || TIPOS.outro;

export const dois = n => String(n).padStart(2, "0");
export const chaveMes = d => `${d.getFullYear()}-${dois(d.getMonth() + 1)}`;
export const chaveDia = d => `${chaveMes(d)}-${dois(d.getDate())}`;
export const mesmoDia = (a, b) => chaveDia(a) === chaveDia(b);
export const hora = d => `${dois(d.getHours())}:${dois(d.getMinutes())}`;
// o backend devolve "2026-09-10T13:00:00.000Z" ou "2026-09-10 10:00:00"
export const lerData = v => new Date(typeof v === "string" && !/[TZ]/.test(v) ? v.replace(" ", "T") : v);
// "2026-09-10" (do link) -> data local, sem pular de dia por causa do fuso
export const diaDaChave = k => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k || "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
export const dataLonga = d => d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
export const dataBr = d => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
export const dataCurta = d => {
  const hoje = new Date();
  const amanha = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
  const ontem = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1);
  if (mesmoDia(d, hoje)) return "Hoje";
  if (mesmoDia(d, amanha)) return "Amanhã";
  if (mesmoDia(d, ontem)) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export const normalizarLembrete = l => ({
  id: Number(l.id_lembrete),
  idPet: Number(l.id_pet),
  pet: l.nome_pet || "",
  titulo: l.titulo || "",
  tipo: TIPOS[l.tipo] ? l.tipo : "outro",
  descricao: l.descricao || "",
  quando: lerData(l.data_hora),
  recorrente: Boolean(Number(l.recorrente)),
  concluido: Boolean(Number(l.concluido))
});

export const formatarPeso = kg => `${Number(kg).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg`;

export const normalizarPeso = p => ({ id: Number(p.id_peso), peso: Number(p.peso), quando: lerData(p.data_registro) });

// Histórico de peso do pet (mais antigo primeiro).
// Backend antigo, sem a rota de histórico (404): devolve null e a tela usa o peso_atual do pet.
export async function buscarPesos(idPet) {
  const resp = await api(`${ENDPOINTS.pets}/${idPet}/pesos`);
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(await lerErro(resp, "Não foi possível carregar o histórico de peso."));
  return (await resp.json()).map(normalizarPeso);
}

export function linkAgenda({ pet, data, evento, novo } = {}) {
  const q = new URLSearchParams();
  if (pet) q.set("pet", pet);
  if (data) q.set("data", data instanceof Date ? chaveDia(data) : data);
  if (evento) q.set("evento", evento);
  if (novo) q.set("novo", novo);
  const s = q.toString();
  return `/calendario${s ? "?" + s : ""}`;
}
export const linkPeso = pet => `/peso${pet ? "?pet=" + pet : ""}`;
