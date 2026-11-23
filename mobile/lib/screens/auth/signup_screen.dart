import 'package:flutter/material.dart';
import 'package:happysnouts/screens/auth/signup_address_screen.dart';
import 'package:happysnouts/services/auth_service.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/utils/input_masks.dart';
import 'package:happysnouts/utils/validators.dart';
import 'package:happysnouts/widgets/onboarding_header.dart';
import 'package:happysnouts/widgets/outlined_text_field.dart';
import 'package:happysnouts/widgets/photo_avatar.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _birthDateController = TextEditingController();
  final _cpfController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _confirmEmailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  PickedPhoto? _photo;

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _birthDateController.dispose();
    _cpfController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _confirmEmailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _pickBirthDate() async {
    final current = Formatters.parseDate(_birthDateController.text);
    // o calendário só deixa escolher datas de quem já tem 16 anos
    final limite = Validators.dataLimiteNascimento();
    final inicial = current == null || current.isAfter(limite) ? DateTime(2000, 1, 1) : current;
    final picked = await showDatePicker(
      context: context,
      initialDate: inicial.isAfter(limite) ? limite : inicial,
      firstDate: DateTime(1900),
      lastDate: limite,
      helpText: 'Data de nascimento',
    );
    if (picked != null) {
      setState(() => _birthDateController.text = Formatters.date(picked));
    }
  }

  Future<void> _pickPhoto() async {
    try {
      final photo = await pickPhoto(context, maxSide: 480);
      if (photo != null && mounted) setState(() => _photo = photo);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Não foi possível abrir as fotos.')));
      }
    }
  }

  void _handleContinue() {
    if (!_formKey.currentState!.validate()) return;

    final data = RegistrationData(
      fullName: _nameController.text.trim(),
      username: _usernameController.text.trim(),
      birthDate: _birthDateController.text,
      cpf: _cpfController.text,
      phone: _phoneController.text,
      email: _emailController.text.trim(),
      password: _passwordController.text,
      photo: _photo,
    );
    Navigator.push(context, MaterialPageRoute(builder: (_) => SignupAddressScreen(registration: data)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const OnboardingHeader(title: 'Informações Pessoais', progress: 0.55),
                const SizedBox(height: 16),
                // Foto de perfil é opcional: é enviada depois que a conta é criada.
                Center(
                  child: PhotoAvatar(bytes: _photo?.bytes, radius: 40, onEdit: _pickPhoto),
                ),
                Center(
                  child: TextButton(
                    onPressed: _pickPhoto,
                    child: Text(_photo == null ? 'Adicionar foto (opcional)' : 'Trocar foto'),
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedTextField(
                  controller: _nameController,
                  hint: 'Digite o nome completo',
                  validator: Validators.name,
                  textCapitalization: TextCapitalization.words,
                  autofillHints: const [AutofillHints.name],
                ),
                const SizedBox(height: 14),
                OutlinedTextField(
                  controller: _usernameController,
                  hint: 'Digite o nome de usuário',
                  validator: Validators.username,
                  autofillHints: const [AutofillHints.newUsername],
                ),
                const SizedBox(height: 14),
                OutlinedTextField(
                  controller: _birthDateController,
                  hint: 'Data de Nascimento',
                  readOnly: true,
                  onTap: _pickBirthDate,
                  suffixIcon: Icons.calendar_today_outlined,
                  validator: Validators.birthDate,
                ),
                const SizedBox(height: 14),
                OutlinedTextField(
                  controller: _cpfController,
                  hint: 'Digite seu CPF',
                  keyboardType: TextInputType.number,
                  inputFormatters: [InputMasks.cpf()],
                  validator: Validators.cpf,
                ),
                const SizedBox(height: 14),
                OutlinedTextField(
                  controller: _phoneController,
                  hint: 'Digite o seu telefone celular',
                  keyboardType: TextInputType.phone,
                  inputFormatters: [InputMasks.phone()],
                  validator: Validators.phone,
                  autofillHints: const [AutofillHints.telephoneNumber],
                ),
                const SizedBox(height: 14),
                OutlinedTextField(
                  controller: _emailController,
                  hint: 'Digite seu Email',
                  keyboardType: TextInputType.emailAddress,
                  validator: Validators.email,
                  autofillHints: const [AutofillHints.email],
                ),
                const SizedBox(height: 14),
                OutlinedTextField(
                  controller: _confirmEmailController,
                  hint: 'Confirme seu Email',
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    final error = Validators.email(value);
                    if (error != null) return error;
                    if (value!.trim().toLowerCase() != _emailController.text.trim().toLowerCase()) {
                      return 'Os e-mails não coincidem';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                Text(
                  'Crie uma senha',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: context.palette.text),
                ),
                const SizedBox(height: 10),
                OutlinedTextField(
                  controller: _passwordController,
                  hint: 'Digite aqui sua senha (mínimo 6 caracteres)',
                  obscureText: true,
                  validator: Validators.password,
                  autofillHints: const [AutofillHints.newPassword],
                ),
                const SizedBox(height: 14),
                OutlinedTextField(
                  controller: _confirmPasswordController,
                  hint: 'Confirme sua senha',
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  validator: (value) {
                    final error = Validators.required(value);
                    if (error != null) return error;
                    if (value != _passwordController.text) return 'As senhas não coincidem';
                    return null;
                  },
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.formButton),
                    onPressed: _handleContinue,
                    child: const Text('CONTINUAR'),
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
