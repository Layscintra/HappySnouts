import 'package:happysnouts/utils/formatters.dart';

class Pet {
  final String id;
  final String name;
  final String species;
  final String breed;
  final String imageUrl;
  final String sex;
  final double? weightKg;
  final DateTime? birthDate;

  /// Idade em anos guardada no backend (idade_pet), usada quando não há data de nascimento.
  final int? ageYears;
  final DateTime? dewormingDate;
  final bool vaccinesUpToDate;
  final String feeding;
  final String observation;

  final int batteryPercent;
  final bool isOnline;
  final String lastUpdate;
  final String address;
  final bool hasTracker;

  /// Ids dos aparelhos ligados ao pet no backend (id_coleira e id_alimentador).
  final String? collarId;
  final String? feederId;

  const Pet({
    required this.id,
    required this.name,
    required this.breed,
    this.species = 'Cachorro',
    this.imageUrl = '',
    this.sex = '',
    this.weightKg,
    this.birthDate,
    this.ageYears,
    this.dewormingDate,
    this.vaccinesUpToDate = false,
    this.feeding = '',
    this.observation = '',
    this.batteryPercent = 0,
    this.isOnline = false,
    this.lastUpdate = '',
    this.address = '',
    this.hasTracker = false,
    this.collarId,
    this.feederId,
  });

  String get age {
    if (birthDate != null) return Formatters.age(birthDate!);
    if (ageYears == null) return '';
    if (ageYears == 0) return 'Menos de 1 ano';
    return ageYears == 1 ? '1 ano' : '$ageYears anos';
  }

  Pet copyWith({
    String? name,
    String? species,
    String? breed,
    String? sex,
    double? weightKg,
    DateTime? birthDate,
    DateTime? dewormingDate,
    bool? vaccinesUpToDate,
    String? feeding,
    String? observation,
  }) {
    return Pet(
      id: id,
      name: name ?? this.name,
      species: species ?? this.species,
      breed: breed ?? this.breed,
      imageUrl: imageUrl,
      sex: sex ?? this.sex,
      weightKg: weightKg ?? this.weightKg,
      birthDate: birthDate ?? this.birthDate,
      ageYears: ageYears,
      dewormingDate: dewormingDate ?? this.dewormingDate,
      vaccinesUpToDate: vaccinesUpToDate ?? this.vaccinesUpToDate,
      feeding: feeding ?? this.feeding,
      observation: observation ?? this.observation,
      batteryPercent: batteryPercent,
      isOnline: isOnline,
      lastUpdate: lastUpdate,
      address: address,
      hasTracker: hasTracker,
      collarId: collarId,
      feederId: feederId,
    );
  }
}
