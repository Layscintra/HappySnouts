import 'package:happysnouts/models/address.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/service_exception.dart';

class AddressService {
  AddressService._();
  static final AddressService instance = AddressService._();

  final _api = ApiClient.instance;

  Future<List<Address>> getAddresses() async {
    final data = await _api.get('/endereco/usuario/${_userId()}');
    final list = Json.list(data).map(_fromJson).toList();
    return list..sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
  }

  Future<Address> save(Address address) async {
    final existing = await getAddresses();
    final isFirst = existing.where((a) => a.id != address.id).isEmpty;
    final body = {
      'cep': address.cep,
      'estado': address.state.toUpperCase(),
      'cidade': address.city,
      'bairro': address.neighborhood,
      'endereco': address.street,
      'numero': address.number.isEmpty ? 'S/N' : address.number,
      'apelido': address.nickname.isEmpty ? null : address.nickname,
      'padrao': isFirst,
    };

    var id = address.id;
    if (id.isEmpty) {
      final data = await _api.post('/endereco', body);
      id = Json.text(data is Map ? data['id'] : null);
    } else {
      await _api.put('/endereco/$id', body);
    }

    final wasCurrent = existing.any((a) => a.id == id && a.isCurrent);
    if (id.isNotEmpty && !isFirst && address.isCurrent && !wasCurrent) await setCurrent(id);
    AppEvents.changed(DataTopic.addresses);
    return Address(
      id: id,
      nickname: address.nickname,
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      cep: address.cep,
      isCurrent: isFirst || address.isCurrent,
    );
  }

  /// PATCH /endereco/:id/padrao (o backend usa o usuário do token e o id da URL; o corpo é ignorado).
  Future<void> setCurrent(String id) async {
    await _api.patch('/endereco/$id/padrao', {'id_usuario': _userId(), 'id_endereco': int.parse(id)});
    AppEvents.changed(DataTopic.addresses);
  }

  Future<void> delete(String id) async {
    final before = await getAddresses();
    await _api.delete('/endereco/$id');
    // Se o endereço atual foi removido, o próximo da lista assume.
    final removedCurrent = before.any((a) => a.id == id && a.isCurrent);
    final remaining = before.where((a) => a.id != id).toList();
    if (removedCurrent && remaining.isNotEmpty) await setCurrent(remaining.first.id);
    AppEvents.changed(DataTopic.addresses);
  }

  int _userId() {
    final id = _api.userId;
    if (id == null) throw const ServiceException('Sua sessão expirou. Entre novamente.');
    return id;
  }

  static Address _fromJson(Map<String, dynamic> json) {
    return Address(
      id: Json.text(json['id_endereco']),
      nickname: Json.text(json['apelido']),
      street: Json.text(json['endereco']),
      number: Json.text(json['numero']),
      neighborhood: Json.text(json['bairro']),
      city: Json.text(json['cidade']),
      state: Json.text(json['estado']),
      cep: Json.text(json['cep']),
      isCurrent: Json.toBool(json['padrao']),
    );
  }
}
