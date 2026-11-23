import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:happysnouts/models/picked_photo.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:image_picker/image_picker.dart';

export 'package:happysnouts/models/picked_photo.dart';

/// Abre a galeria (ou a câmera, no celular) e devolve a foto escolhida.
/// A imagem é reduzida para no máximo [maxSide] px, como o reduzirImagem() do
/// site, para ficar bem abaixo do limite de 2 MB do backend.
Future<PickedPhoto?> pickPhoto(BuildContext context, {double maxSide = 800}) async {
  final canUseCamera =
      !kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS);
  var source = ImageSource.gallery;
  if (canUseCamera) {
    final chosen = await showModalBottomSheet<ImageSource>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Escolher da galeria'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Tirar foto'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
          ],
        ),
      ),
    );
    if (chosen == null) return null;
    source = chosen;
  }

  final file = await ImagePicker().pickImage(source: source, maxWidth: maxSide, maxHeight: maxSide, imageQuality: 85);
  if (file == null) return null;
  final bytes = await file.readAsBytes();
  final name = file.name.isEmpty ? 'foto.jpg' : file.name;
  return PickedPhoto(bytes: bytes, fileName: name, mimeType: file.mimeType ?? _mimeFromName(name));
}

String _mimeFromName(String name) {
  final lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/// Avatar redondo com foto (nova escolhida ou já salva no backend) ou ícone.
/// Com [onEdit], mostra o botão de câmera para trocar a foto.
class PhotoAvatar extends StatelessWidget {
  final String imageUrl;
  final Uint8List? bytes;
  final double radius;
  final IconData fallbackIcon;
  final VoidCallback? onEdit;

  const PhotoAvatar({
    super.key,
    this.imageUrl = '',
    this.bytes,
    this.radius = 28,
    this.fallbackIcon = Icons.person,
    this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final ImageProvider? image = bytes != null
        ? MemoryImage(bytes!)
        : imageUrl.startsWith('http')
        ? NetworkImage(imageUrl)
        : null;
    final avatar = CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.orange,
      foregroundImage: image,
      onForegroundImageError: image == null ? null : (_, _) {},
      child: Icon(fallbackIcon, color: Colors.white, size: radius * 0.9),
    );
    if (onEdit == null) return avatar;
    return Semantics(
      button: true,
      label: 'Trocar foto',
      child: GestureDetector(
        onTap: onEdit,
        child: Stack(
          children: [
            avatar,
            Positioned(
              right: 0,
              bottom: 0,
              child: CircleAvatar(
                radius: radius * 0.32 < 12 ? 12 : radius * 0.32,
                backgroundColor: AppColors.navy,
                child: Icon(Icons.photo_camera, color: Colors.white, size: radius * 0.32 < 12 ? 13 : radius * 0.34),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
