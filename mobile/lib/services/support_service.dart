import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/service_exception.dart';

enum MessageStatus { aberta, respondida, fechada }

extension MessageStatusLabel on MessageStatus {
  String get label {
    switch (this) {
      case MessageStatus.aberta:
        return 'Aguardando resposta';
      case MessageStatus.respondida:
        return 'Respondida';
      case MessageStatus.fechada:
        return 'Encerrada';
    }
  }

  static MessageStatus fromApi(String? value) =>
      MessageStatus.values.firstWhere((s) => s.name == value, orElse: () => MessageStatus.aberta);
}

class ContactMessage {
  final String id;
  final String name;
  final String email;
  final String subject;
  final String message;
  final MessageStatus status;
  final String reply;
  final String employee;
  final DateTime sentAt;
  final DateTime? repliedAt;

  const ContactMessage({
    required this.id,
    required this.name,
    required this.email,
    required this.subject,
    required this.message,
    required this.status,
    required this.reply,
    required this.employee,
    required this.sentAt,
    this.repliedAt,
  });

  String get protocol => '#${id.padLeft(5, '0')}';
}

/// Fale conosco (rotas /contato do backend). A mensagem fica no banco, o
/// cliente recebe confirmação por e-mail e a equipe responde pelo painel.
class SupportService {
  SupportService._();
  static final SupportService instance = SupportService._();

  static const subjects = ['Dúvida', 'Pedido', 'Problema no app', 'Dispositivos', 'Sugestão', 'Outro'];

  final _api = ApiClient.instance;

  Future<String> sendMessage({required String subject, required String message}) async {
    if (message.trim().length < 10) {
      throw const ServiceException('Escreva uma mensagem com pelo menos 10 caracteres.');
    }
    final data = await _api.post('/contato', {'assunto': subject, 'mensagem': message.trim()});
    AppEvents.changed(DataTopic.messages);
    return Json.text(data is Map ? data['protocolo'] : null);
  }

  Future<List<ContactMessage>> getMyMessages() async {
    final data = await _api.get('/contato/minhas');
    return Json.list(data).map(_fromJson).toList();
  }

  Future<List<ContactMessage>> getAllMessages() async {
    final data = await _api.get('/contato/admin/todas');
    return Json.list(data).map(_fromJson).toList();
  }

  Future<ContactMessage> reply(String id, String reply) async {
    final data = await _api.patch('/contato/$id/responder', {'resposta': reply.trim()});
    AppEvents.changed(DataTopic.messages);
    return _fromJson(data as Map<String, dynamic>);
  }

  Future<ContactMessage> setStatus(String id, MessageStatus status) async {
    final data = await _api.patch('/contato/$id/status', {'status': status.name});
    AppEvents.changed(DataTopic.messages);
    return _fromJson(data as Map<String, dynamic>);
  }

  static ContactMessage _fromJson(Map<String, dynamic> json) => ContactMessage(
    id: Json.text(json['id_mensagem']),
    name: Json.text(json['nome']),
    email: Json.text(json['email']),
    subject: Json.text(json['assunto']),
    message: Json.text(json['mensagem']),
    status: MessageStatusLabel.fromApi(json['status'] as String?),
    reply: Json.text(json['resposta']),
    employee: Json.text(json['funcionario']),
    sentAt: Json.toDate(json['data_envio']) ?? DateTime.now(),
    repliedAt: Json.toDate(json['data_resposta']),
  );
}
