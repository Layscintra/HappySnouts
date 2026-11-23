import 'package:flutter/material.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/services/support_service.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/utils/validators.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';

class ContactScreen extends StatefulWidget {
  final bool showMessages;

  const ContactScreen({super.key, this.showMessages = false});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> with ReloadOnChange {
  final _formKey = GlobalKey<FormState>();
  final _message = TextEditingController();
  String _subject = SupportService.subjects.first;
  bool _sending = false;
  late Future<List<ContactMessage>> _future;

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.messages];

  @override
  void initState() {
    super.initState();
    reload();
  }

  @override
  void reload() => _future = SupportService.instance.getMyMessages();

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _send(TabController tabs) async {
    if (_sending || !_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _sending = true);
    try {
      final protocol = await SupportService.instance.sendMessage(subject: _subject, message: _message.text);
      if (!mounted) return;
      _message.clear();
      _formKey.currentState!.reset();
      setState(() => _sending = false);
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          icon: const Icon(Icons.mark_email_read_outlined, color: AppColors.green, size: 40),
          title: const Text('Mensagem enviada!'),
          content: Text(
            'Protocolo $protocol. Enviamos uma confirmação para o seu e-mail e respondemos em até 1 dia útil. '
            'Você recebe um aviso no app quando a resposta chegar.',
          ),
          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
        ),
      );
      tabs.animateTo(1);
    } catch (error) {
      if (!mounted) return;
      setState(() => _sending = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      initialIndex: widget.showMessages ? 1 : 0,
      child: Builder(
        builder: (context) {
          final tabs = DefaultTabController.of(context);
          return Scaffold(
            appBar: AppBar(
              title: const Text('Fale conosco'),
              bottom: const TabBar(
                tabs: [
                  Tab(text: 'Nova mensagem'),
                  Tab(text: 'Minhas mensagens'),
                ],
              ),
            ),
            body: TabBarView(children: [_buildForm(tabs), _buildMessages()]),
          );
        },
      ),
    );
  }

  Widget _buildForm(TabController tabs) {
    final palette = context.palette;
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AppCard(
            child: Row(
              children: [
                const IconBadge(icon: Icons.support_agent_rounded, color: AppColors.orangeStrong, size: 50),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Como podemos ajudar?',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: palette.title),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Respondemos em até 1 dia útil, por e-mail e aqui no app.',
                        style: TextStyle(fontSize: 12.5, color: palette.muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Assunto',
            style: TextStyle(fontWeight: FontWeight.w700, color: palette.text),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: SupportService.subjects.map((subject) {
              return ChoiceChip(
                label: Text(subject),
                selected: _subject == subject,
                showCheckmark: false,
                onSelected: (_) => setState(() => _subject = subject),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),
          OutlinedTextField(
            controller: _message,
            label: 'Mensagem',
            hint: 'Conte com detalhes o que aconteceu ou o que você precisa',
            maxLines: 6,
            maxLength: 2000,
            textCapitalization: TextCapitalization.sentences,
            validator: (value) {
              final error = Validators.required(value);
              if (error != null) return error;
              if (value!.trim().length < 10) return 'Escreva pelo menos 10 caracteres';
              return null;
            },
          ),
          const SizedBox(height: 16),
          LoadingButton(
            label: 'Enviar mensagem',
            icon: Icons.send_rounded,
            loading: _sending,
            onPressed: () => _send(tabs),
          ),
        ],
      ),
    );
  }

  Widget _buildMessages() {
    return RefreshIndicator(
      onRefresh: () async {
        setState(reload);
        await _future.catchError((_) => <ContactMessage>[]);
      },
      child: FutureStateBuilder<List<ContactMessage>>(
        future: _future,
        onRetry: () => setState(reload),
        builder: (context, messages) {
          if (messages.isEmpty) {
            return ListView(
              children: const [
                SizedBox(height: 60),
                EmptyView(
                  icon: Icons.forum_outlined,
                  title: 'Nenhuma mensagem ainda',
                  message: 'Suas conversas com a equipe Happy Snouts aparecem aqui.',
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: messages.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, i) => ContactMessageCard(message: messages[i]),
          );
        },
      ),
    );
  }
}

class ContactMessageCard extends StatelessWidget {
  final ContactMessage message;
  final bool showSender;
  final Widget? footer;

  const ContactMessageCard({super.key, required this.message, this.showSender = false, this.footer});

  static Color statusColor(MessageStatus status) {
    switch (status) {
      case MessageStatus.aberta:
        return AppColors.orangeStrong;
      case MessageStatus.respondida:
        return AppColors.green;
      case MessageStatus.fechada:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  showSender ? '${message.name} • ${message.subject}' : '${message.subject} ${message.protocol}',
                  style: TextStyle(fontWeight: FontWeight.w800, color: palette.title),
                ),
              ),
              StatusPill(label: message.status.label, color: statusColor(message.status)),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            showSender
                ? '${message.email} • ${Formatters.dateTime(message.sentAt)}'
                : 'Enviada em ${Formatters.dateTime(message.sentAt)}',
            style: TextStyle(fontSize: 12, color: palette.muted),
          ),
          const SizedBox(height: 10),
          Text(message.message, style: TextStyle(color: palette.text, height: 1.45)),
          if (message.reply.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.green.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border(left: BorderSide(color: AppColors.green.withValues(alpha: 0.7), width: 3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Resposta${message.employee.isEmpty ? '' : ' de ${message.employee}'}${message.repliedAt == null ? '' : ' • ${Formatters.dateTime(message.repliedAt!)}'}',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: AppColors.green),
                  ),
                  const SizedBox(height: 4),
                  Text(message.reply, style: TextStyle(color: palette.text, height: 1.45)),
                ],
              ),
            ),
          ],
          if (footer != null) ...[const SizedBox(height: 12), footer!],
        ],
      ),
    );
  }
}
