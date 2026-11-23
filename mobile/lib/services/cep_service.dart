import 'package:happysnouts/services/api_client.dart';

class CepResult {
  final String street;
  final String neighborhood;
  final String city;
  final String state;

  const CepResult({required this.street, required this.neighborhood, required this.city, required this.state});
}

/// Busca o endereço de um CEP pelo nosso backend (GET /cep/:cep).
/// O backend consulta o ViaCEP e, se ele cair, a BrasilAPI.
class CepService {
  CepService._();

  static Future<CepResult?> buscar(String cep) async {
    final digits = cep.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 8) return null;
    try {
      final data = await ApiClient.instance.get('/cep/$digits');
      if (data is! Map) return null;
      return CepResult(
        street: (data['rua'] ?? '').toString(),
        neighborhood: (data['bairro'] ?? '').toString(),
        city: (data['cidade'] ?? '').toString(),
        state: (data['estado'] ?? '').toString(),
      );
    } catch (_) {
      return null;
    }
  }
}
