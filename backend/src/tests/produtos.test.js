import request from 'supertest';
import app from '../app.js';
import { conexao } from '../config/db.js';
import { criarClienteTeste, criarFuncionarioTeste, removerClienteTeste, removerFuncionarioTeste, auth } from './helpers.js';

describe('Testes da API de Categorias de Produto, Produtos e Favoritos', () => {
    let cliente;
    let funcionario;
    let categoriaId;
    let produtoId;

    beforeAll(async () => {
        cliente = await criarClienteTeste();
        funcionario = await criarFuncionarioTeste();
    });

    afterAll(async () => {
        await removerClienteTeste(cliente.id);
        await conexao.query('DELETE FROM produtos WHERE id_produto = ?', [produtoId]);
        await conexao.query('DELETE FROM categorias_produto WHERE id_categoria = ?', [categoriaId]);
        await removerFuncionarioTeste(funcionario.id);
    });

    test('POST /categoriaProduto deve retornar 403 para cliente', async () => {
        const response = await request(app)
            .post('/categoriaProduto')
            .set(auth(cliente.token))
            .send({ nome: 'Categoria Cliente', icone: 'pets' });

        expect(response.statusCode).toBe(403);
    });

    test('POST /categoriaProduto deve criar uma nova categoria', async () => {
        const response = await request(app)
            .post('/categoriaProduto')
            .set(auth(funcionario.token))
            .send({ nome: `Categoria Teste ${Date.now()}`, icone: 'pets' });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('id');

        categoriaId = response.body.id;
    });

    test('POST /categoriaProduto deve retornar 400 para dados incompletos', async () => {
        const response = await request(app)
            .post('/categoriaProduto')
            .set(auth(funcionario.token))
            .send({ nome: 'Sem Ícone' });

        expect(response.statusCode).toBe(400);
    });

    test('GET /categoriaProduto deve listar as categorias', async () => {
        const response = await request(app)
            .get('/categoriaProduto')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /categoriaProduto/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .get('/categoriaProduto/999999')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(404);
    });

    test('PUT /categoriaProduto/:id deve atualizar a categoria', async () => {
        const response = await request(app)
            .put(`/categoriaProduto/${categoriaId}`)
            .set(auth(funcionario.token))
            .send({ nome: `Categoria Atualizada ${Date.now()}`, icone: 'shopping_bag' });

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Categoria atualizada');
    });

    test('POST /produtos deve retornar 401 sem token', async () => {
        const response = await request(app)
            .post('/produtos')
            .send({ nome: 'Ração' });

        expect(response.statusCode).toBe(401);
    });

    test('POST /produtos deve criar um novo produto', async () => {
        const novoProduto = {
            nome: `Ração Teste ${Date.now()}`,
            descricao: 'Ração para testes',
            preco: 99.9,
            preco_promocional: 79.9,
            id_categoria: categoriaId,
            imagem_url: '/uploads/teste.jpg'
        };

        const response = await request(app)
            .post('/produtos')
            .set(auth(funcionario.token))
            .send(novoProduto);

        expect(response.statusCode).toBe(201);
        expect(response.body.msg).toBe('Produto cadastrado com sucesso');

        produtoId = response.body.id;
    });

    test('POST /produtos deve retornar 400 para dados incompletos', async () => {
        const response = await request(app)
            .post('/produtos')
            .set(auth(funcionario.token))
            .send({ nome: 'Produto Incompleto' });

        expect(response.statusCode).toBe(400);
    });

    test('POST /produtos deve retornar 400 para categoria inexistente', async () => {
        const response = await request(app)
            .post('/produtos')
            .set(auth(funcionario.token))
            .send({ nome: 'X', descricao: 'X', preco: 10, id_categoria: 999999, imagem_url: '/x.jpg' });

        expect(response.statusCode).toBe(400);
    });

    test('GET /produtos deve listar os produtos ativos (rota pública)', async () => {
        const response = await request(app).get('/produtos');

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /produtos/:id deve buscar um produto por ID', async () => {
        const response = await request(app).get(`/produtos/${produtoId}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('id_produto', produtoId);
    });

    test('GET /produtos/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app).get('/produtos/999999');

        expect(response.statusCode).toBe(404);
    });

    test('PUT /produtos/:id deve atualizar um produto existente', async () => {
        const response = await request(app)
            .put(`/produtos/${produtoId}`)
            .set(auth(funcionario.token))
            .send({
                nome: `Ração Atualizada ${Date.now()}`,
                descricao: 'Nova descrição',
                preco: 89.9,
                id_categoria: categoriaId,
                imagem_url: '/uploads/teste.jpg'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Produto atualizado');
    });

    test('POST /favoritos deve adicionar o produto aos favoritos', async () => {
        const response = await request(app)
            .post('/favoritos')
            .set(auth(cliente.token))
            .send({ id_produto: produtoId });

        expect(response.statusCode).toBe(201);
    });

    test('POST /favoritos deve retornar 400 para produto já favoritado', async () => {
        const response = await request(app)
            .post('/favoritos')
            .set(auth(cliente.token))
            .send({ id_produto: produtoId });

        expect(response.statusCode).toBe(400);
        expect(response.body.msg).toBe('Produto já está nos favoritos');
    });

    test('GET /favoritos deve listar os favoritos do cliente', async () => {
        const response = await request(app)
            .get('/favoritos')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.some((f) => f.id_produto === produtoId)).toBe(true);
    });

    test('DELETE /favoritos/:id_produto deve remover dos favoritos', async () => {
        const response = await request(app)
            .delete(`/favoritos/${produtoId}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
    });

    test('DELETE /favoritos/:id_produto deve retornar 404 se não estiver nos favoritos', async () => {
        const response = await request(app)
            .delete(`/favoritos/${produtoId}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(404);
    });

    test('DELETE /categoriaProduto/:id deve retornar 409 se a categoria tem produtos', async () => {
        const response = await request(app)
            .delete(`/categoriaProduto/${categoriaId}`)
            .set(auth(funcionario.token));

        expect(response.statusCode).toBe(409);
    });

    test('DELETE /produtos/:id deve retornar 403 para cliente', async () => {
        const response = await request(app)
            .delete(`/produtos/${produtoId}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(403);
    });

    test('DELETE /produtos/:id deve remover (desativar) o produto', async () => {
        const response = await request(app)
            .delete(`/produtos/${produtoId}`)
            .set(auth(funcionario.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Produto removido');
    });

    test('DELETE /produtos/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .delete('/produtos/999999')
            .set(auth(funcionario.token));

        expect(response.statusCode).toBe(404);
    });
});
