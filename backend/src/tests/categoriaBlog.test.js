import request from 'supertest';
import app from '../app.js';
import { criarClienteTeste, criarFuncionarioTeste, removerClienteTeste, removerFuncionarioTeste, auth } from './helpers.js';

describe('Testes da API de Categorias do Blog', () => {
    let cliente;
    let funcionario;
    let categoriaId;
    let nomeCategoria;

    beforeAll(async () => {
        cliente = await criarClienteTeste();
        funcionario = await criarFuncionarioTeste();
    });

    afterAll(async () => {
        await removerClienteTeste(cliente.id);
        await removerFuncionarioTeste(funcionario.id);
    });

    test('POST /categoriaBlog deve criar uma nova categoria', async () => {
        nomeCategoria = `Blog Teste ${Date.now()}`;

        const response = await request(app)
            .post('/categoriaBlog')
            .set(auth(funcionario.token))
            .send({ nome: nomeCategoria, cor: '#F7941C', icone: 'pets' });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('id');

        categoriaId = response.body.id;
    });

    test('POST /categoriaBlog deve retornar 409 para nome repetido', async () => {
        const response = await request(app)
            .post('/categoriaBlog')
            .set(auth(funcionario.token))
            .send({ nome: nomeCategoria, cor: '#F7941C', icone: 'pets' });

        expect(response.statusCode).toBe(409);
    });

    test('POST /categoriaBlog deve retornar 400 para cor fora do formato #RRGGBB', async () => {
        const response = await request(app)
            .post('/categoriaBlog')
            .set(auth(funcionario.token))
            .send({ nome: 'Cor Errada', cor: 'laranja', icone: 'pets' });

        expect(response.statusCode).toBe(400);
        expect(response.body.msg).toBe('cor precisa estar no formato #RRGGBB.');
    });

    test('POST /categoriaBlog deve retornar 403 para cliente', async () => {
        const response = await request(app)
            .post('/categoriaBlog')
            .set(auth(cliente.token))
            .send({ nome: 'Do Cliente', cor: '#000000', icone: 'pets' });

        expect(response.statusCode).toBe(403);
    });

    test('GET /categoriaBlog deve listar as categorias sem login', async () => {
        const response = await request(app).get('/categoriaBlog');

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /categoriaBlog/:id deve buscar uma categoria por ID', async () => {
        const response = await request(app).get(`/categoriaBlog/${categoriaId}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.nome).toBe(nomeCategoria);
    });

    test('GET /categoriaBlog/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app).get('/categoriaBlog/999999');

        expect(response.statusCode).toBe(404);
    });

    test('PUT /categoriaBlog/:id deve atualizar a categoria', async () => {
        const response = await request(app)
            .put(`/categoriaBlog/${categoriaId}`)
            .set(auth(funcionario.token))
            .send({ nome: `${nomeCategoria} Atualizada`, cor: '#0B2B68', icone: 'article' });

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Categoria atualizada');
    });

    test('PUT /categoriaBlog/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .put('/categoriaBlog/999999')
            .set(auth(funcionario.token))
            .send({ nome: 'Nada', cor: '#000000', icone: 'pets' });

        expect(response.statusCode).toBe(404);
    });

    test('DELETE /categoriaBlog/:id deve remover a categoria', async () => {
        const response = await request(app)
            .delete(`/categoriaBlog/${categoriaId}`)
            .set(auth(funcionario.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Categoria removida');
    });

    test('DELETE /categoriaBlog/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .delete('/categoriaBlog/999999')
            .set(auth(funcionario.token));

        expect(response.statusCode).toBe(404);
    });
});
