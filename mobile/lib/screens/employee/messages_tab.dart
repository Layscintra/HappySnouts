import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/screens/support/contact_screen.dart' show ContactMessageCard;
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/services/support_service.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';

class MessagesTab extends StatefulWidget {
  const MessagesTab({super.key});

  @override
  State<MessagesTab> createState() => _MessagesTabState();
}

class _MessagesTabState extends State<MessagesTab> with ReloadOnChange {
  late Future<List<ContactMessage>> _future;
  bool _onlyOpen = true;

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.messages];

  @override
  void initState() {
    super.initState();
    reload();
  }

  @override
  void reload() => _future = SupportService.instance.getAllMessages();

  Future<void> _reply(ContactMessage message) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _ReplySheet(message: message),
    );
  }

  Future<void> _setStatus(ContactMessage message, MessageStatus status) async {
    try {
      await SupportService.instance.setStatus(message.id, status);
      if (mounted) {
        AppFeedback.show(context, status == MessageStatus.fechada ? 'Atendimento encerrado' : 'Atendimento reaberto');
      }
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureStateBuilder<List<ContactMessage>>(
      future: _future,
      onRetry: () => setState(reload),
      builder: (context, messages) {
        final open = messages.where((m) => m.status == MessageStatus.aberta).length;
        final list = _onlyOpen ? messages.where((m) => m.status == MessageStatus.aberta).toList() : messages;
        return RefreshIndicator(
          onRefresh: () async {
            setState(reload);
            await _future.catchError((_) => <ContactMessage>[]);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              Row(
                children: [
                  ChoiceChip(
                    label: Text('Aguardando ($open)'),
                    selected: _onlyOpen,
                    showCheckmark: false,
                    onSelected: (_) => setState(() => _onlyOpen = true),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: Text('Todas (${messages.length})'),
                    selected: !_onlyOpen,
                    showCheckmark: false,
                    onSelected: (_) => setState(() => _onlyOpen = false),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (list.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(top: 40),
                  child: EmptyView(
                    icon: Icons.mark_chat_read_outlined,
                    title: 'Nenhuma mensagem aguardando',
                    message: 'As mensagens do Fale conosco chegam aqui e por e-mail.',
                  ),
                ),
              ...list.map(
                (m) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ContactMessageCard(
                    message: m,
                    showSender: true,
                    footer: Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _reply(m),
                            icon: const Icon(Icons.reply_rounded, size: 18),
                            label: Text(m.reply.isEmpty ? 'Responder' : 'Responder de novo'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton(
                          onPressed: () => _setStatus(
                            m,
                            m.status == MessageStatus.fechada ? MessageStatus.aberta : MessageStatus.fechada,
                          ),
                          child: Text(m.status == MessageStatus.fechada ? 'Reabrir' : 'Encerrar'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ReplySheet extends StatefulWidget {
  final ContactMessage message;

  const _ReplySheet({required this.message});

  @override
  State<_ReplySheet> createState() => _ReplySheetState();
}

class _ReplySheetState extends State<_ReplySheet> {
  final _reply = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_reply.text.trim().length < 2) {
      AppFeedback.show(context, 'Escreva a resposta.', error: true);
      return;
    }
    setState(() => _sending = true);
    try {
      await SupportService.instance.reply(widget.message.id, _reply.text);
      if (!mounted) return;
      Navigator.pop(context);
      AppFeedback.show(context, 'Resposta enviada por e-mail e no app do cliente.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _sending = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.viewInsetsOf(context).bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Responder ${widget.message.name.split(' ').first}',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: palette.title),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: palette.softCard, borderRadius: BorderRadius.circular(12)),
            child: Text(
              widget.message.message,
              maxLines: 5,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: palette.text, fontSize: 13),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _reply,
            autofocus: true,
            maxLines: 5,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(hintText: 'Escreva a resposta para o cliente'),
          ),
          const SizedBox(height: 12),
          LoadingButton(label: 'Enviar resposta', icon: Icons.send_rounded, loading: _sending, onPressed: _send),
        ],
      ),
    );
  }
}
