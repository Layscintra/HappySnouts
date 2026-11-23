import 'package:flutter/material.dart';
import 'package:happysnouts/models/address.dart';
import 'package:happysnouts/services/address_service.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/cep_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/input_masks.dart';
import 'package:happysnouts/utils/validators.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/gradient_header.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';

class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});
  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> with ReloadOnChange {
  @override
  List<DataTopic> get reloadTopics => const [DataTopic.addresses];

  @override
  void reload() => _load();

  late Future<List<Address>> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() => _future = AddressService.instance.getAddresses();

  Future<void> _openForm({Address? existing}) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _AddressForm(existing: existing),
    );
    if (saved == true && mounted) {
      setState(_load);
      AppFeedback.show(context, 'Endereço salvo com sucesso');
    }
  }

  Future<void> _runAction(Future<void> Function() action, String successMessage) async {
    try {
      await action();
      if (!mounted) return;
      setState(_load);
      AppFeedback.show(context, successMessage);
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  Future<void> _delete(Address address) async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Excluir endereço',
      message: 'Deseja excluir "${address.streetLine}"?',
      confirmLabel: 'Excluir',
      destructive: true,
    );
    if (confirmed) await _runAction(() => AddressService.instance.delete(address.id), 'Endereço excluído');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const GradientHeader(title: 'Endereços'),
          Expanded(
            child: FutureStateBuilder<List<Address>>(
              future: _future,
              onRetry: () => setState(_load),
              builder: (context, addresses) {
                if (addresses.isEmpty) {
                  return EmptyView(
                    icon: Icons.location_off_outlined,
                    title: 'Nenhum endereço cadastrado',
                    message: 'Cadastre um endereço para receber seus pedidos.',
                    actionLabel: 'Adicionar endereço',
                    onAction: () => _openForm(),
                  );
                }
                final current = addresses.where((a) => a.isCurrent).toList();
                final saved = addresses.where((a) => !a.isCurrent).toList();
                final palette = context.palette;
                final labelStyle = TextStyle(color: palette.link, fontWeight: FontWeight.bold, fontSize: 14);
                return ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    if (current.isNotEmpty) ...[
                      Text('Endereço atual de entrega', style: labelStyle),
                      const SizedBox(height: 10),
                      _buildAddressCard(current.first),
                      const SizedBox(height: 24),
                    ],
                    if (saved.isNotEmpty) ...[
                      Text('Endereços salvos', style: labelStyle),
                      const SizedBox(height: 10),
                      ...saved.map(
                        (a) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _buildAddressCard(a)),
                      ),
                      const SizedBox(height: 12),
                    ],
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => _openForm(),
                        icon: const Icon(Icons.add_circle_outline),
                        label: const Text('Adicionar novo endereço'),
                      ),
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

  Widget _buildAddressCard(Address address) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 4, 4),
      decoration: BoxDecoration(
        color: palette.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.orangeStrong),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (address.nickname.isNotEmpty) ...[
            Text(
              address.nickname,
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.accent),
            ),
            const SizedBox(height: 6),
          ],
          Text(
            address.streetLine,
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.title),
          ),
          Text(
            address.street,
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: palette.title),
          ),
          const SizedBox(height: 2),
          Text(
            '${address.neighborhood} - ${address.city} - ${address.state}',
            style: TextStyle(fontSize: 12, color: palette.muted),
          ),
          const SizedBox(height: 2),
          Text('CEP: ${address.cep}', style: TextStyle(fontSize: 12, color: palette.link)),
          Wrap(
            alignment: WrapAlignment.end,
            children: [
              if (!address.isCurrent)
                TextButton(
                  onPressed: () => _runAction(
                    () => AddressService.instance.setCurrent(address.id),
                    'Endereço de entrega atualizado',
                  ),
                  child: Text(
                    'Usar para entrega',
                    style: TextStyle(color: palette.link, fontWeight: FontWeight.bold),
                  ),
                ),
              TextButton.icon(
                onPressed: () => _delete(address),
                icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 16),
                label: const Text(
                  'Excluir',
                  style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold),
                ),
              ),
              TextButton.icon(
                onPressed: () => _openForm(existing: address),
                icon: Icon(Icons.edit_outlined, color: palette.accent, size: 16),
                label: Text(
                  'Editar',
                  style: TextStyle(color: palette.accent, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AddressForm extends StatefulWidget {
  final Address? existing;

  const _AddressForm({this.existing});

  @override
  State<_AddressForm> createState() => _AddressFormState();
}

class _AddressFormState extends State<_AddressForm> {
  final _formKey = GlobalKey<FormState>();
  late final _nickname = TextEditingController(text: widget.existing?.nickname ?? '');
  late final _number = TextEditingController(text: widget.existing?.number ?? '');
  late final _cep = TextEditingController(text: widget.existing?.cep ?? '');
  late final _street = TextEditingController(text: widget.existing?.street ?? '');
  late final _neighborhood = TextEditingController(text: widget.existing?.neighborhood ?? '');
  late final _city = TextEditingController(text: widget.existing?.city ?? '');
  late final _state = TextEditingController(text: widget.existing?.state ?? '');
  bool _saving = false;

  // Guarda o último CEP buscado para não repetir a busca (e para não
  // sobrescrever um endereço que já está sendo editado).
  late String _ultimoCep = _cep.text.replaceAll(RegExp(r'\D'), '');

  @override
  void initState() {
    super.initState();
    _cep.addListener(_onCepChanged);
  }

  Future<void> _onCepChanged() async {
    final digits = _cep.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 8 || digits == _ultimoCep) return;
    _ultimoCep = digits;
    final result = await CepService.buscar(digits);
    if (!mounted) return;
    if (result == null) {
      AppFeedback.show(context, 'CEP não encontrado. Preencha à mão.', error: true);
      return;
    }
    setState(() {
      if (result.street.isNotEmpty) _street.text = result.street;
      if (result.neighborhood.isNotEmpty) _neighborhood.text = result.neighborhood;
      _city.text = result.city;
      _state.text = result.state;
    });
  }

  @override
  void dispose() {
    _cep.removeListener(_onCepChanged);
    for (final c in [_nickname, _number, _cep, _street, _neighborhood, _city, _state]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final address = Address(
      id: widget.existing?.id ?? '',
      nickname: _nickname.text.trim(),
      number: _number.text.trim(),
      cep: _cep.text,
      street: _street.text.trim(),
      neighborhood: _neighborhood.text.trim(),
      city: _city.text.trim(),
      state: _state.text.trim().toUpperCase(),
      isCurrent: widget.existing?.isCurrent ?? false,
    );
    try {
      await AddressService.instance.save(address);
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                widget.existing == null ? 'Novo endereço' : 'Editar endereço',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: context.palette.title),
              ),
              const SizedBox(height: 16),
              OutlinedTextField(
                controller: _nickname,
                hint: 'Ex.: Casa, Trabalho',
                label: 'Apelido (opcional)',
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 10),
              OutlinedTextField(
                controller: _cep,
                hint: '00000-000',
                label: 'CEP',
                keyboardType: TextInputType.number,
                inputFormatters: [InputMasks.cep()],
                validator: Validators.cep,
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: OutlinedTextField(
                      controller: _street,
                      hint: 'Rua, avenida e complemento',
                      label: 'Endereço',
                      validator: Validators.required,
                    ),
                  ),
                  const SizedBox(width: 10),
                  SizedBox(
                    width: 100,
                    child: OutlinedTextField(
                      controller: _number,
                      hint: 'Ex.: 227',
                      label: 'Número',
                      validator: Validators.required,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              OutlinedTextField(
                controller: _neighborhood,
                hint: 'Bairro',
                label: 'Bairro',
                validator: Validators.required,
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: OutlinedTextField(
                      controller: _city,
                      hint: 'Cidade',
                      label: 'Cidade',
                      validator: Validators.required,
                    ),
                  ),
                  const SizedBox(width: 10),
                  SizedBox(
                    width: 90,
                    child: OutlinedTextField(
                      controller: _state,
                      hint: 'SP',
                      label: 'UF',
                      textCapitalization: TextCapitalization.characters,
                      validator: Validators.uf,
                      textInputAction: TextInputAction.done,
                    ),
                  ),
                ],
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
                    : const Text('Salvar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
