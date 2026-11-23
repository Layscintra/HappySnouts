import 'package:happysnouts/models/address.dart';
import 'package:happysnouts/models/picked_photo.dart';
import 'package:happysnouts/models/user.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/utils/formatters.dart';

class RegistrationData {
  final String fullName;
  final String username;
  final String birthDate;
  final String cpf;
  final String phone;
  final String email;
  final String password;
  Address? address;

  PickedPhoto? photo;

  String emailCode = '';

  RegistrationData({
    required this.fullName,
    required this.username,
    required this.birthDate,
    required this.cpf,
    required this.phone,
    required this.email,
    required this.password,
    this.address,
    this.photo,
  });
}

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  final _api = ApiClient.instance;

  /// POST /auth/login: o mesmo login serve para cliente e funcionário:
  /// o backend reconhece pelo e-mail e devolve o token com o tipo certo.
  Future<String> login(String email, String password) async {
    try {
      final data = await _api.post('/auth/login', {'email': email.trim().toLowerCase(), 'senha': password});
      return _tokenFrom(data);
    } on ApiException catch (error) {
      // 404 = e-mail não cadastrado, 401 = senha errada: a mensagem é a mesma de propósito.
      if (error.statusCode == 404 || error.statusCode == 401) {
        throw const ServiceException('E-mail ou senha incorretos.');
      }
      rethrow; // 403 = funcionário inativo; 400 = conta sem senha, com a mensagem do backend
    }
  }

  Future<void> requestPasswordReset(String email) async {
    await _api.post('/auth/esqueci-senha', {'email': email.trim().toLowerCase()});
  }

  Future<void> verifyResetCode(String email, String code) async {
    await _api.post('/auth/verificar-codigo', {'email': email.trim().toLowerCase(), 'codigo': code.trim()});
  }

  Future<void> resetPassword(String email, String code, String newPassword) async {
    await _api.post('/auth/redefinir-senha', {
      'email': email.trim().toLowerCase(),
      'codigo': code.trim(),
      'nova_senha': newPassword,
    });
  }

  static String _tokenFrom(dynamic data) {
    final token = data is Map ? data['token'] as String? : null;
    if (token == null) throw const ServiceException('Resposta inesperada do servidor.');
    return token;
  }

  Future<void> register(RegistrationData data) async {
    final birth = Formatters.parseDate(data.birthDate);
    await _api.post('/auth/cliente/registrar', {
      'nome_completo': data.fullName.trim(),
      'nome_usuario': data.username.trim(),
      'email': data.email.trim().toLowerCase(),
      'cpf': Formatters.onlyDigits(data.cpf),
      'telefone': Formatters.onlyDigits(data.phone),
      'data_nascimento': birth == null ? null : Json.sqlDate(birth),
      'senha': data.password,
      'codigo_email': data.emailCode.trim(),
    });
  }

  /// POST /auth/cliente/codigo-cadastro: manda o código que confirma o e-mail
  /// antes de criar a conta. Se já pediu há menos de 1 minuto, o código anterior
  /// continua valendo; nesse caso devolve o aviso do backend em vez de dar erro.
  Future<String?> requestSignupCode(String email, String name) async {
    try {
      await _api.post('/auth/cliente/codigo-cadastro', {'email': email.trim().toLowerCase(), 'nome': name.trim()});
      return null;
    } on ApiException catch (error) {
      if (error.statusCode == 429) return error.message;
      rethrow;
    }
  }

  Future<AppUser> getProfile(int id) async {
    final data = await _api.get('/cliente/$id');
    if (data is! Map<String, dynamic>) throw const ServiceException('Resposta inesperada do servidor.');
    return userFromJson(data);
  }

  Future<AppUser> updateProfile(AppUser current, AppUser updated) async {
    final birth = Formatters.parseDate(updated.birthDate);
    await _api.put('/cliente/${current.id}', {
      'nome_completo': updated.fullName.trim(),
      'nome_usuario': updated.username.trim(),
      'email': updated.email.trim().toLowerCase(),
      'telefone': Formatters.onlyDigits(updated.phone),
      if (birth != null) 'data_nascimento': Json.sqlDate(birth),
    });
    return updated.copyWith(email: updated.email.trim().toLowerCase(), name: AppUser.shortNameFrom(updated.fullName));
  }

  Future<AppUser> updatePhoto(AppUser user, PickedPhoto photo) async {
    final path = await _api.uploadImage(photo.bytes, fileName: photo.fileName, mimeType: photo.mimeType);
    await _api.put('/cliente/${user.id}', {'foto_url': path});
    return user.copyWith(avatarUrl: ApiClient.imageUrl(path));
  }

  Future<void> changePassword(AppUser user, String currentPassword, String newPassword) async {
    try {
      // Senha atual errada responde 401: não pode cair no "sessão expirada".
      await _api.put('/cliente/${user.id}/senha', {'senha_atual': currentPassword, 'nova_senha': newPassword}, false);
    } on ApiException catch (error) {
      if (error.statusCode == 401) throw const ServiceException('A senha atual está incorreta.');
      rethrow;
    }
  }

  static AppUser userFromJson(Map<String, dynamic> json) {
    final fullName = Json.text(json['nome_completo']);
    final birth = Json.toDate(json['data_nascimento']);
    return AppUser(
      id: Json.text(json['Id_usuario'] ?? json['id_usuario']),
      name: AppUser.shortNameFrom(fullName),
      fullName: fullName,
      email: Json.text(json['email']),
      phone: Formatters.phone(Json.text(json['telefone'])),
      username: Json.text(json['nome_usuario']),
      avatarUrl: ApiClient.imageUrl(json['foto_url'] as String?),
      birthDate: birth == null ? '' : Formatters.date(birth),
    );
  }
}
