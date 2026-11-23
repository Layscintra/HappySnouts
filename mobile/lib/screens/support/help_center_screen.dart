import 'package:flutter/material.dart';
import 'package:happysnouts/screens/support/contact_screen.dart';
import 'package:happysnouts/theme/app_theme.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  static const _faq = [
    (
      'Como cadastro um novo pet?',
      'Acesse Perfil > Meus Pets e toque em "Adicionar Perfil". Preencha os dados do pet e toque em "Cadastrar pet".',
    ),
    (
      'Como agendo uma vacina ou consulta?',
      'Acesse Perfil > Calendário e toque em "Agendar". Escolha o tipo de cuidado, o pet, a data e o horário.',
    ),
    (
      'Como programo o comedouro automático?',
      'Acesse Perfil > Alimentação. Em "Programações agendadas" você pode adicionar, editar ou remover refeições.',
    ),
    (
      'Como acompanho meus pedidos?',
      'Acesse Perfil > Meus Pedidos. Toque em um pedido para ver os itens, a entrega e o status.',
    ),
    (
      'Posso cancelar um pedido?',
      'Sim, enquanto ele estiver "Em andamento". Abra o pedido e toque em "Cancelar pedido".',
    ),
    (
      'Meus dados de cartão ficam salvos?',
      'Guardamos apenas os 4 últimos dígitos, a bandeira e a validade para você identificar o cartão. O número completo e o CVV não ficam salvos.',
    ),
    (
      'Como mudo para o tema escuro?',
      'Acesse Perfil > Configuração e ative "Tema do Aplicativo". A escolha fica salva no aparelho.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Scaffold(
      appBar: AppBar(title: const Text('Central de Ajuda')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Perguntas frequentes',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: palette.title),
          ),
          const SizedBox(height: 8),
          ..._faq.map(
            (item) => Card(
              color: palette.card,
              margin: const EdgeInsets.only(bottom: 8),
              child: ExpansionTile(
                shape: const Border(),
                title: Text(
                  item.$1,
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: palette.title),
                ),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                expandedCrossAxisAlignment: CrossAxisAlignment.start,
                children: [Text(item.$2, style: TextStyle(color: palette.text, height: 1.4))],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Não encontrou o que procurava?',
            textAlign: TextAlign.center,
            style: TextStyle(color: palette.muted),
          ),
          TextButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ContactScreen())),
            child: const Text('Fale conosco'),
          ),
        ],
      ),
    );
  }
}
