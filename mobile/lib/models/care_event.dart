/// Tipos de cuidado, cada um com uma cor própria no calendário.
/// São os mesmos tipos aceitos pelo backend (TIPOS_VALIDOS em lembretes.controller.js).
enum CareType { vacina, consulta, banhoETosa, remedio, outro }

extension CareTypeLabel on CareType {
  String get label {
    switch (this) {
      case CareType.vacina:
        return 'Vacina';
      case CareType.consulta:
        return 'Consulta';
      case CareType.banhoETosa:
        return 'Banho e Tosa';
      case CareType.remedio:
        return 'Remédio';
      case CareType.outro:
        return 'Outro';
    }
  }

  String get apiValue {
    switch (this) {
      case CareType.vacina:
        return 'vacina';
      case CareType.consulta:
        return 'consulta';
      case CareType.banhoETosa:
        return 'banho';
      case CareType.remedio:
        return 'remedio';
      case CareType.outro:
        return 'outro';
    }
  }

  static CareType fromApi(String? value) {
    return CareType.values.firstWhere((t) => t.apiValue == value, orElse: () => CareType.outro);
  }
}

class CareEvent {
  final String id;
  final DateTime date;
  final CareType type;
  final String title;
  final String petId;
  final String petName;

  final String time;

  const CareEvent({
    required this.id,
    required this.date,
    required this.type,
    required this.title,
    required this.petId,
    required this.petName,
    required this.time,
  });

  DateTime get dateTime {
    final parts = time.split(':');
    final hour = int.tryParse(parts.first) ?? 0;
    final minute = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    return DateTime(date.year, date.month, date.day, hour, minute);
  }
}
