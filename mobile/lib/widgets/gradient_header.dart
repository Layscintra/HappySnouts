import 'package:flutter/material.dart';

/// Cabeçalho padrão das telas que montam o topo dentro do corpo (Meus Dados,
/// Endereços, Formas de Pagamento, Dispositivos e Rastreador). Usa o mesmo
/// AppBar do tema (fundo claro, seta e título à esquerda) das demais telas,
/// como "Meus Pets", para manter o topo igual em todo o app.
class GradientHeader extends StatelessWidget {
  final String title;
  final bool showBack;
  final Widget? trailing;
  final Widget? bottom;

  const GradientHeader({super.key, required this.title, this.showBack = true, this.trailing, this.bottom});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        AppBar(
          title: Text(title),
          automaticallyImplyLeading: false,
          leading: showBack
              ? IconButton(
                  tooltip: 'Voltar',
                  onPressed: () => Navigator.maybePop(context),
                  icon: const Icon(Icons.arrow_back),
                )
              : null,
          titleSpacing: showBack ? 0 : 20,
          actions: [?trailing],
        ),
        if (bottom != null) Padding(padding: const EdgeInsets.fromLTRB(20, 4, 20, 0), child: bottom!),
      ],
    );
  }
}
