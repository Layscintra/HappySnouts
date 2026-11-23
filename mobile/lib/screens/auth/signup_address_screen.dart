import 'package:flutter/material.dart';
import 'package:happysnouts/models/address.dart';
import 'package:happysnouts/screens/auth/confirm_email_screen.dart';
import 'package:happysnouts/services/auth_service.dart';
import 'package:happysnouts/services/cep_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/utils/input_masks.dart';
import 'package:happysnouts/utils/validators.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/onboarding_header.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';

/// Última etapa do cadastro: endereço de entrega. Ao continuar, a conta é
/// criada (dados pessoais + endereço) e o usuário entra no app.
class SignupAddressScreen extends StatefulWidget {
  final RegistrationData registration;

  const SignupAddressScreen({super.key, required this.registration});

  @override
  State<SignupAddressScreen> createState() => _SignupAddressScreenState();
}

class _SignupAddressScreenState extends State<SignupAddressScreen> {
  final _formKey = GlobalKey<FormState>();

  final _cepController = TextEditingController();
  final _streetController = TextEditingController();
  final _numberController = TextEditingController();
  final _complementController = TextEditingController();
  final _neighborhoodController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  bool _loading = false;

  // Último CEP buscado, para não repetir a busca à toa.
  String _ultimoCep = '';

  @override
  void initState() {
    super.initState();
    _cepController.addListener(_onCepChanged);
  }

  Future<void> _onCepChanged() async {
    final digits = _cepController.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 8 || digits == _ultimoCep) return;
    _ultimoCep = digits;
    final result = await CepService.buscar(digits);
    if (!mounted) return;
    if (result == null) {
      AppFeedback.show(context, 'CEP não encontrado. Preencha à mão.', error: true);
      return;
    }
    setState(() {
      if (result.street.isNotEmpty) _streetController.text = result.street;
      if (result.neighborhood.isNotEmpty) _neighborhoodController.text = result.neighborhood;
      _cityController.text = result.city;
      _stateController.text = result.state;
    });
  }

  @override
  void dispose() {
    _cepController.removeListener(_onCepChanged);
    _cepController.dispose();
    _streetController.dispose();
    _numberController.dispose();
    _complementController.dispose();
    _neighborhoodController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    super.dispose();
  }

  Future<void> _handleContinue() async {
    if (_loading || !_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    final complement = _complementController.text.trim();
    final registration = widget.registration
      ..address = Address(
        id: '',
        // O banco não tem coluna de complemento: ele vai junto com a rua.
        street: '${_streetController.text.trim()}${complement.isEmpty ? '' : ' - $complement'}',
        number: _numberController.text.trim(),
        neighborhood: _neighborhoodController.text.trim(),
        city: _cityController.text.trim(),
        state: _stateController.text.trim().toUpperCase(),
        cep: _cepController.text,
        isCurrent: true,
      );

    // Manda o código para o e-mail; a conta só é criada na tela seguinte, com o código.
    setState(() => _loading = true);
    try {
      final notice = await AuthService.instance.requestSignupCode(registration.email, registration.fullName);
      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ConfirmEmailScreen(registration: registration, notice: notice),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _loading = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const OnboardingHeader(title: 'Agora, informe seu endereço', progress: 0.95),
                const SizedBox(height: 20),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        OutlinedTextField(
                          controller: _cepController,
                          hint: 'Digite o seu CEP',
                          keyboardType: TextInputType.number,
                          inputFormatters: [InputMasks.cep()],
                          validator: Validators.cep,
                          autofillHints: const [AutofillHints.postalCode],
                        ),
                        const SizedBox(height: 14),
                        OutlinedTextField(
                          controller: _streetController,
                          hint: 'Digite seu endereço (rua, avenida...)',
                          validator: Validators.required,
                          autofillHints: const [AutofillHints.streetAddressLine1],
                        ),
                        const SizedBox(height: 14),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: OutlinedTextField(
                                controller: _numberController,
                                hint: 'Número',
                                keyboardType: TextInputType.text,
                                validator: Validators.required,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedTextField(controller: _complementController, hint: 'Complemento'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        OutlinedTextField(
                          controller: _neighborhoodController,
                          hint: 'Bairro',
                          validator: Validators.required,
                        ),
                        const SizedBox(height: 14),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: OutlinedTextField(
                                controller: _cityController,
                                hint: 'Cidade',
                                validator: Validators.required,
                                autofillHints: const [AutofillHints.addressCity],
                              ),
                            ),
                            const SizedBox(width: 12),
                            SizedBox(
                              width: 90,
                              child: OutlinedTextField(
                                controller: _stateController,
                                hint: 'UF',
                                textCapitalization: TextCapitalization.characters,
                                validator: Validators.uf,
                                textInputAction: TextInputAction.done,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.formButton),
                    onPressed: _loading ? null : _handleContinue,
                    child: _loading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('CRIAR CONTA'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
