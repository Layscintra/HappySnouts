class AppUser {
  final String id;
  final String name;
  final String fullName;
  final String email;
  final String phone;
  final String avatarUrl;
  final String username;
  final String cpf;
  final String birthDate;

  const AppUser({
    this.id = '',
    required this.name,
    required this.email,
    required this.phone,
    this.fullName = '',
    this.avatarUrl = '',
    this.username = '',
    this.cpf = '',
    this.birthDate = '',
  });

  AppUser copyWith({
    String? name,
    String? fullName,
    String? email,
    String? phone,
    String? avatarUrl,
    String? username,
    String? cpf,
    String? birthDate,
  }) {
    return AppUser(
      id: id,
      name: name ?? this.name,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      username: username ?? this.username,
      cpf: cpf ?? this.cpf,
      birthDate: birthDate ?? this.birthDate,
    );
  }

  static String shortNameFrom(String fullName) {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    if (parts.length <= 1) return fullName.trim();
    return '${parts.first} ${parts.last}';
  }
}
