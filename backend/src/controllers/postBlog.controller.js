import * as postBlogModel from "../models/postBlog.model.js";
import * as categoriaBlogModel from "../models/categoriaBlog.model.js";

function calcularTempoLeitura(texto) {
    const palavras = texto.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(palavras / 200));
}

const TITULO_MIN = 5, TITULO_MAX = 120;
const TEXTO_MIN = 30, TEXTO_MAX = 2000;

function gerarResumo(texto) {
    const limpo = String(texto).replace(/\s+/g, " ").trim();
    if (limpo.length <= 200) return limpo;
    return limpo.slice(0, 200).replace(/\s+\S*$/, "") + "…";
}

function validarTitulo(titulo) {
    const t = String(titulo ?? "").trim();
    if (t.length < TITULO_MIN || t.length > TITULO_MAX) return `O título deve ter de ${TITULO_MIN} a ${TITULO_MAX} caracteres`;
    return null;
}

function validarTexto(texto) {
    const t = String(texto ?? "").trim();
    if (t.length < TEXTO_MIN || t.length > TEXTO_MAX) return `O texto deve ter de ${TEXTO_MIN} a ${TEXTO_MAX} caracteres`;
    return null;
}

export async function listarTdPosts(req, res) {
    try {
        const posts = await postBlogModel.listarTdPosts();
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar posts", erro: error.message });
    }
}

export async function listarPosts(req, res) {
    try {
        const { categoria, busca } = req.query;
        const id_leitor = req.usuario?.tipo === "cliente" ? req.usuario.id : null;
        const id_autor = req.query.meus === "1" && id_leitor ? id_leitor : undefined;
        const curtidos = req.query.curtidos === "1" && id_leitor != null;
        const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
        const limite = Math.min(50, Math.max(1, parseInt(req.query.limite) || 10));

        const posts = await postBlogModel.listarPosts({ categoria, limite, pagina, busca: busca?.trim() || undefined, id_autor, id_leitor, curtidos });
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar posts", erro: error.message });
    }
}

export async function buscarPostsPorId(req, res) {
    try {
        const { id_post } = req.params;
        const id_leitor = req.usuario?.tipo === "cliente" ? req.usuario.id : null;
        const post = await postBlogModel.buscarPostsPorId(id_post, id_leitor);

        if (!post || !post.ativo) {
            return res.status(404).json({ msg: "Post não encontrado" });
        }

        await postBlogModel.incrementarVisualizacoes(id_post);
        post.visualizacoes += 1;

        return res.status(200).json(post);
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao buscar post", erro: error.message });
    }
}

export async function criarPosts(req, res) {
    try {
        const { id_categoria, imagem_capa_url } = req.body;
        const titulo = String(req.body.titulo ?? "").trim();
        const conteudo = String(req.body.conteudo ?? "").trim();
        const ehFuncionario = req.usuario.tipo === "funcionario";
        const id_autor = ehFuncionario ? null : req.usuario.id;
        const autor_nome = ehFuncionario ? `${String(req.usuario.nome || "Equipe").split(" ")[0]} · Equipe Happy Snouts` : null;

        if (!id_categoria) {
            return res.status(400).json({ msg: "Escolha a categoria" });
        }

        const erro = validarTitulo(titulo) || validarTexto(conteudo);
        if (erro) {
            return res.status(400).json({ msg: erro });
        }
        const resumo = gerarResumo(conteudo);

        const categoria = await categoriaBlogModel.buscarCategoriaPorId(id_categoria);

        if (!categoria) {
            return res.status(404).json({ msg: "Categoria não encontrada" });
        }

        const id = await postBlogModel.criarPosts({
            id_categoria,
            id_autor,
            autor_nome,
            titulo,
            resumo,
            conteudo,
            imagem_capa_url,
            tempo_leitura_min: calcularTempoLeitura(conteudo)
        });

        return res.status(201).json({ msg: "Post cadastrado com sucesso", id_post: id });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao criar post", erro: error.message });
    }
}

export async function atualizarPosts(req, res) {
    try {
        const { id_post } = req.params;
        const { id_categoria, imagem_capa_url } = req.body;
        const titulo = req.body.titulo === undefined ? undefined : String(req.body.titulo).trim();
        const conteudo = req.body.conteudo === undefined ? undefined : String(req.body.conteudo).trim();

        const post = await postBlogModel.buscarPostsPorId(id_post);

        if (!post || !post.ativo) {
            return res.status(404).json({ msg: "Post não encontrado" });
        }

        if (req.usuario.tipo !== "funcionario" && Number(post.id_autor) !== Number(req.usuario.id)) {
            return res.status(403).json({ msg: "Você só pode editar seus próprios posts" });
        }

        const erro = (titulo !== undefined && validarTitulo(titulo)) || (conteudo !== undefined && validarTexto(conteudo));
        if (erro) {
            return res.status(400).json({ msg: erro });
        }

        if (id_categoria !== undefined) {
            const categoria = await categoriaBlogModel.buscarCategoriaPorId(id_categoria);
            if (!categoria) {
                return res.status(404).json({ msg: "Categoria não encontrada" });
            }
        }

        const dados = { id_categoria, titulo, conteudo, imagem_capa_url };

        if (conteudo !== undefined) {
            dados.resumo = gerarResumo(conteudo);
            dados.tempo_leitura_min = calcularTempoLeitura(conteudo);
        }

        const atualizado = await postBlogModel.atualizarPosts(id_post, dados);

        if (!atualizado) {
            return res.status(400).json({ msg: "Nenhum campo válido para atualizar" });
        }

        return res.status(200).json({ msg: "Post atualizado com sucesso" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar post", erro: error.message });
    }
}

export async function deletarPosts(req, res) {
    try {
        const { id_post } = req.params;
        const post = await postBlogModel.buscarPostsPorId(id_post);

        if (!post || !post.ativo) {
            return res.status(404).json({ msg: "Post não encontrado" });
        }

        if (req.usuario.tipo !== "funcionario" && Number(post.id_autor) !== Number(req.usuario.id)) {
            return res.status(403).json({ msg: "Você só pode excluir seus próprios posts" });
        }

        const deletado = await postBlogModel.deletarPosts(id_post);

        if (!deletado) {
            return res.status(500).json({ msg: "Falha ao deletar post" });
        }

        return res.status(200).json({ msg: "Post removido" });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao deletar post", erro: error.message });
    }
}