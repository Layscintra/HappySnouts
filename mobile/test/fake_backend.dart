import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

/// Backend falso, em memória, com as mesmas rotas e respostas do backend/
/// (Express + MySQL). Permite testar o app sem servidor nem banco.
class FakeBackend {
  static const email = 'layscintra@gmail.com';
  static const password = 'happy123';

  int _seq = 100;
  int _next() => ++_seq;

  final users = <Map<String, dynamic>>[
    {
      'Id_usuario': 1,
      'nome_completo': 'Lays Christine Cintra Silva',
      'nome_usuario': 'layscintra_',
      'email': email,
      'cpf': '52998224725',
      'telefone': '11999999999',
      'data_nascimento': '2008-12-01T03:00:00.000Z',
      'foto_url': null,
      'senha': password,
    },
  ];

  final products = <Map<String, dynamic>>[
    {
      'id_produto': 1,
      'nome': 'Alimentador Automático 4L Programável',
      'descricao': 'Comedouro programável',
      'preco': '175.00',
      'preco_promocional': null,
      'imagem_url': '/uploads/comedouro.png',
      'id_categoria': 1,
      'categoria': 'Alimentação',
      'ativo': 1,
    },
    {
      'id_produto': 2,
      'nome': 'Coleira Rastreadora de Couro',
      'descricao': 'Coleira com rastreador',
      'preco': '129.90',
      'preco_promocional': null,
      'imagem_url': null,
      'id_categoria': 2,
      'categoria': 'Acessórios',
      'ativo': 1,
    },
    {
      'id_produto': 3,
      'nome': 'Brinquedo Mordedor Osso de Borracha',
      'descricao': 'Mordedor resistente',
      'preco': '49.90',
      'preco_promocional': '39.90',
      'imagem_url': null,
      'id_categoria': 3,
      'categoria': 'Brinquedos',
      'ativo': 1,
    },
    {
      'id_produto': 4,
      'nome': 'Pelúcia Cachorrinho Soneca',
      'descricao': 'Pelúcia macia',
      'preco': '59.90',
      'preco_promocional': null,
      'imagem_url': null,
      'id_categoria': 3,
      'categoria': 'Brinquedos',
      'ativo': 1,
    },
  ];

  final categories = <Map<String, dynamic>>[
    {'id_categoria': 1, 'nome': 'Alimentação', 'icone': '🍖', 'ativo': 1},
    {'id_categoria': 2, 'nome': 'Acessórios', 'icone': 'coleira.png', 'ativo': 1},
    {'id_categoria': 3, 'nome': 'Brinquedos', 'icone': '🎾', 'ativo': 1},
    {'id_categoria': 4, 'nome': 'Higiene', 'icone': '🧴', 'ativo': 1},
  ];

  static const employeeEmail = 'admin@happysnouts.com';
  final employees = <Map<String, dynamic>>[
    {'id_funcionario': 7, 'nome': 'Ana Funcionária', 'email': employeeEmail, 'senha': 'admin123', 'ativo': 1},
  ];

  /// id_usuario -> id_produto -> (quantidade, preco_unico)
  final carts = <int, Map<int, ({int quantity, double price})>>{};
  final delivery = <int, Map<String, dynamic>>{};
  final favorites = <int, Set<int>>{
    1: {1},
  };

  final addresses = <Map<String, dynamic>>[
    {
      'id_endereco': 10,
      'id_usuario': 1,
      'cep': '06000-000',
      'estado': 'SP',
      'cidade': 'Osasco',
      'bairro': 'Rochdale',
      'endereco': 'Rua Andradina',
      'numero': '227',
      'apelido': 'Casa',
      'padrao': 1,
    },
  ];

  final cards = <Map<String, dynamic>>[
    {
      'id_cartao': 20,
      'id_usuario': 1,
      'icone': 'visa',
      'destinatario': 'Visa',
      'ultimos_digitos': '1234',
      'nome_titular': 'LAYS C SILVA',
      'padrao': 1,
    },
  ];

  final pets = <Map<String, dynamic>>[
    {
      'id_pet': 30,
      'Id_usuario': 1,
      'nome_pet': 'Thor',
      'raca': 'Golden retriever',
      'idade_pet': 2,
      'id_coleira': 1,
      'id_alimentador': null,
      'peso_atual': '32.00',
      'foto_url': null,
    },
    {
      'id_pet': 31,
      'Id_usuario': 1,
      'nome_pet': 'Mel',
      'raca': 'SRD',
      'idade_pet': null,
      'id_coleira': null,
      'id_alimentador': null,
      'peso_atual': null,
      'foto_url': null,
    },
  ];

  late final reminders = <Map<String, dynamic>>[
    {
      'id_lembrete': 40,
      'id_pet': 30,
      'titulo': 'Vacina V10',
      'tipo': 'vacina',
      'data_hora': DateTime.now().add(const Duration(days: 2)),
      'concluido': 0,
    },
  ];

  late final posts = <Map<String, dynamic>>[
    {
      'id_post': 50,
      'titulo': 'Como eu faço meu pet se adaptar ao banho?',
      'resumo': 'Comecei a ir com calma...',
      'conteudo': 'Comecei a ir com calma: primeiro sem água, só com petisco.',
      'imagem_capa_url': null,
      'data_publicacao': DateTime.now().subtract(const Duration(hours: 6)).toUtc().toIso8601String(),
      'autor': 'julia_bubu',
      'ativo': 1,
    },
  ];

  final blogCategories = <Map<String, dynamic>>[
    {'id_categoria': 1, 'nome': 'Saúde', 'cor': '#E5484D', 'icone': '🩺'},
    {'id_categoria': 2, 'nome': 'Alimentação', 'cor': '#F7941C', 'icone': '🍖'},
  ];

  final orders = <Map<String, dynamic>>[];
  final notifications = <Map<String, dynamic>>[];
  final messages = <Map<String, dynamic>>[];

  final resetCodes = <String, String>{};

  late final http.Client client = MockClient(_handle);

  static const _labels = {
    'recebido': 'Recebido',
    'em_preparacao': 'Em preparação',
    'enviado': 'A caminho',
    'entregue': 'Entregue',
    'cancelado': 'Cancelado',
  };
  static const paymentMethods = [
    {'id_forma_pagamento': 1, 'codigo': 'pix', 'nome': 'Pix', 'usa_cartao': 0, 'max_parcelas': 1, 'ativo': 1},
    {
      'id_forma_pagamento': 2,
      'codigo': 'cartao_credito',
      'nome': 'Cartão de crédito',
      'usa_cartao': 1,
      'max_parcelas': 3,
      'ativo': 1,
    },
    {
      'id_forma_pagamento': 3,
      'codigo': 'cartao_debito',
      'nome': 'Cartão de débito',
      'usa_cartao': 1,
      'max_parcelas': 1,
      'ativo': 1,
    },
    {'id_forma_pagamento': 4, 'codigo': 'boleto', 'nome': 'Boleto', 'usa_cartao': 0, 'max_parcelas': 1, 'ativo': 1},
  ];

  static const _nextPayment = {
    'pendente': ['aprovado', 'recusado', 'cancelado'],
    'recusado': ['pendente', 'aprovado', 'cancelado'],
    'aprovado': ['estornado'],
  };

  static const _nextStatus = {
    'recebido': ['em_preparacao', 'enviado', 'cancelado'],
    'em_preparacao': ['enviado', 'cancelado'],
    'enviado': ['entregue'],
    'entregue': <String>[],
    'cancelado': <String>[],
  };

  static String _number(Object? id) => '#${id.toString().padLeft(5, '0')}';

  Map<String, dynamic> _orderJson(Map<String, dynamic> o) {
    final user = users.where((u) => u['Id_usuario'] == o['id_usuario']).firstOrNull;
    return {
      ...o,
      'numero_pedido': _number(o['id_pedido']),
      'status_rotulo': _labels[o['status']],
      'proximos_status': _nextStatus[o['status']],
      if (o['pagamento'] != null)
        'pagamento': {
          ...o['pagamento'] as Map<String, dynamic>,
          'proximos_status': _nextPayment[(o['pagamento'] as Map)['status']] ?? const [],
        },
      'cliente_nome': user?['nome_completo'],
      'cliente_email': user?['email'],
    };
  }

  void _notify(int userId, String title, String message, String type, int? ref) {
    notifications.insert(0, {
      'id_notificacao': _next(),
      'id_usuario': userId,
      'titulo': title,
      'mensagem': message,
      'tipo': type,
      'referencia_id': ref,
      'lida': 0,
      'data_criacao': DateTime.now(),
    });
  }

  /// Monta um JWT no mesmo formato do backend (a assinatura não é conferida pelo app).
  static String tokenFor(
    Map<String, dynamic> user, {
    Duration validFor = const Duration(hours: 8),
    String tipo = 'cliente',
  }) {
    String part(Object json) => base64Url.encode(utf8.encode(jsonEncode(json))).replaceAll('=', '');
    final exp = DateTime.now().add(validFor).millisecondsSinceEpoch ~/ 1000;
    return '${part({'alg': 'HS256', 'typ': 'JWT'})}.${part({'id': user['Id_usuario'] ?? user['id_funcionario'], 'nome': user['nome_completo'] ?? user['nome'], 'email': user['email'], 'tipo': tipo, 'exp': exp})}.assinatura';
  }

  Future<http.Response> _handle(http.Request request) async {
    final path = request.url.path;
    final method = request.method;
    final isUpload = path == '/upload';
    final body = isUpload || request.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(request.body) as Map<String, dynamic>;

    http.Response json(Object? data, [int status = 200]) => http.Response(
      jsonEncode(data, toEncodable: _encode),
      status,
      headers: {'content-type': 'application/json; charset=utf-8'},
    );
    http.Response msg(String text, [int status = 200]) => json({'msg': text}, status);
    bool match(String m, String pattern) => method == m && RegExp('^$pattern\$').hasMatch(path);
    int idAt(int index) => int.parse(path.split('/')[index]);

    // rotas públicas
    if (match('POST', '/auth/cliente/login')) {
      final user = users.where((u) => u['email'] == body['email']).firstOrNull;
      if (user == null) return json({'mensagem': 'Cliente não encontrado'}, 404);
      if (user['senha'] != body['senha']) return json({'mensagem': 'Senha inválida'}, 401);
      return json({'mensagem': 'Login realizado com sucesso', 'token': tokenFor(user)});
    }
    if (match('POST', '/auth/cliente/registrar')) {
      for (final field in ['nome_completo', 'nome_usuario', 'email', 'cpf', 'senha']) {
        if (body[field] == null || body[field] == '') return json({'mensagem': 'Campos obrigatórios'}, 400);
      }
      if (users.any((u) => u['email'] == body['email'])) return json({'mensagem': 'Email já cadastrado'}, 400);
      final id = _next();
      users.add({
        ...body,
        'Id_usuario': id,
        'data_nascimento': body['data_nascimento'] == null ? null : '${body['data_nascimento']}T03:00:00.000Z',
      });
      return json({'mensagem': 'Cliente cadastrado com sucesso', 'id': id}, 201);
    }
    if (match('GET', '/produtos')) return json(products.where((p) => p['ativo'] == 1).toList());
    if (match('POST', '/auth/login')) {
      final employee = employees.where((e) => e['email'] == body['email']).firstOrNull;
      if (employee != null && employee['senha'] == body['senha']) {
        if (employee['ativo'] != 1) return json({'mensagem': 'Funcionário inativo, acesso negado'}, 403);
        return json({
          'mensagem': 'Login realizado com sucesso',
          'tipo': 'funcionario',
          'token': tokenFor(employee, tipo: 'funcionario'),
        });
      }
      final user = users.where((u) => u['email'] == body['email']).firstOrNull;
      if (user == null && employee == null) return json({'mensagem': 'Usuário não encontrado'}, 404);
      if (user == null || user['senha'] != body['senha']) return json({'mensagem': 'Senha inválida'}, 401);
      return json({'mensagem': 'Login realizado com sucesso', 'tipo': 'cliente', 'token': tokenFor(user)});
    }
    if (match('POST', '/auth/esqueci-senha')) {
      final email = body['email'] as String?;
      if (users.any((u) => u['email'] == email) || employees.any((e) => e['email'] == email)) {
        resetCodes[email!] = '123456';
      }
      return json({'mensagem': 'Se este e-mail estiver cadastrado, você vai receber um código.'});
    }
    if (match('POST', '/auth/verificar-codigo') || match('POST', '/auth/redefinir-senha')) {
      final email = body['email'] as String?;
      if (resetCodes[email] == null || resetCodes[email] != body['codigo']) {
        return json({'mensagem': 'Código incorreto.'}, 400);
      }
      if (path.endsWith('verificar-codigo')) return json({'mensagem': 'Código confirmado'});
      if ((body['nova_senha'] as String? ?? '').length < 6) {
        return json({'mensagem': 'A nova senha precisa ter pelo menos 6 caracteres'}, 400);
      }
      final account =
          users.where((u) => u['email'] == email).firstOrNull ?? employees.firstWhere((e) => e['email'] == email);
      account['senha'] = body['nova_senha'];
      resetCodes.remove(email);
      return json({'mensagem': 'Senha alterada com sucesso.'});
    }
    if (match('POST', '/contato') && request.headers['Authorization'] == null) {
      final id = _next();
      messages.add({
        'id_mensagem': id,
        'id_usuario': null,
        'nome': body['nome'],
        'email': body['email'],
        'assunto': body['assunto'],
        'mensagem': body['mensagem'],
        'status': 'aberta',
        'resposta': null,
        'data_envio': DateTime.now(),
      });
      return json({'msg': 'Mensagem enviada!', 'id': id, 'protocolo': _number(id)}, 201);
    }
    if (match('POST', '/auth/funcionario/login')) {
      final employee = employees.where((e) => e['email'] == body['email']).firstOrNull;
      if (employee == null) return json({'mensagem': 'Funcionario não encontrado'}, 404);
      if (employee['ativo'] != 1) return json({'mensagem': 'Funcionário inativo, acesso negado'}, 403);
      if (employee['senha'] != body['senha']) return json({'mensagem': 'Senha inválida'}, 401);
      return json({'mensagem': 'Login realizado com sucesso', 'token': tokenFor(employee, tipo: 'funcionario')});
    }

    // rotas com token
    final userId = _userFrom(request);
    if (userId == null) return json({'mensagem': 'Token inválido ou expirado'}, 401);

    if (match('POST', '/upload')) {
      final contentType = request.headers['content-type'] ?? '';
      final bytes = latin1.decode(request.bodyBytes);
      if (!contentType.startsWith('multipart/form-data') || !bytes.contains('name="imagem"')) {
        return msg('Nenhuma imagem enviada', 400);
      }
      if (!RegExp(r'Content-Type: image/(jpeg|png|webp)', caseSensitive: false).hasMatch(bytes)) {
        return msg('Envie uma imagem JPG, PNG ou WEBP', 400);
      }
      final path = '/uploads/${_next()}.jpg';
      uploads.add(path);
      return json({'caminho': path}, 201);
    }

    // painel do funcionário
    final isEmployee = lastTokenType == 'funcionario';
    final adminRoute =
        path == '/produtos/tudo' ||
        (path.startsWith('/produtos') && method != 'GET') ||
        (path.startsWith('/categoriaProduto') && method != 'GET');
    if (adminRoute && !isEmployee) return msg('Acesso restrito a funcionários', 403);
    if (match('GET', '/produtos/tudo')) return json(products);
    Map<String, dynamic>? categoryOf(Object? id) => categories.where((c) => c['id_categoria'] == id).firstOrNull;
    if (match('POST', '/produtos') || match('PUT', r'/produtos/\d+')) {
      for (final field in ['nome', 'descricao', 'preco', 'id_categoria', 'imagem_url']) {
        if (body[field] == null || body[field] == '') {
          return msg('nome, descricao, preco, id_categoria e imagem são obrigatórios.', 400);
        }
      }
      final category = categoryOf(body['id_categoria']);
      if (category == null) return msg('Categoria inválida ou inativa', 400);
      final data = {
        ...body,
        'preco': '${body['preco']}',
        'preco_promocional': body['preco_promocional'] == null ? null : '${body['preco_promocional']}',
        'categoria': category['nome'],
      };
      if (method == 'POST') {
        final id = _next();
        products.add({...data, 'id_produto': id, 'ativo': 1});
        return json({'msg': 'Produto cadastrado com sucesso', 'id': id}, 201);
      }
      products.firstWhere((p) => p['id_produto'] == idAt(2)).addAll(data);
      return msg('Produto atualizado');
    }
    if (match('DELETE', r'/produtos/\d+')) {
      products.firstWhere((p) => p['id_produto'] == idAt(2))['ativo'] = 0;
      return msg('Produto removido');
    }
    if (match('GET', '/categoriaProduto')) return json(categories);
    if (match('POST', '/categoriaProduto')) {
      if (categories.any((c) => c['nome'] == body['nome'])) return msg('Já existe uma categoria com esse nome', 409);
      final id = _next();
      categories.add({...body, 'id_categoria': id, 'ativo': 1});
      return json({'msg': 'Categoria cadastrada com sucesso', 'id': id}, 201);
    }
    if (match('PUT', r'/categoriaProduto/\d+')) {
      categoryOf(idAt(2))!.addAll(body);
      return msg('Categoria atualizada');
    }
    if (match('DELETE', r'/categoriaProduto/\d+')) {
      if (products.any((p) => p['id_categoria'] == idAt(2))) {
        return msg('Não dá pra excluir: existem produtos nessa categoria. Mova ou remova os produtos antes.', 409);
      }
      categories.removeWhere((c) => c['id_categoria'] == idAt(2));
      return msg('Categoria removida');
    }

    if (match('GET', r'/cliente/\d+')) {
      final user = users.where((u) => u['Id_usuario'] == idAt(2)).firstOrNull;
      if (user == null) return msg('Cliente não encontrado', 404);
      return json(
        {...user}
          ..remove('senha')
          ..remove('cpf'),
      );
    }
    if (match('PUT', r'/cliente/\d+/senha')) {
      final user = users.firstWhere((u) => u['Id_usuario'] == idAt(2));
      if (user['senha'] != body['senha_atual']) return msg('Senha atual inválida', 401);
      user['senha'] = body['nova_senha'];
      return msg('Senha atualizada');
    }
    if (match('PUT', r'/cliente/\d+')) {
      final user = users.firstWhere((u) => u['Id_usuario'] == idAt(2));
      for (final field in ['nome_completo', 'nome_usuario', 'email', 'telefone', 'foto_url']) {
        if (body[field] != null) user[field] = body[field];
      }
      if (body['data_nascimento'] != null) user['data_nascimento'] = '${body['data_nascimento']}T03:00:00.000Z';
      return msg('Cliente atualizado');
    }

    // carrinho
    final cart = carts.putIfAbsent(userId, () => {});
    Map<String, dynamic> cartJson() {
      final items = cart.entries.map((e) {
        final product = products.firstWhere((p) => p['id_produto'] == e.key);
        return {
          'id_produto': e.key,
          'nome': product['nome'],
          'imagem_url': product['imagem_url'],
          'ativo': product['ativo'] == 1,
          'quantidade': e.value.quantity,
          'preco_unico': e.value.price,
          'subtotal': e.value.price * e.value.quantity,
        };
      }).toList();
      final subtotal = items.fold<double>(0, (s, i) => s + (i['subtotal'] as double));
      final frete = (delivery[userId]?['valor_frete'] as num?)?.toDouble() ?? 0;
      return {'id_carrinho': userId, 'itens': items, 'subtotal': subtotal, 'frete': frete, 'total': subtotal + frete};
    }

    if (match('GET', '/carrinho')) return json(cartJson());
    if (match('POST', '/carrinho/itens')) {
      final product = products.where((p) => p['id_produto'] == body['id_produto']).firstOrNull;
      if (product == null) return msg('Produto não encontrado', 404);
      final price = double.parse((product['preco_promocional'] ?? product['preco']) as String);
      final current = cart[product['id_produto']]?.quantity ?? 0;
      cart[product['id_produto'] as int] = (quantity: current + (body['quantidade'] as int), price: price);
      return msg('Item adicionado ao carrinho', 201);
    }
    if (match('PUT', r'/carrinho/itens/\d+')) {
      final item = cart[idAt(3)];
      if (item == null) return msg('Item não encontrado no carrinho', 404);
      cart[idAt(3)] = (quantity: body['quantidade'] as int, price: item.price);
      return msg('Quantidade atualizada');
    }
    if (match('DELETE', r'/carrinho/itens/\d+')) {
      return cart.remove(idAt(3)) == null ? msg('Item não encontrado no carrinho', 404) : msg('Item removido');
    }
    if (match('PUT', '/carrinho/entrega')) {
      const fees = {'normal': 10, 'rapida': 20};
      if (!fees.containsKey(body['tipo_entrega'])) return msg("tipo_entrega deve ser 'rapida' ou 'normal'.", 400);
      if (!addresses.any((a) => a['id_endereco'] == body['id_endereco'] && a['id_usuario'] == userId)) {
        return msg('Endereço não encontrado', 404);
      }
      delivery[userId] = {...body, 'valor_frete': fees[body['tipo_entrega']]};
      return msg('Entrega definida');
    }
    if (match('POST', '/carrinho/finalizar')) {
      if (cart.isEmpty) return msg('Carrinho vazio', 400);
      if (delivery[userId] == null) return msg('Defina o endereço e o tipo de entrega antes de finalizar', 400);
      final method = paymentMethods.where((m) => m['codigo'] == body['forma_pagamento']).firstOrNull;
      if (method == null) return msg('forma_pagamento inválida', 400);
      final installments = (body['parcelas'] as int?) ?? 1;
      if (installments < 1 || installments > (method['max_parcelas'] as int)) return msg('Parcelas inválidas', 400);
      final card = method['usa_cartao'] == 1
          ? cards.where((c) => c['id_cartao'] == body['id_cartao'] && c['id_usuario'] == userId).firstOrNull
          : null;
      if (method['usa_cartao'] == 1 && card == null) return msg('Cartão não encontrado.', 400);
      final summary = cartJson();
      final address = addresses.firstWhere((a) => a['id_endereco'] == delivery[userId]!['id_endereco']);
      final subtotal = summary['subtotal'] as double;
      final desconto = ((body['desconto'] as num?)?.toDouble() ?? 0).clamp(0, subtotal).toDouble();
      final frete = body['frete_gratis'] == true ? 0.0 : summary['frete'] as double;
      final id = _next();
      final now = DateTime.now();
      orders.add({
        'id_pedido': id,
        'id_usuario': userId,
        'status': 'recebido',
        'tipo_entrega': delivery[userId]!['tipo_entrega'],
        'subtotal': subtotal,
        'frete': frete,
        'desconto': desconto,
        'total': subtotal + frete - desconto,
        'cupom': body['cupom'],
        'forma_pagamento': method['nome'],
        'pagamento': {
          'forma': method['codigo'],
          'forma_nome': method['nome'],
          'status': card != null ? 'aprovado' : 'pendente',
          'parcelas': installments,
          'valor': subtotal + frete - desconto,
          'cartao': card == null
              ? null
              : {
                  'id_cartao': card['id_cartao'],
                  'bandeira': card['destinatario'],
                  'ultimos_digitos': card['ultimos_digitos'],
                },
          'pix_copia_cola': method['codigo'] == 'pix' ? '00020126580014br.gov.bcb.pix$id' : null,
          'pix_expira_em': method['codigo'] == 'pix' ? now.add(const Duration(minutes: 30)) : null,
          'data_pagamento': card != null ? now : null,
        },
        'cep': address['cep'],
        'estado': address['estado'],
        'cidade': address['cidade'],
        'bairro': address['bairro'],
        'endereco': address['endereco'],
        'numero': address['numero'],
        'apelido': address['apelido'],
        'codigo_rastreio': null,
        'data_pedido': now,
        'itens': (summary['itens'] as List).map((i) => {...i as Map<String, dynamic>}).toList(),
        'historico': [
          {'status': 'recebido', 'observacao': 'Pedido recebido pela loja', 'data_hora': now, 'funcionario': null},
        ],
      });
      cart.clear();
      delivery.remove(userId);
      _notify(userId, 'Pedido ${_number(id)} recebido!', 'Recebemos seu pedido.', 'pedido', id);
      return json({'msg': 'Compra finalizada com sucesso', 'id_pedido': id, 'resumo': summary});
    }

    // favoritos
    final favs = favorites.putIfAbsent(userId, () => {});
    if (match('GET', '/favoritos')) {
      return json(favs.map((id) => {'id_favorito': id, ...products.firstWhere((p) => p['id_produto'] == id)}).toList());
    }
    if (match('POST', '/favoritos')) {
      return favs.add(body['id_produto'] as int)
          ? msg('Produto adicionado aos favoritos', 201)
          : msg('Produto já está nos favoritos', 400);
    }
    if (match('DELETE', r'/favoritos/\d+')) {
      return favs.remove(idAt(2)) ? msg('Produto removido dos favoritos') : msg('Favorito não encontrado', 404);
    }

    // endereços
    if (match('GET', r'/endereco/usuario/\d+')) return json(addresses.where((a) => a['id_usuario'] == userId).toList());
    if (match('POST', '/endereco')) {
      final id = _next();
      addresses.add({...body, 'id_endereco': id, 'id_usuario': userId, 'padrao': body['padrao'] == true ? 1 : 0});
      return json({'msg': 'Endereço cadastrado com sucesso', 'id': id}, 201);
    }
    if (match('PUT', r'/endereco/\d+')) {
      final address = addresses.firstWhere((a) => a['id_endereco'] == idAt(2));
      address.addAll({...body}..remove('padrao'));
      return msg('Endereço atualizado');
    }
    if (match('PATCH', r'/endereco/\d+/padrao')) {
      for (final a in addresses.where((a) => a['id_usuario'] == body['id_usuario'])) {
        a['padrao'] = a['id_endereco'] == body['id_endereco'] ? 1 : 0;
      }
      return msg('Endereço definido como padrão');
    }
    if (match('DELETE', r'/endereco/\d+')) {
      addresses.removeWhere((a) => a['id_endereco'] == idAt(2));
      return msg('Endereço removido');
    }

    // cartões
    final userCards = cards.where((c) => c['id_usuario'] == userId).toList()
      ..sort((a, b) => (b['padrao'] as int) - (a['padrao'] as int));
    if (match('GET', '/formas-pagamento')) return json(paymentMethods);
    if (match('GET', '/cartoes')) return json(userCards);
    if (match('POST', '/cartoes')) {
      if (body.containsKey('numero') || body.containsKey('cvv')) return msg('Não envie número completo nem CVV.', 400);
      if (!RegExp(r'^\d{4}$').hasMatch('${body['ultimos_digitos']}')) {
        return msg('ultimos_digitos deve ter exatamente 4 números', 400);
      }
      final id = _next();
      cards.add({...body, 'id_cartao': id, 'id_usuario': userId, 'padrao': userCards.isEmpty ? 1 : 0});
      return json({'msg': 'Cartão cadastrado com sucesso', 'id': id}, 201);
    }
    if (match('DELETE', r'/cartoes/\d+')) {
      cards.removeWhere((c) => c['id_cartao'] == idAt(2) && c['id_usuario'] == userId);
      return msg('Cartão removido');
    }

    // pets
    if (match('GET', '/pets')) return json(pets.where((p) => p['Id_usuario'] == userId).toList());
    if (match('GET', r'/pets/\d+')) {
      final pet = pets.where((p) => p['id_pet'] == idAt(2) && p['Id_usuario'] == userId).firstOrNull;
      return pet == null ? msg('Pet não encontrado', 404) : json(pet);
    }
    if (match('POST', '/pets')) {
      if (body['nome_pet'] == null || body['raca'] == null) return msg('Nome do pet e raça são obrigatórios.', 400);
      final id = _next();
      pets.add({
        ...body,
        'id_pet': id,
        'Id_usuario': userId,
        'id_coleira': null,
        'id_alimentador': null,
        'foto_url': null,
      });
      return json({'msg': 'Pet cadastrado com sucesso', 'id': id}, 201);
    }
    if (match('PUT', r'/pets/\d+')) {
      final pet = pets.firstWhere((p) => p['id_pet'] == idAt(2));
      body.forEach((key, value) => pet[key] = value ?? pet[key]);
      return msg('Pet atualizado');
    }
    if (match('DELETE', r'/pets/\d+')) {
      pets.removeWhere((p) => p['id_pet'] == idAt(2));
      return msg('Pet removido');
    }

    // lembretes (só os de pets do usuário, como o JOIN do backend)
    final myPets = {for (final p in pets.where((p) => p['Id_usuario'] == userId)) p['id_pet']: p['nome_pet']};
    Map<String, dynamic> reminderJson(Map<String, dynamic> r) => {...r, 'nome_pet': myPets[r['id_pet']]};
    final myReminders = reminders.where((r) => myPets.containsKey(r['id_pet'])).toList();
    if (match('GET', '/lembretes/proximos')) {
      final now = DateTime.now();
      return json(
        myReminders
            .where((r) => r['concluido'] == 0 && (r['data_hora'] as DateTime).isAfter(now))
            .map(reminderJson)
            .toList(),
      );
    }
    if (match('GET', '/lembretes')) {
      final parts = request.url.queryParameters['mes']!.split('-').map(int.parse).toList();
      return json(
        myReminders
            .where((r) {
              final date = r['data_hora'] as DateTime;
              return date.year == parts[0] && date.month == parts[1];
            })
            .map(reminderJson)
            .toList(),
      );
    }
    if (match('GET', r'/lembretes/\d+')) {
      final r = myReminders.where((r) => r['id_lembrete'] == idAt(2)).firstOrNull;
      return r == null ? msg('Lembrete não encontrado', 404) : json(reminderJson(r));
    }
    if (match('POST', '/lembretes')) {
      if (!myPets.containsKey(body['id_pet'])) return msg('Pet não encontrado', 404);
      final id = _next();
      reminders.add({
        ...body,
        'id_lembrete': id,
        'data_hora': DateTime.parse(body['data_hora'] as String),
        'concluido': 0,
      });
      return json({'msg': 'Lembrete cadastrado com sucesso', 'id': id}, 201);
    }
    if (match('PUT', r'/lembretes/\d+')) {
      final r = reminders.firstWhere((r) => r['id_lembrete'] == idAt(2));
      r.addAll({...body, if (body['data_hora'] != null) 'data_hora': DateTime.parse(body['data_hora'] as String)});
      return msg('Lembrete atualizado');
    }
    if (match('DELETE', r'/lembretes/\d+')) {
      reminders.removeWhere((r) => r['id_lembrete'] == idAt(2));
      return msg('Lembrete removido');
    }

    // blog
    if (match('GET', '/postBlog')) {
      final q = request.url.queryParameters;
      return json(
        posts
            .where((p) {
              if (p['ativo'] != 1) return false;
              if (q['categoria'] != null && '${p['id_categoria']}' != q['categoria']) return false;
              if (q['busca'] != null && !(p['titulo'] as String).toLowerCase().contains(q['busca']!.toLowerCase())) {
                return false;
              }
              if (q['meus'] == '1' && p['id_autor'] != userId) return false;
              return true;
            })
            .map((p) => {...p}..remove('conteudo'))
            .toList(),
      );
    }
    if (match('GET', r'/postBlog/\d+')) {
      final post = posts.where((p) => p['id_post'] == idAt(2)).firstOrNull;
      return post == null ? msg('Post não encontrado', 404) : json(post);
    }

    // pedidos
    Map<String, dynamic>? orderById(int id) => orders.where((o) => o['id_pedido'] == id).firstOrNull;
    final adminOrders =
        match('GET', '/pedidos/admin/todos') ||
        match('GET', '/pedidos/admin/resumo') ||
        match('PATCH', r'/pedidos/\d+/status') ||
        match('PATCH', r'/pedidos/\d+/pagamento');
    if (adminOrders && !isEmployee) return msg('Acesso restrito a funcionários', 403);
    if (match('GET', '/pedidos')) {
      return json(orders.where((o) => o['id_usuario'] == userId).toList().reversed.map(_orderJson).toList());
    }
    if (match('GET', '/pedidos/admin/todos')) {
      final status = request.url.queryParameters['status'];
      return json(
        orders.where((o) => status == null || o['status'] == status).toList().reversed.map(_orderJson).toList(),
      );
    }
    if (match('GET', '/pedidos/admin/resumo')) {
      final count = {for (final s in _labels.keys) s: orders.where((o) => o['status'] == s).length};
      final revenue = orders
          .where((o) => o['status'] != 'cancelado')
          .fold<double>(0, (s, o) => s + (o['total'] as double));
      return json({
        'por_status': count,
        'faturamento': revenue,
        'faturamento_hoje': revenue,
        'pedidos_hoje': orders.length,
      });
    }
    if (match('GET', r'/pedidos/\d+')) {
      final order = orderById(idAt(2));
      if (order == null || (!isEmployee && order['id_usuario'] != userId)) return msg('Pedido não encontrado', 404);
      return json(_orderJson(order));
    }
    if (match('PATCH', r'/pedidos/\d+/cancelar')) {
      final order = orderById(idAt(2));
      if (order == null || order['id_usuario'] != userId) return msg('Pedido não encontrado', 404);
      if (!['recebido', 'em_preparacao'].contains(order['status'])) {
        return msg('Esse pedido já saiu para entrega e não pode mais ser cancelado.', 400);
      }
      order['status'] = 'cancelado';
      final payment = order['pagamento'] as Map<String, dynamic>?;
      if (payment != null) payment['status'] = payment['status'] == 'aprovado' ? 'estornado' : 'cancelado';
      (order['historico'] as List).add({
        'status': 'cancelado',
        'observacao': 'Cancelado pelo cliente',
        'data_hora': DateTime.now(),
      });
      return json(_orderJson(order));
    }
    if (match('PATCH', r'/pedidos/\d+/pagamento')) {
      final order = orderById(idAt(2));
      if (order == null) return msg('Pedido não encontrado', 404);
      final payment = order['pagamento'] as Map<String, dynamic>?;
      if (payment == null) return msg('Este pedido não tem registro de pagamento.', 400);
      if (!(_nextPayment[payment['status']] ?? const []).contains(body['status'])) {
        return msg('Mudança de pagamento não permitida', 400);
      }
      payment['status'] = body['status'];
      if (body['status'] == 'aprovado') payment['data_pagamento'] = DateTime.now();
      _notify(
        order['id_usuario'] as int,
        'Pedido: pagamento ${body['status']}',
        'O pagamento mudou.',
        'pedido',
        order['id_pedido'] as int,
      );
      return json(_orderJson(order));
    }
    if (match('PATCH', r'/pedidos/\d+/status')) {
      final order = orderById(idAt(2));
      if (order == null) return msg('Pedido não encontrado', 404);
      if (!(_nextStatus[order['status']] ?? const []).contains(body['status'])) {
        return msg('Mudança de status não permitida', 400);
      }
      order['status'] = body['status'];
      if (body['codigo_rastreio'] != null) order['codigo_rastreio'] = body['codigo_rastreio'];
      (order['historico'] as List).add({
        'status': body['status'],
        'observacao': body['observacao'],
        'data_hora': DateTime.now(),
        'funcionario': 'Ana Funcionária',
      });
      _notify(
        order['id_usuario'] as int,
        'Pedido: ${_labels[body['status']]}',
        'Seu pedido mudou de etapa.',
        'pedido',
        order['id_pedido'] as int,
      );
      return json(_orderJson(order));
    }

    // notificações
    final myNotifications = notifications.where((n) => n['id_usuario'] == userId).toList();
    if (match('GET', '/notificacoes')) {
      return json({'nao_lidas': myNotifications.where((n) => n['lida'] == 0).length, 'notificacoes': myNotifications});
    }
    if (match('PATCH', '/notificacoes/lidas')) {
      for (final n in myNotifications) {
        n['lida'] = 1;
      }
      return msg('Notificações marcadas como lidas');
    }
    if (match('PATCH', r'/notificacoes/\d+/lida')) {
      for (final n in myNotifications.where((n) => n['id_notificacao'] == idAt(2))) {
        n['lida'] = 1;
      }
      return msg('Notificação lida');
    }
    if (match('DELETE', r'/notificacoes/\d+')) {
      notifications.removeWhere((n) => n['id_notificacao'] == idAt(2) && n['id_usuario'] == userId);
      return msg('Notificação removida');
    }

    // fale conosco
    Map<String, dynamic> messageJson(Map<String, dynamic> m) => {
      ...m,
      'funcionario': m['resposta'] == null ? null : 'Ana Funcionária',
    };
    if (match('POST', '/contato')) {
      if ((body['mensagem'] as String? ?? '').trim().length < 10) {
        return msg('A mensagem precisa ter entre 10 e 2000 caracteres', 400);
      }
      final user = users.firstWhere((u) => u['Id_usuario'] == userId);
      final id = _next();
      messages.add({
        'id_mensagem': id,
        'id_usuario': userId,
        'nome': user['nome_completo'],
        'email': user['email'],
        'assunto': body['assunto'],
        'mensagem': body['mensagem'],
        'status': 'aberta',
        'resposta': null,
        'data_envio': DateTime.now(),
      });
      return json({'msg': 'Mensagem enviada!', 'id': id, 'protocolo': _number(id)}, 201);
    }
    if (match('GET', '/contato/minhas')) {
      return json(messages.where((m) => m['id_usuario'] == userId).map(messageJson).toList().reversed.toList());
    }
    if (path.startsWith('/contato/') && !isEmployee) return msg('Acesso restrito a funcionários', 403);
    if (match('GET', '/contato/admin/todas')) return json(messages.map(messageJson).toList());
    if (match('PATCH', r'/contato/\d+/responder')) {
      final m = messages.firstWhere((m) => m['id_mensagem'] == idAt(2));
      m['resposta'] = body['resposta'];
      m['status'] = 'respondida';
      m['data_resposta'] = DateTime.now();
      if (m['id_usuario'] != null) {
        _notify(
          m['id_usuario'] as int,
          'Respondemos sua mensagem',
          '${body['resposta']}',
          'contato',
          m['id_mensagem'] as int,
        );
      }
      return json(messageJson(m));
    }
    if (match('PATCH', r'/contato/\d+/status')) {
      final m = messages.firstWhere((m) => m['id_mensagem'] == idAt(2));
      m['status'] = body['status'];
      return json(messageJson(m));
    }

    // blog: categorias, escrita e moderação
    if (match('GET', '/categoriaBlog')) return json(blogCategories);
    if (match('GET', '/postBlog/admin/todos')) {
      return isEmployee ? json(posts) : msg('Acesso restrito a funcionários', 403);
    }
    if (match('POST', '/postBlog')) {
      final id = _next();
      final category = blogCategories.firstWhere((c) => c['id_categoria'] == body['id_categoria']);
      posts.insert(0, {
        ...body,
        'id_post': id,
        'id_autor': isEmployee ? null : userId,
        'autor': isEmployee ? 'Ana · Equipe Happy Snouts' : 'layscintra_',
        'categoria_nome': category['nome'],
        'categoria_cor': category['cor'],
        'categoria_icone': category['icone'],
        'data_publicacao': DateTime.now().toUtc().toIso8601String(),
        'ativo': 1,
      });
      return json({'msg': 'Post cadastrado com sucesso', 'id_post': id}, 201);
    }
    if (match('PUT', r'/postBlog/\d+')) {
      posts.firstWhere((p) => p['id_post'] == idAt(2)).addAll(body);
      return msg('Post atualizado com sucesso');
    }
    if (match('DELETE', r'/postBlog/\d+')) {
      final post = posts.firstWhere((p) => p['id_post'] == idAt(2));
      if (!isEmployee && post['id_autor'] != userId) return msg('Você só pode excluir seus próprios posts', 403);
      post['ativo'] = 0;
      return msg('Post removido');
    }

    return msg('Rota não encontrada: $method $path', 404);
  }

  /// Tipo do token da última requisição (cliente ou funcionario).
  String? lastTokenType;
  final uploads = <String>[];

  int? _userFrom(http.Request request) {
    final header = request.headers['Authorization'];
    if (header == null || !header.startsWith('Bearer ')) return null;
    final parts = header.substring(7).split('.');
    if (parts.length != 3) return null;
    final payload = jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1])))) as Map<String, dynamic>;
    if ((payload['exp'] as int) * 1000 < DateTime.now().millisecondsSinceEpoch) return null;
    lastTokenType = payload['tipo'] as String?;
    return payload['id'] as int;
  }

  // O mysql2 manda DATETIME como data ISO em UTC.
  static Object? _encode(Object? value) => value is DateTime ? value.toUtc().toIso8601String() : value;
}

class FakeBackendOffline {
  static final http.Client client = MockClient((_) async => throw http.ClientException('Connection refused'));
}
