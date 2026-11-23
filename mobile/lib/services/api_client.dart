import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:happysnouts/config/app_config.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

/// Acesso ao backend (mesmas rotas usadas pelo site, ver frontend/src/lib/config.js).
///
/// Envia o token JWT no header, converte o JSON e transforma qualquer falha
/// em [ServiceException] com mensagem pronta para a tela.
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  http.Client _http = http.Client();

  /// Permite trocar o cliente HTTP nos testes (package:http/testing.dart).
  @visibleForTesting
  set httpClient(http.Client client) => _http = client;

  String? token;

  VoidCallback? onUnauthorized;

  Map<String, dynamic>? get tokenData => decodeToken(token);

  int? get userId => (tokenData?['id'] as num?)?.toInt();

  Future<dynamic> get(String path, {Map<String, String>? query}) => _send('GET', path, query: query);

  Future<dynamic> post(String path, [Object? body]) => _send('POST', path, body: body);

  Future<dynamic> put(String path, [Object? body, bool handleUnauthorized = true]) =>
      _send('PUT', path, body: body, handleUnauthorized: handleUnauthorized);

  Future<dynamic> patch(String path, [Object? body]) => _send('PATCH', path, body: body);

  Future<dynamic> delete(String path) => _send('DELETE', path);

  /// POST /upload (multipart, campo "imagem"). Devolve o caminho salvo, ex.: "/uploads/abc.jpg".
  /// O backend aceita JPG, PNG ou WEBP de até 2 MB.
  Future<String> uploadImage(Uint8List bytes, {required String fileName, required String mimeType}) async {
    final request = http.MultipartRequest('POST', Uri.parse('${AppConfig.apiUrl}/upload'))
      ..headers['Accept'] = 'application/json'
      ..files.add(
        http.MultipartFile.fromBytes('imagem', bytes, filename: fileName, contentType: MediaType.parse(mimeType)),
      );
    if (token != null) request.headers['Authorization'] = 'Bearer $token';

    final http.Response response;
    try {
      response = await http.Response.fromStream(await _http.send(request).timeout(AppConfig.requestTimeout));
    } on TimeoutException {
      throw const ServiceException('O servidor demorou para responder. Tente novamente.');
    } catch (_) {
      throw const ServiceException(
        'Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está ligado.',
      );
    }
    final data = _decode(response.body);
    if (response.statusCode == 401 && token != null) {
      onUnauthorized?.call();
      throw const ServiceException('Sua sessão expirou. Entre novamente.');
    }
    final path = data is Map ? data['caminho'] : null;
    if (response.statusCode >= 300 || path is! String) {
      throw ApiException(response.statusCode, _messageFrom(data) ?? 'Não foi possível enviar a imagem.');
    }
    return path;
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
    bool handleUnauthorized = true,
  }) async {
    final uri = Uri.parse('${AppConfig.apiUrl}$path').replace(queryParameters: query);
    final request = http.Request(method, uri)..headers['Accept'] = 'application/json';
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }

    final http.Response response;
    try {
      response = await http.Response.fromStream(await _http.send(request).timeout(AppConfig.requestTimeout));
    } on TimeoutException {
      throw const ServiceException('O servidor demorou para responder. Tente novamente.');
    } catch (_) {
      throw const ServiceException(
        'Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está ligado.',
      );
    }

    final data = _decode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) return data;

    if (response.statusCode == 401 && token != null && handleUnauthorized) {
      onUnauthorized?.call();
      throw const ServiceException('Sua sessão expirou. Entre novamente.');
    }
    throw ApiException(
      response.statusCode,
      _messageFrom(data) ?? 'Algo deu errado (erro ${response.statusCode}). Tente novamente.',
    );
  }

  static dynamic _decode(String body) {
    if (body.isEmpty) return null;
    try {
      return jsonDecode(body);
    } catch (_) {
      return null;
    }
  }

  // O backend responde { msg } em algumas rotas e { mensagem } em outras.
  static String? _messageFrom(dynamic data) {
    if (data is! Map) return null;
    final message = data['msg'] ?? data['mensagem'];
    return message is String && message.isNotEmpty ? message : null;
  }

  /// Lê o payload do JWT sem validar a assinatura (quem valida é o backend).
  static Map<String, dynamic>? decodeToken(String? token) {
    if (token == null) return null;
    final parts = token.split('.');
    if (parts.length != 3) return null;
    try {
      final payload = utf8.decode(base64Url.decode(base64Url.normalize(parts[1])));
      final data = jsonDecode(payload);
      return data is Map<String, dynamic> ? data : null;
    } catch (_) {
      return null;
    }
  }

  static bool isExpired(String? token) {
    final exp = (decodeToken(token)?['exp'] as num?)?.toInt();
    if (exp == null) return decodeToken(token) == null;
    return DateTime.fromMillisecondsSinceEpoch(exp * 1000).isBefore(DateTime.now());
  }

  /// O backend guarda imagens como "/uploads/abc.png"; aqui vira a URL completa.
  /// Assets do app (assets/...) e URLs completas passam direto.
  static String imageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http') || path.startsWith('assets/')) return path;
    if (path.startsWith('/uploads')) return '${AppConfig.apiUrl}$path';
    return '';
  }
}

class ApiException extends ServiceException {
  final int statusCode;

  const ApiException(this.statusCode, super.message);
}

/// Conversões dos tipos que chegam do MySQL (DECIMAL vem como texto, BOOLEAN como 0/1).
class Json {
  Json._();

  static double? toDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  static int? toInt(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString());
  }

  static bool toBool(dynamic value) => value == true || value == 1 || value == '1';

  static String text(dynamic value) => value == null ? '' : value.toString();

  /// DATE/DATETIME chegam em ISO (UTC); convertidos para o horário do aparelho.
  static DateTime? toDate(dynamic value) {
    if (value == null) return null;
    return DateTime.tryParse(value.toString())?.toLocal();
  }

  static List<Map<String, dynamic>> list(dynamic value) {
    if (value is! List) return const [];
    return value.whereType<Map<String, dynamic>>().toList();
  }

  static String _two(int value) => value.toString().padLeft(2, '0');

  static String sqlDate(DateTime date) => '${date.year}-${_two(date.month)}-${_two(date.day)}';

  static String sqlDateTime(DateTime date) => '${sqlDate(date)} ${_two(date.hour)}:${_two(date.minute)}:00';
}
