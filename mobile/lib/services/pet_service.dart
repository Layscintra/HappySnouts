import 'dart:convert';

import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/models/picked_photo.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/preferences_service.dart';
import 'package:happysnouts/services/service_exception.dart';

/// Pets do usuário (rotas /pets do backend).
///
/// O backend guarda nome, raça, idade (em anos), peso e foto. Espécie, sexo,
/// datas, vacinas, alimentação e observações ainda não têm coluna no banco,
/// então ficam salvos no aparelho, ligados ao id do pet.
class PetService {
  PetService._();
  static final PetService instance = PetService._();

  final _api = ApiClient.instance;

  Future<List<Pet>> getPets() async {
    final data = await _api.get('/pets');
    return List.unmodifiable(Json.list(data).map(_fromJson));
  }

  Future<Pet> getPet(String id) async {
    try {
      final data = await _api.get('/pets/$id');
      if (data is! Map<String, dynamic>) throw const ServiceException('Pet não encontrado.');
      return _fromJson(data);
    } on ApiException catch (error) {
      if (error.statusCode == 404) throw const ServiceException('Pet não encontrado.');
      rethrow;
    }
  }

  /// Cria (id vazio) ou atualiza um pet. Com [photo], envia a foto antes (POST /upload).
  Future<Pet> save(Pet pet, {PickedPhoto? photo}) async {
    final body = {
      'nome_pet': pet.name,
      'raca': pet.breed,
      'idade_pet': pet.birthDate == null ? pet.ageYears : _fullYears(pet.birthDate!),
      'peso_atual': pet.weightKg,
      if (photo != null)
        'foto_url': await _api.uploadImage(photo.bytes, fileName: photo.fileName, mimeType: photo.mimeType),
    };
    var id = pet.id;
    if (id.isEmpty) {
      final data = await _api.post('/pets', body);
      id = Json.text(data is Map ? data['id'] : null);
    } else {
      await _api.put('/pets/$id', body);
    }
    await PreferencesService.instance.setPetExtras(id, jsonEncode(_extrasToJson(pet)));
    final saved = await getPet(id);
    AppEvents.changed(DataTopic.pets);
    return saved;
  }

  /// Liga uma coleira ([collar] = true) ou um alimentador ao pet, pelo código
  /// do aparelho (PUT /pets/:id com id_coleira ou id_alimentador).
  Future<void> connectDevice(Pet pet, {required bool collar, required int deviceCode}) async {
    await _api.put('/pets/${pet.id}', {
      'nome_pet': pet.name,
      'raca': pet.breed,
      collar ? 'id_coleira' : 'id_alimentador': deviceCode,
    });
    AppEvents.changed(DataTopic.pets);
  }

  Future<void> disconnectDevice(Pet pet, {required bool collar}) async {
    await _api.put('/pets/${pet.id}', {
      'nome_pet': pet.name,
      'raca': pet.breed,
      collar ? 'id_coleira' : 'id_alimentador': null,
    });
    AppEvents.changed(DataTopic.pets);
  }

  Future<void> delete(String id) async {
    await _api.delete('/pets/$id');
    await PreferencesService.instance.setPetExtras(id, null);
    AppEvents.changedAll(const [DataTopic.pets, DataTopic.reminders]);
  }

  static int _fullYears(DateTime birth) {
    final now = DateTime.now();
    var years = now.year - birth.year;
    if (now.month < birth.month || (now.month == birth.month && now.day < birth.day)) years--;
    return years < 0 ? 0 : years;
  }

  static Map<String, dynamic> _extrasToJson(Pet pet) => {
    'species': pet.species,
    'sex': pet.sex,
    'birthDate': pet.birthDate?.toIso8601String(),
    'dewormingDate': pet.dewormingDate?.toIso8601String(),
    'vaccinesUpToDate': pet.vaccinesUpToDate,
    'feeding': pet.feeding,
    'observation': pet.observation,
  };

  static Pet _fromJson(Map<String, dynamic> json) {
    final id = Json.text(json['id_pet']);
    Map<String, dynamic> extras = const {};
    final saved = PreferencesService.instance.petExtras(id);
    if (saved != null) {
      try {
        extras = jsonDecode(saved) as Map<String, dynamic>;
      } catch (_) {}
    }
    DateTime? date(String key) => extras[key] == null ? null : DateTime.tryParse(extras[key] as String);
    return Pet(
      id: id,
      name: Json.text(json['nome_pet']),
      breed: Json.text(json['raca']),
      ageYears: Json.toInt(json['idade_pet']),
      weightKg: Json.toDouble(json['peso_atual']),
      imageUrl: ApiClient.imageUrl(json['foto_url'] as String?),
      hasTracker: json['id_coleira'] != null,
      collarId: json['id_coleira'] == null ? null : Json.text(json['id_coleira']),
      feederId: json['id_alimentador'] == null ? null : Json.text(json['id_alimentador']),
      species: extras['species'] as String? ?? 'Cachorro',
      sex: extras['sex'] as String? ?? '',
      birthDate: date('birthDate'),
      dewormingDate: date('dewormingDate'),
      vaccinesUpToDate: extras['vaccinesUpToDate'] as bool? ?? false,
      feeding: extras['feeding'] as String? ?? '',
      observation: extras['observation'] as String? ?? '',
    );
  }
}
