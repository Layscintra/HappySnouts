class Address {
  final String id;

  final String nickname;
  final String street;
  final String number;
  final String neighborhood;
  final String city;
  final String state;
  final String cep;
  final bool isCurrent;

  const Address({
    required this.id,
    required this.street,
    required this.number,
    required this.neighborhood,
    required this.city,
    required this.state,
    required this.cep,
    this.nickname = '',
    this.isCurrent = false,
  });

  String get streetLine => number.isEmpty ? street : '$street, $number';

  String get summary => '$streetLine - $neighborhood, $city - $state';

  Address copyWith({
    String? nickname,
    String? street,
    String? number,
    String? neighborhood,
    String? city,
    String? state,
    String? cep,
    bool? isCurrent,
  }) {
    return Address(
      id: id,
      nickname: nickname ?? this.nickname,
      street: street ?? this.street,
      number: number ?? this.number,
      neighborhood: neighborhood ?? this.neighborhood,
      city: city ?? this.city,
      state: state ?? this.state,
      cep: cep ?? this.cep,
      isCurrent: isCurrent ?? this.isCurrent,
    );
  }
}
