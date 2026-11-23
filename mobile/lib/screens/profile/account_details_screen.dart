import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/models/user.dart';
import 'package:happysnouts/screens/auth/splash_screen.dart';
import 'package:happysnouts/services/auth_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/input_masks.dart';
import 'package:happysnouts/utils/validators.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/gradient_header.dart';
import 'package:happysnouts/widgets/photo_avatar.dart';
import 'package:happysnouts/widgets/section_card.dart';

class AccountDetailsScreen extends StatefulWidget {
  const AccountDetailsScreen({super.key});
  @override
  State<AccountDetailsScreen> createState() => _AccountDetailsScreenState();
}

class _AccountDetailsScreenState extends State<AccountDetailsScreen> {
  bool _uploadingPhoto = false;

  Future<void> _changePhoto() async {
    final PickedPhoto? photo;
    try {
      photo = await pickPhoto(context, maxSide: 480);
    } catch (_) {
      if (mounted) AppFeedback.show(context, 'Não foi possível abrir as fotos.', error: true);
      return;
    }
    if (photo == null || !mounted) return;
    setState(() => _uploadingPhoto = true);
    try {
      await SessionController.updatePhoto(photo);
      if (mounted) AppFeedback.show(context, 'Foto atualizada');
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  Future<void> _editField({
    required String label,
    required String currentValue,
    required String? Function(String?) validator,
    required AppUser Function(AppUser user, String value) apply,
    TextInputType keyboardType = TextInputType.text,
    List<TextInputFormatter>? formatters,
  }) async {
    final result = await showDialog<String>(
      context: context,
      builder: (_) => _EditFieldDialog(
        label: label,
        initialValue: currentValue,
        validator: validator,
        keyboardType: keyboardType,
        formatters: formatters,
      ),
    );
    if (result == null || result == currentValue || !mounted) return;
    final user = SessionController.currentUser.value;
    if (user == null) return;
    try {
      await SessionController.updateProfile(apply(user, result));
      if (mounted) AppFeedback.show(context, '$label atualizado');
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  Future<void> _changePassword() async {
    final changed = await showDialog<bool>(context: context, builder: (_) => const _ChangePasswordDialog());
    if (changed == true && mounted) AppFeedback.show(context, 'Senha atualizada com sucesso');
  }

  Future<void> _logout() async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Mudar de conta',
      message: 'Você será desconectado e voltará para a tela inicial.',
      confirmLabel: 'Sair',
    );
    if (!confirmed || !mounted) return;
    await SessionController.logout();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const SplashScreen()), (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const GradientHeader(title: 'Meus Dados'),
          Expanded(
            child: ValueListenableBuilder(
              valueListenable: SessionController.currentUser,
              builder: (context, user, _) {
                if (user == null) return const SizedBox.shrink();
                return SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildUserCard(user),
                      const SizedBox(height: 20),
                      Text(
                        'Informações pessoais',
                        style: TextStyle(color: context.palette.accent, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 10),
                      _buildInfoCard(user),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(onPressed: _logout, child: const Text('Mudar de Conta / Sair')),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserCard(AppUser user) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: palette.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.border),
      ),
      child: Row(
        children: [
          _uploadingPhoto
              ? const SizedBox(
                  width: 56,
                  height: 56,
                  child: Padding(padding: EdgeInsets.all(14), child: CircularProgressIndicator(strokeWidth: 2)),
                )
              : PhotoAvatar(imageUrl: user.avatarUrl, radius: 28, onEdit: _changePhoto),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: palette.title),
                ),
                const SizedBox(height: 2),
                Text('@${user.username}', style: TextStyle(fontSize: 12, color: palette.muted)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(AppUser user) {
    return SectionCard(
      dividerColor: AppColors.orange.withValues(alpha: 0.5),
      children: [
        _buildDataRow(
          'Nome Completo',
          user.fullName,
          icon: Icons.person_outline,
          onTap: () {
            _editField(
              label: 'Nome Completo',
              currentValue: user.fullName,
              validator: Validators.name,
              apply: (u, v) => u.copyWith(fullName: v),
            );
          },
        ),
        _buildDataRow(
          'Nome de Usuário',
          user.username,
          icon: Icons.alternate_email,
          onTap: () {
            _editField(
              label: 'Nome de Usuário',
              currentValue: user.username,
              validator: Validators.username,
              apply: (u, v) => u.copyWith(username: v),
            );
          },
        ),
        _buildDataRow(
          'Email',
          user.email,
          icon: Icons.email_outlined,
          onTap: () {
            _editField(
              label: 'Email',
              currentValue: user.email,
              validator: Validators.email,
              keyboardType: TextInputType.emailAddress,
              apply: (u, v) => u.copyWith(email: v),
            );
          },
        ),
        _buildDataRow(
          'Telefone',
          user.phone,
          icon: Icons.phone_outlined,
          onTap: () {
            _editField(
              label: 'Telefone',
              currentValue: user.phone,
              validator: Validators.phone,
              keyboardType: TextInputType.phone,
              formatters: [InputMasks.phone()],
              apply: (u, v) => u.copyWith(phone: v),
            );
          },
        ),
        _buildDataRow(
          'Data de Nascimento',
          user.birthDate,
          icon: Icons.cake_outlined,
          onTap: () {
            _editField(
              label: 'Data de Nascimento',
              currentValue: user.birthDate,
              validator: Validators.birthDate,
              keyboardType: TextInputType.number,
              formatters: [InputMasks.date()],
              apply: (u, v) => u.copyWith(birthDate: v),
            );
          },
        ),
        _buildDataRow('Trocar Senha', null, icon: Icons.lock_outline, onTap: _changePassword),
      ],
    );
  }

  Widget _buildDataRow(String label, String? value, {required IconData icon, required VoidCallback onTap}) {
    final palette = context.palette;
    return ListTile(
      leading: Icon(icon, color: palette.title, size: 20),
      title: Text(
        label,
        style: TextStyle(color: palette.link, fontWeight: FontWeight.bold, fontSize: 13),
      ),
      subtitle: value != null
          ? Text(value.isEmpty ? 'Não informado' : value, style: TextStyle(fontSize: 12, color: palette.text))
          : null,
      trailing: Icon(Icons.edit_outlined, color: palette.title, size: 18),
      onTap: onTap,
    );
  }
}

class _EditFieldDialog extends StatefulWidget {
  final String label;
  final String initialValue;
  final String? Function(String?) validator;
  final TextInputType keyboardType;
  final List<TextInputFormatter>? formatters;

  const _EditFieldDialog({
    required this.label,
    required this.initialValue,
    required this.validator,
    required this.keyboardType,
    this.formatters,
  });

  @override
  State<_EditFieldDialog> createState() => _EditFieldDialogState();
}

class _EditFieldDialogState extends State<_EditFieldDialog> {
  final _formKey = GlobalKey<FormState>();
  late final _controller = TextEditingController(text: widget.initialValue);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.pop(context, _controller.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.label),
      content: Form(
        key: _formKey,
        child: TextFormField(
          controller: _controller,
          autofocus: true,
          keyboardType: widget.keyboardType,
          inputFormatters: widget.formatters,
          validator: widget.validator,
          onFieldSubmitted: (_) => _save(),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
        TextButton(onPressed: _save, child: const Text('Salvar')),
      ],
    );
  }
}

class _ChangePasswordDialog extends StatefulWidget {
  const _ChangePasswordDialog();

  @override
  State<_ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends State<_ChangePasswordDialog> {
  final _formKey = GlobalKey<FormState>();
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_loading || !_formKey.currentState!.validate()) return;
    final user = SessionController.currentUser.value;
    if (user == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await AuthService.instance.changePassword(user, _currentController.text, _newController.text);
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = errorMessage(error);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Trocar Senha'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _currentController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Senha atual'),
                validator: Validators.required,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _newController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Nova senha'),
                validator: (value) {
                  final error = Validators.password(value);
                  if (error != null) return error;
                  if (value == _currentController.text) return 'A nova senha deve ser diferente da atual';
                  return null;
                },
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _confirmController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Confirme a nova senha'),
                validator: (value) => value != _newController.text ? 'As senhas não coincidem' : null,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: _loading ? null : () => Navigator.pop(context), child: const Text('Cancelar')),
        TextButton(
          onPressed: _loading ? null : _save,
          child: _loading
              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Salvar'),
        ),
      ],
    );
  }
}
