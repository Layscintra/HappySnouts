import request from 'supertest';
import app from '../app.js';

describe('Testes de rotas gerais da API', () => {

    test('GET /formas-pagamento deve listar as formas de pagamento', async () => {
        const response = await request(app).get('/formas-pagamento');

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /cep/:cep deve retornar 400 para CEP com tamanho errado', async () => {
        const response = await request(app).get('/cep/123');

        expect(response.statusCode).toBe(400);
        expect(response.body.mensagem).toBe('CEP inválido. Use 8 números.');
    });

    test('GET /carrinho deve retornar 401 sem token', async () => {
        const response = await request(app).get('/carrinho');

        expect(response.statusCode).toBe(401);
    });

    test('GET /pedidos deve retornar 401 sem token', async () => {
        const response = await request(app).get('/pedidos');

        expect(response.statusCode).toBe(401);
    });

    test('POST /upload deve retornar 401 sem token', async () => {
        const response = await request(app).post('/upload');

        expect(response.statusCode).toBe(401);
    });

    test('Rotas protegidas devem retornar 401 com token inválido', async () => {
        const response = await request(app)
            .get('/pets')
            .set('Authorization', 'Bearer token_invalido');

        expect(response.statusCode).toBe(401);
        expect(response.body.mensagem).toBe('Token inválido ou expirado');
    });

    test('As respostas da API não devem ficar em cache', async () => {
        const response = await request(app).get('/formas-pagamento');

        expect(response.headers['cache-control']).toBe('no-store');
    });
});
