import 'package:happysnouts/data/mock_feeder.dart';
import 'package:happysnouts/models/feeder.dart';
import 'package:happysnouts/services/service_exception.dart';

/// Comedouro automático.
///
/// INTEGRAÇÃO: depende do aparelho físico e do serviço que se comunica com
/// ele. Sem essa integração, tudo aqui é uma simulação em memória para
/// demonstração: status de conexão (que dá para alternar), nível do
/// reservatório, liberação manual de porção e histórico de refeições.
class FeederService {
  FeederService._();
  static final FeederService instance = FeederService._();

  /// Cada porção do comedouro libera 90 g.
  static const gramsPerPortion = 90;

  late Feeder _feeder = mockFeeder.copyWith(history: _seedHistory(DateTime.now()));

  Future<Feeder> getFeeder() async {
    await localDelay();
    return _feeder;
  }

  Future<Feeder> saveSchedule(List<FeedingSchedule> schedule) async {
    await localDelay();
    final times = schedule.map((s) => s.time).toSet();
    if (times.length != schedule.length) {
      throw const ServiceException('Já existe uma refeição programada neste horário.');
    }
    final sorted = [...schedule]..sort((a, b) => a.minutesOfDay.compareTo(b.minutesOfDay));
    _feeder = _feeder.copyWith(schedule: List.unmodifiable(sorted));
    return _feeder;
  }

  Future<Feeder> setMealEnabled(FeedingSchedule meal, bool enabled) async {
    _feeder = _feeder.copyWith(
      schedule: [for (final s in _feeder.schedule) s.time == meal.time ? s.copyWith(enabled: enabled) : s],
    );
    return _feeder;
  }

  Future<Feeder> setConnected(bool connected) async {
    await localDelay();
    _feeder = _feeder.copyWith(isConnected: connected);
    return _feeder;
  }

  Future<Feeder> dispensePortion() async {
    await Future<void>.delayed(const Duration(milliseconds: 1200));
    if (!_feeder.isConnected) throw const ServiceException('O comedouro está desconectado.');
    if (_feeder.reservoirGrams < gramsPerPortion) {
      throw const ServiceException('Reservatório quase vazio. Reabasteça o comedouro.');
    }
    _feeder = _feeder.copyWith(
      reservoirGrams: _feeder.reservoirGrams - gramsPerPortion,
      history: [
        MealLog(time: DateTime.now(), grams: gramsPerPortion, status: MealStatus.manual),
        ..._feeder.history,
      ],
    );
    return _feeder;
  }

  static List<MealLog> _seedHistory(DateTime now) {
    final logs = <MealLog>[];
    for (final dayOffset in [0, 1]) {
      final day = DateTime(now.year, now.month, now.day).subtract(Duration(days: dayOffset));
      for (final meal in mockFeeder.schedule.reversed) {
        final at = day.add(Duration(minutes: meal.minutesOfDay));
        if (at.isAfter(now)) continue;
        final late = meal.time == '12:00' && dayOffset == 1;
        logs.add(
          MealLog(
            time: late ? at.add(const Duration(minutes: 4)) : at,
            grams: meal.grams,
            status: late ? MealStatus.late : MealStatus.onTime,
            delayMinutes: late ? 4 : 0,
          ),
        );
      }
    }
    return logs;
  }
}
