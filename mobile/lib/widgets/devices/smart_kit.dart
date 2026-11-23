import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:happysnouts/theme/app_colors.dart';

/// Kit visual das telas de dispositivos inteligentes (coleira GPS e comedouro):
/// paleta "Smart Pet", fonte Plus Jakarta Sans, cards brancos com sombra
/// difusa (sem bordas escuras), badges translúcidos, progresso e gráficos.
class SmartColors {
  final bool isDark;

  const SmartColors._(this.isDark);

  factory SmartColors.of(BuildContext context) => SmartColors._(Theme.of(context).brightness == Brightness.dark);

  static const navy = Color(0xFF0A2540);
  static const navySoft = Color(0xFF173A63);
  static const orange = Color(0xFFFF8A00);
  static const green = Color(0xFF12B76A);
  static const greenDark = Color(0xFF05603A);
  static const red = Color(0xFFF04438);
  static const blue = Color(0xFF2E90FA);

  Color get background => isDark ? AppColors.darkBackground : const Color(0xFFF6F8FB);
  Color get card => isDark ? AppColors.darkSurface : Colors.white;
  Color get soft => isDark ? AppColors.darkSurfaceHigh : const Color(0xFFF1F4F9);
  Color get title => isDark ? Colors.white : navy;
  Color get text => isDark ? Colors.white : const Color(0xFF101828);
  Color get muted => isDark ? Colors.white60 : const Color(0xFF8A94A6);
  Color get line => isDark ? AppColors.darkOutline : const Color(0xFFEEF1F6);
  Color get accent => orange;

  /// Barras "normais" dos gráficos (a em destaque fica laranja).
  Color get chartBar => isDark ? const Color(0xFF4F6F96) : navy;

  /// Azul-marinho para ícones e textos de destaque (mais claro no escuro).
  Color get brand => isDark ? AppColors.navyLight : navy;
  List<BoxShadow> get shadow => isDark
      ? const []
      : [
          BoxShadow(color: navy.withValues(alpha: 0.06), blurRadius: 24, offset: const Offset(0, 8)),
          BoxShadow(color: navy.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 1)),
        ];
}

class SmartTheme extends StatelessWidget {
  final Widget child;

  const SmartTheme({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context);
    final colors = SmartColors.of(context);
    return Theme(
      data: base.copyWith(
        textTheme: GoogleFonts.plusJakartaSansTextTheme(base.textTheme),
        scaffoldBackgroundColor: colors.background,
        colorScheme: base.colorScheme.copyWith(
          primary: base.brightness == Brightness.dark ? SmartColors.orange : SmartColors.navy,
        ),
        switchTheme: SwitchThemeData(
          thumbColor: WidgetStateProperty.resolveWith((s) => Colors.white),
          trackColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? SmartColors.orange : colors.line,
          ),
          trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
        ),
      ),
      child: DefaultTextStyle.merge(style: GoogleFonts.plusJakartaSans(), child: child),
    );
  }
}

class SmartCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;

  const SmartCard({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: color ?? c.card,
        borderRadius: BorderRadius.circular(20),
        boxShadow: c.shadow,
        // No escuro não há sombra: um contorno sutil separa o card do fundo.
        border: c.isDark ? Border.all(color: c.line) : null,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}

class SmartBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? textColor;
  final IconData? icon;
  final bool dot;

  const SmartBadge({super.key, required this.label, required this.color, this.textColor, this.icon, this.dot = false});

  factory SmartBadge.online(String label, {Key? key}) =>
      SmartBadge(key: key, label: label, color: SmartColors.green, textColor: SmartColors.greenDark, dot: true);

  @override
  Widget build(BuildContext context) {
    // Os tons escuros de texto somem no tema escuro: lá usa a própria cor.
    final fg = SmartColors.of(context).isDark ? color : (textColor ?? color);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.13), borderRadius: BorderRadius.circular(30)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dot) ...[
            Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
          ],
          if (icon != null) ...[Icon(icon, size: 14, color: fg), const SizedBox(width: 4)],
          Text(
            label,
            style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class SmartIconChip extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;

  const SmartIconChip({super.key, required this.icon, required this.color, this.size = 38});

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(size * 0.32)),
    child: Icon(icon, color: color, size: size * 0.52),
  );
}

class SmartSectionTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const SmartSectionTitle(this.title, {super.key, this.subtitle, this.trailing});

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: c.title, letterSpacing: -0.2),
              ),
              if (subtitle != null) Text(subtitle!, style: TextStyle(fontSize: 12.5, color: c.muted)),
            ],
          ),
        ),
        ?trailing,
      ],
    );
  }
}

class SmartProgressBar extends StatelessWidget {
  final double value;
  final Color color;
  final double height;

  const SmartProgressBar({super.key, required this.value, this.color = SmartColors.orange, this.height = 6});

  @override
  Widget build(BuildContext context) {
    final track = SmartColors.of(context).line;
    return ClipRRect(
      borderRadius: BorderRadius.circular(height),
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: value.clamp(0, 1)),
        duration: const Duration(milliseconds: 900),
        curve: Curves.easeOutCubic,
        builder: (context, v, _) =>
            LinearProgressIndicator(value: v, minHeight: height, color: color, backgroundColor: track),
      ),
    );
  }
}

class SmartSegmented extends StatelessWidget {
  final List<String> options;
  final int selected;
  final ValueChanged<int> onChanged;
  final bool dense;

  const SmartSegmented({
    super.key,
    required this.options,
    required this.selected,
    required this.onChanged,
    this.dense = false,
  });

  @override
  Widget build(BuildContext context) {
    final c = SmartColors.of(context);
    final height = dense ? 34.0 : 44.0;
    return Container(
      height: height,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: dense ? c.soft : c.card,
        borderRadius: BorderRadius.circular(height),
        boxShadow: dense ? null : c.shadow,
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final w = constraints.maxWidth / options.length;
          return Stack(
            children: [
              AnimatedPositioned(
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOutCubic,
                left: w * selected,
                top: 0,
                bottom: 0,
                width: w,
                child: Container(
                  decoration: BoxDecoration(
                    color: SmartColors.orange,
                    borderRadius: BorderRadius.circular(height),
                    boxShadow: [
                      BoxShadow(
                        color: SmartColors.orange.withValues(alpha: 0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                ),
              ),
              Row(
                children: [
                  for (var i = 0; i < options.length; i++)
                    Expanded(
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => onChanged(i),
                        child: Center(
                          child: AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 200),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: dense ? 12 : 12.5,
                              fontWeight: FontWeight.w700,
                              color: i == selected ? Colors.white : c.muted,
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6),
                              child: FittedBox(fit: BoxFit.scaleDown, child: Text(options[i], maxLines: 1)),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

/// "zoe" -> "Zoe", "viralata" -> "Vira-lata", "golden retriever" -> "Golden Retriever".
String prettyName(String value) {
  final text = value.trim();
  if (text.isEmpty) return text;
  final key = text.toLowerCase().replaceAll(RegExp(r'[\s_-]+'), '');
  const special = {
    'viralata': 'Vira-lata',
    'srd': 'SRD (sem raça definida)',
    'shitszu': 'Shih Tzu',
    'shihtzu': 'Shih Tzu',
  };
  if (special.containsKey(key)) return special[key]!;
  const small = {'de', 'da', 'do', 'das', 'dos', 'e'};
  var first = true;
  return text
      .split(RegExp(r'\s+'))
      .map((word) {
        final lower = word.toLowerCase();
        final keepSmall = !first && small.contains(lower);
        first = false;
        if (keepSmall || word.isEmpty) return lower;
        return lower.split('-').map((p) => p.isEmpty ? p : p[0].toUpperCase() + p.substring(1)).join('-');
      })
      .join(' ');
}
