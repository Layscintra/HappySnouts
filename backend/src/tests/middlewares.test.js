import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";
import { autenticarToken, autenticarOpcional } from "../middlewares/authMiddleware.js";
import { verificarCliente } from "../middlewares/verificarCliente.js";
import { verificarFuncionario } from "../middlewares/verificarFuncionario.js";

function criarRes() {
    const res = {};
    res.status = (codigo) => { res.statusCode = codigo; return res; };
    res.json = (corpo) => { res.body = corpo; return res; };
    return res;
}

describe('Testes do middleware autenticarToken', () => {

    test('deve retornar 401 quando não manda token', () => {
        const req = { headers: {} };
        const res = criarRes();
        const next = jest.fn();

        autenticarToken(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.mensagem).toBe('Token não informado');
        expect(next).not.toHaveBeenCalled();
    });

    test('deve retornar 401 quando o formato não é Bearer', () => {
        const req = { headers: { authorization: 'Token abc123' } };
        const res = criarRes();
        const next = jest.fn();

        autenticarToken(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.mensagem).toBe('Formato do token inválido');
    });

    test('deve retornar 401 para token inválido', () => {
        const req = { headers: { authorization: 'Bearer token_falso' } };
        const res = criarRes();
        const next = jest.fn();

        autenticarToken(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.mensagem).toBe('Token inválido ou expirado');
    });

    test('deve liberar e preencher req.usuario com token válido', () => {
        const token = jwt.sign({ id: 1, tipo: 'cliente' }, jwtConfig.secret);
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = criarRes();
        const next = jest.fn();

        autenticarToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.usuario).toMatchObject({ id: 1, tipo: 'cliente' });
    });
});

describe('Testes do middleware autenticarOpcional', () => {

    test('sem token deve seguir como visitante', () => {
        const req = { headers: {} };
        const next = jest.fn();

        autenticarOpcional(req, criarRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.usuario).toBeUndefined();
    });

    test('com token inválido deve seguir como visitante', () => {
        const req = { headers: { authorization: 'Bearer token_falso' } };
        const next = jest.fn();

        autenticarOpcional(req, criarRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.usuario).toBeUndefined();
    });
});

describe('Testes dos middlewares verificarCliente e verificarFuncionario', () => {

    test('verificarCliente deve liberar cliente', () => {
        const next = jest.fn();
        verificarCliente({ usuario: { tipo: 'cliente' } }, criarRes(), next);
        expect(next).toHaveBeenCalled();
    });

    test('verificarCliente deve barrar funcionário com 403', () => {
        const res = criarRes();
        verificarCliente({ usuario: { tipo: 'funcionario' } }, res, jest.fn());
        expect(res.statusCode).toBe(403);
    });

    test('verificarFuncionario deve liberar funcionário', () => {
        const next = jest.fn();
        verificarFuncionario({ usuario: { tipo: 'funcionario' } }, criarRes(), next);
        expect(next).toHaveBeenCalled();
    });

    test('verificarFuncionario deve barrar cliente com 403', () => {
        const res = criarRes();
        verificarFuncionario({ usuario: { tipo: 'cliente' } }, res, jest.fn());
        expect(res.statusCode).toBe(403);
    });
});
