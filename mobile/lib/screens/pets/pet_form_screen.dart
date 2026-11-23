import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/services/pet_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';
import 'package:happysnouts/widgets/photo_avatar.dart';

class PetFormScreen extends StatefulWidget {
  final Pet? pet;

  const PetFormScreen({super.key, this.pet});

  @override
  State<PetFormScreen> createState() => _PetFormScreenState();
}

class _PetFormScreenState extends State<PetFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.pet?.name ?? '');
  late final _breed = TextEditingController(text: widget.pet?.breed ?? '');
  late final _age = TextEditingController(text: widget.pet?.ageYears?.toString() ?? '');
  late final _weight = TextEditingController(
    text: widget.pet?.weightKg == null
        ? ''
        : widget.pet!.weightKg!.toString().replaceAll('.', ',').replaceAll(RegExp(r',0$'), ''),
  );
  bool _saving = false;
  PickedPhoto? _photo;

  bool get _isEditing => widget.pet != null;

  @override
  void dispose() {
    for (final c in [_name, _breed, _age, _weight]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    try {
      final photo = await pickPhoto(context);
      if (photo != null && mounted) setState(() => _photo = photo);
    } catch (_) {
      if (mounted) AppFeedback.show(context, 'Não foi possível abrir as fotos.', error: true);
    }
  }

  static String? _validateName(String? value) =>
      (value == null || value.trim().isEmpty) ? 'Qual é o nome do seu pet?' : null;

  static String? _validateBreed(String? value) =>
      (value == null || value.trim().isEmpty) ? 'Informe a raça (pode ser "SRD" se não tiver).' : null;

  static String? _validateAge(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final age = int.tryParse(value.trim());
    return (age == null || age < 0 || age > 40) ? 'Idade em anos inteiros, de 0 a 40.' : null;
  }

  static String? _validateWeight(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final kg = double.tryParse(value.trim().replaceAll(',', '.'));
    return (kg == null || kg <= 0 || kg > 200) ? 'Peso em kg, maior que 0.' : null;
  }

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final ageText = _age.text.trim();
    final weightText = _weight.text.trim().replaceAll(',', '.');
    final base = widget.pet ?? Pet(id: '', name: '', breed: '');
    final pet = Pet(
      id: base.id,
      name: _name.text.trim(),
      species: base.species,
      breed: _breed.text.trim(),
      imageUrl: base.imageUrl,
      weightKg: weightText.isEmpty ? null : double.parse(weightText),
      ageYears: ageText.isEmpty ? null : int.parse(ageText),
      batteryPercent: base.batteryPercent,
      isOnline: base.isOnline,
      lastUpdate: base.lastUpdate,
      address: base.address,
      hasTracker: base.hasTracker,
    );
    try {
      await PetService.instance.save(pet, photo: _photo);
      if (!mounted) return;
      AppFeedback.show(context, _isEditing ? 'Perfil atualizado' : '${pet.name} cadastrado!');
      Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Editar pet' : 'Cadastrar pet')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Center(
                child: PhotoAvatar(
                  imageUrl: widget.pet?.imageUrl ?? '',
                  bytes: _photo?.bytes,
                  radius: 48,
                  fallbackIcon: Icons.pets,
                  onEdit: _pickPhoto,
                ),
              ),
              Center(
                child: TextButton(
                  onPressed: _pickPhoto,
                  child: Text(
                    (widget.pet?.imageUrl.isNotEmpty ?? false) || _photo != null ? 'Trocar foto' : 'Adicionar foto',
                  ),
                ),
              ),
              const SizedBox(height: 8),
              OutlinedTextField(
                controller: _name,
                label: 'Nome do pet *',
                hint: 'Ex.: Lily',
                inputFormatters: [LengthLimitingTextInputFormatter(50)],
                validator: _validateName,
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 14),
              OutlinedTextField(
                controller: _breed,
                label: 'Raça *',
                hint: 'Ex.: Golden Retriever, SRD...',
                inputFormatters: [LengthLimitingTextInputFormatter(100)],
                validator: _validateBreed,
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: OutlinedTextField(
                      controller: _age,
                      label: 'Idade (anos)',
                      hint: 'Ex.: 3',
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(2)],
                      validator: _validateAge,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedTextField(
                      controller: _weight,
                      label: 'Peso (kg)',
                      hint: 'Ex.: 4,1',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
                      validator: _validateWeight,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(_isEditing ? 'Salvar alterações' : 'Cadastrar pet'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
