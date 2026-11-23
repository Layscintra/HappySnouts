import 'package:happysnouts/models/payment_card.dart';
import 'package:happysnouts/models/payment_method.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/service_exception.dart';

/// Cartões salvos do usuário (rotas /cartoes do backend) e formas de pagamento.
///
/// SEGURANÇA: como no site, o app nunca pede o número completo nem o CVV.
/// O backend recebe só a bandeira, o nome e os 4 últimos dígitos.
class PaymentService {
  PaymentService._();
  static final PaymentService instance = PaymentService._();

  final _api = ApiClient.instance;

  Future<List<PaymentMethod>> getMethods() async {
    final data = await _api.get('/formas-pagamento');
    return List.unmodifiable(
      Json.list(data).map(
        (json) => PaymentMethod(
          id: Json.text(json['id_forma_pagamento']),
          code: Json.text(json['codigo']),
          name: Json.text(json['nome']),
          usesCard: Json.toBool(json['usa_cartao']),
          maxInstallments: Json.toInt(json['max_parcelas']) ?? 1,
        ),
      ),
    );
  }

  Future<List<PaymentCard>> getCards() async {
    final data = await _api.get('/cartoes');
    return List.unmodifiable(Json.list(data).map(_fromJson));
  }

  Future<PaymentCard> addCard({required String brand, required String last4, required String holderName}) async {
    if (!RegExp(r'^\d{4}$').hasMatch(last4)) throw const ServiceException('Digite os 4 últimos dígitos do cartão.');
    final cards = await getCards();
    if (cards.any((c) => c.last4 == last4 && c.brand == brand)) {
      throw const ServiceException('Este cartão já está cadastrado.');
    }
    final name = holderName.trim().toUpperCase();
    final data = await _api.post('/cartoes', {
      'destinatario': brand,
      'ultimos_digitos': last4,
      'nome_titular': name,
      'icone': brand.toLowerCase().replaceAll(' ', '-'),
    });
    AppEvents.changed(DataTopic.cards);
    return PaymentCard(id: Json.text(data is Map ? data['id'] : null), last4: last4, brand: brand, holderName: name);
  }

  Future<void> removeCard(String id) async {
    await _api.delete('/cartoes/$id');
    AppEvents.changed(DataTopic.cards);
  }

  static PaymentCard _fromJson(Map<String, dynamic> json) {
    final brand = Json.text(json['destinatario']);
    return PaymentCard(
      id: Json.text(json['id_cartao']),
      last4: Json.text(json['ultimos_digitos']),
      brand: brand.isEmpty ? 'Cartão' : brand,
      holderName: Json.text(json['nome_titular']),
      isDefault: Json.toBool(json['padrao']),
    );
  }
}
