
const TEMPO_LIMITE_MS = 6000;

async function buscarJson(url) {
    const resposta = await fetch(url, { signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
    return { status: resposta.status, dados: await resposta.json().catch(() => null) };
}

async function viaCep(cep) {
    const { status, dados } = await buscarJson(`https://viacep.com.br/ws/${cep}/json/`);
    if (status !== 200 || !dados) throw new Error("ViaCEP indisponível");
    if (dados.erro) return null;
    return {
        cep: dados.cep,
        rua: dados.logradouro || "",
        bairro: dados.bairro || "",
        cidade: dados.localidade || "",
        estado: dados.uf || ""
    };
}

async function brasilApi(cep) {
    const { status, dados } = await buscarJson(`https://brasilapi.com.br/api/cep/v1/${cep}`);
    if (status === 404) return null;
    if (status !== 200 || !dados) throw new Error("BrasilAPI indisponível");
    return {
        cep: `${cep.slice(0, 5)}-${cep.slice(5)}`,
        rua: dados.street || "",
        bairro: dados.neighborhood || "",
        cidade: dados.city || "",
        estado: dados.state || ""
    };
}

export async function buscarCep(cep) {
    try {
        return await viaCep(cep);
    } catch {
        return await brasilApi(cep);
    }
}
