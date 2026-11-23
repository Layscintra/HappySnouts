import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/models/payment_card.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/payment_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/gradient_header.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';
import 'package:happysnouts/widgets/tile_card.dart';

class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({super.key});
  @override
  State<PaymentMethodsScreen> createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> with ReloadOnChange {
  @override
  List<DataTopic> get reloadTopics => const [DataTopic.cards];

  @override
  void reload() => _load();

  late Future<List<PaymentCard>> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() => _future = PaymentService.instance.getCards();

  Future<void> _addCard() async {
    final added = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _CardForm(),
    );
    if (added == true && mounted) {
      setState(_load);
      AppFeedback.show(context, 'Cartão adicionado com sucesso');
    }
  }

  Future<void> _removeCard(PaymentCard card) async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Remover cartão',
      message: 'Deseja remover o cartão ${card.brand} ${card.maskedNumber}?',
      confirmLabel: 'Remover',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    try {
      await PaymentService.instance.removeCard(card.id);
      if (!mounted) return;
      setState(_load);
      AppFeedback.show(context, 'Cartão removido');
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const GradientHeader(title: 'Formas de Pagamento'),
          Expanded(
            child: FutureStateBuilder<List<PaymentCard>>(
              future: _future,
              onRetry: () => setState(_load),
              builder: (context, cards) {
                final palette = context.palette;
                return ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    _buildAddCardRow(),
                    const SizedBox(height: 20),
                    Text(
                      'Meus Cartões',
                      style: TextStyle(color: palette.link, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 10),
                    if (cards.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Text(
                          'Nenhum cartão cadastrado.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: palette.muted),
                        ),
                      ),
                    ...cards.map(
                      (card) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _buildCardRow(card)),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.lock_outline, size: 16, color: palette.muted),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Por segurança, guardamos só a bandeira, o nome e os 4 últimos dígitos do cartão.',
                            style: TextStyle(fontSize: 11, color: palette.muted),
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddCardRow() {
    final palette = context.palette;
    return TileCard(
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: AppColors.navy,
          child: Icon(Icons.add_card, color: Colors.white),
        ),
        title: Text(
          'Adicionar novo cartão',
          style: TextStyle(color: palette.link, fontWeight: FontWeight.bold, fontSize: 14),
        ),
        subtitle: Text(
          'Cadastre um novo cartão de crédito ou débito',
          style: TextStyle(fontSize: 11, color: palette.muted),
        ),
        trailing: Icon(Icons.chevron_right, color: palette.title),
        onTap: _addCard,
      ),
    );
  }

  Widget _buildCardRow(PaymentCard card) {
    final palette = context.palette;
    return TileCard(
      child: ListTile(
        leading: Icon(Icons.credit_card, color: palette.title),
        title: Text(
          '${card.brand} ${card.maskedNumber}',
          style: TextStyle(fontWeight: FontWeight.bold, color: palette.title, fontSize: 14),
        ),
        subtitle: Text(
          [
            card.holderName,
            if (card.expiry.isNotEmpty) 'Validade ${card.expiry}',
          ].where((s) => s.isNotEmpty).join(' • '),
          style: TextStyle(fontSize: 11, color: palette.muted),
        ),
        trailing: IconButton(
          tooltip: 'Remover cartão',
          icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
          onPressed: () => _removeCard(card),
        ),
      ),
    );
  }
}

class _CardForm extends StatefulWidget {
  const _CardForm();

  @override
  State<_CardForm> createState() => _CardFormState();
}

class _CardFormState extends State<_CardForm> {
  static const _brands = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'];

  final _formKey = GlobalKey<FormState>();
  final _last4 = TextEditingController();
  final _name = TextEditingController();
  String? _brand;
  bool _saving = false;

  @override
  void dispose() {
    _last4.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await PaymentService.instance.addCard(brand: _brand!, last4: _last4.text, holderName: _name.text);
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Novo cartão',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: palette.title),
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.lock_outline, size: 16, color: palette.muted),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Por segurança, guardamos só a bandeira, o nome e os 4 últimos dígitos. Nunca pedimos o número completo nem o CVV.',
                      style: TextStyle(fontSize: 11, color: palette.muted),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _brand,
                decoration: const InputDecoration(labelText: 'Bandeira'),
                items: _brands.map((b) => DropdownMenuItem(value: b, child: Text(b))).toList(),
                onChanged: (value) => setState(() => _brand = value),
                validator: (value) => value == null ? 'Escolha a bandeira' : null,
              ),
              const SizedBox(height: 10),
              OutlinedTextField(
                controller: _last4,
                hint: '1234',
                label: '4 últimos dígitos',
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(4)],
                validator: (value) =>
                    RegExp(r'^\d{4}$').hasMatch(value ?? '') ? null : 'Digite os 4 últimos dígitos do cartão',
              ),
              const SizedBox(height: 10),
              OutlinedTextField(
                controller: _name,
                hint: 'Como está impresso no cartão',
                label: 'Nome no cartão',
                textCapitalization: TextCapitalization.characters,
                validator: (value) => (value ?? '').trim().length < 3 ? 'Digite o nome como está no cartão' : null,
                autofillHints: const [AutofillHints.creditCardName],
                textInputAction: TextInputAction.done,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Salvar cartão'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
