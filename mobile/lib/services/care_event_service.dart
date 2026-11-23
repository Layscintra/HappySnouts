import 'package:happysnouts/models/care_event.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/app_events.dart';

class CareEventService {
  CareEventService._();
  static final CareEventService instance = CareEventService._();

  final _api = ApiClient.instance;

  /// Meses buscados a partir do atual: o backend lista por mês (?mes=AAAA-MM).
  static const int monthsBefore = 3;
  static const int monthsAfter = 12;

  Future<List<CareEvent>> getEvents({String? petId}) async {
    final now = DateTime.now();
    final months = [for (var i = -monthsBefore; i <= monthsAfter; i++) DateTime(now.year, now.month + i, 1)];
    final pages = await Future.wait(
      months.map((m) {
        return _api.get('/lembretes', query: {'mes': '${m.year}-${m.month.toString().padLeft(2, '0')}'});
      }),
    );
    final list = pages.expand(Json.list).map(_fromJson).where((e) => petId == null || e.petId == petId).toList()
      ..sort((a, b) => a.dateTime.compareTo(b.dateTime));
    return list;
  }

  Future<List<CareEvent>> getUpcoming({int days = 7}) async {
    final data = await _api.get('/lembretes/proximos', query: {'limite': '50'});
    final limit = DateTime.now().add(Duration(days: days));
    return Json.list(data).map(_fromJson).where((e) => e.dateTime.isBefore(limit)).toList();
  }

  /// Mesmo limite do backend e do site para o título do lembrete.
  static const titleMaxLength = 100;

  Future<CareEvent> save(CareEvent event) async {
    final body = {'titulo': event.title, 'tipo': event.type.apiValue, 'data_hora': Json.sqlDateTime(event.dateTime)};
    var id = event.id;
    if (id.isNotEmpty) {
      // O backend não troca o pet de um lembrete, e a tela não deixa trocar ao editar.
      // O PUT só muda título, tipo e data: observação, cor e recorrência (do site) continuam.
      await _api.put('/lembretes/$id', body);
      AppEvents.changed(DataTopic.reminders);
      return event;
    }
    final data = await _api.post('/lembretes', {...body, 'id_pet': int.parse(event.petId)});
    id = Json.text(data is Map ? data['id'] : null);
    AppEvents.changed(DataTopic.reminders);
    return CareEvent(
      id: id,
      date: event.date,
      type: event.type,
      title: event.title,
      petId: event.petId,
      petName: event.petName,
      time: event.time,
    );
  }

  Future<void> delete(String id) async {
    await _api.delete('/lembretes/$id');
    AppEvents.changed(DataTopic.reminders);
  }

  /// Os lembretes de um pet excluído deixam de aparecer junto com ele (o backend
  /// lista lembretes juntando com a tabela de pets), então não há o que fazer aqui.
  Future<void> deleteByPet(String petId) async {}

  static CareEvent _fromJson(Map<String, dynamic> json) {
    final dateTime = Json.toDate(json['data_hora']) ?? DateTime.now();
    return CareEvent(
      id: Json.text(json['id_lembrete']),
      date: DateTime(dateTime.year, dateTime.month, dateTime.day),
      type: CareTypeLabel.fromApi(json['tipo'] as String?),
      title: Json.text(json['titulo']),
      petId: Json.text(json['id_pet']),
      petName: Json.text(json['nome_pet']),
      time: '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}',
    );
  }
}
