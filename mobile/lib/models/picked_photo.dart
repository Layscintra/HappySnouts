import 'dart:typed_data';

class PickedPhoto {
  final Uint8List bytes;
  final String fileName;
  final String mimeType;

  const PickedPhoto({required this.bytes, required this.fileName, required this.mimeType});
}
