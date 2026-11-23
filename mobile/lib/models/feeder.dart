class FeedingSchedule {
  final String time;
  final int portions;
  final int grams;

  /// Desligado: o horário fica salvo, mas o comedouro não libera a ração.
  final bool enabled;

  const FeedingSchedule({required this.time, required this.portions, required this.grams, this.enabled = true});

  int get minutesOfDay {
    final parts = time.split(':');
    return int.parse(parts[0]) * 60 + int.parse(parts[1]);
  }

  FeedingSchedule copyWith({bool? enabled}) =>
      FeedingSchedule(time: time, portions: portions, grams: grams, enabled: enabled ?? this.enabled);
}

enum MealStatus { onTime, late, manual }

class MealLog {
  final DateTime time;
  final int grams;
  final MealStatus status;

  /// Minutos de atraso (só quando [status] é [MealStatus.late]).
  final int delayMinutes;

  const MealLog({required this.time, required this.grams, required this.status, this.delayMinutes = 0});
}

class Feeder {
  final String name;
  final bool isConnected;
  final int batteryPercent;
  final List<FeedingSchedule> schedule;

  final int capacityGrams;
  final int reservoirGrams;
  final List<MealLog> history;

  const Feeder({
    required this.name,
    required this.isConnected,
    required this.batteryPercent,
    required this.schedule,
    this.capacityGrams = 2000,
    this.reservoirGrams = 1560,
    this.history = const [],
  });

  Feeder copyWith({List<FeedingSchedule>? schedule, bool? isConnected, int? reservoirGrams, List<MealLog>? history}) {
    return Feeder(
      name: name,
      isConnected: isConnected ?? this.isConnected,
      batteryPercent: batteryPercent,
      schedule: schedule ?? this.schedule,
      capacityGrams: capacityGrams,
      reservoirGrams: reservoirGrams ?? this.reservoirGrams,
      history: history ?? this.history,
    );
  }

  double get reservoirLevel => capacityGrams == 0 ? 0 : (reservoirGrams / capacityGrams).clamp(0, 1);

  List<FeedingSchedule> get activeSchedule => schedule.where((s) => s.enabled).toList();

  int get dailyGrams => activeSchedule.fold(0, (sum, s) => sum + s.grams);

  /// Próxima refeição ativa a partir de [now] (hoje ou amanhã).
  /// Retorna null se não houver nenhuma programação ativa.
  ({FeedingSchedule meal, bool isToday})? nextMeal(DateTime now) {
    final active = activeSchedule;
    if (active.isEmpty) return null;
    final sorted = [...active]..sort((a, b) => a.minutesOfDay.compareTo(b.minutesOfDay));
    final nowMinutes = now.hour * 60 + now.minute;
    for (final meal in sorted) {
      if (meal.minutesOfDay > nowMinutes) return (meal: meal, isToday: true);
    }
    return (meal: sorted.first, isToday: false);
  }
}
