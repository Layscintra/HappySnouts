import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/theme/app_colors.dart';

class AppTheme {
  AppTheme._();

  /// Barra de status transparente com ícones claros (para fundos escuros:
  /// cabeçalho azul, tema escuro).
  static const lightStatusIcons = SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    statusBarBrightness: Brightness.dark,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarContrastEnforced: false,
  );

  /// Barra de status transparente com ícones escuros (para fundos claros).
  static const darkStatusIcons = SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarContrastEnforced: false,
  );

  static SystemUiOverlayStyle statusFor(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? lightStatusIcons : darkStatusIcons;

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.navy,
      primary: AppColors.navy,
      onPrimary: Colors.white,
      secondary: AppColors.orangeStrong,
      onSecondary: AppColors.navyDark,
      tertiary: AppColors.green,
      surface: AppColors.surface,
      onSurface: AppColors.textDark,
      error: AppColors.red,
      outline: AppColors.outline,
      outlineVariant: AppColors.outline,
    );
    return _base(scheme, background: AppColors.background);
  }

  static ThemeData dark() {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.navy,
      brightness: Brightness.dark,
      primary: AppColors.navyLight,
      onPrimary: AppColors.navyDark,
      secondary: AppColors.orange,
      onSecondary: AppColors.navyDark,
      tertiary: AppColors.green,
      surface: AppColors.darkSurface,
      onSurface: Colors.white,
      error: const Color(0xFFFF6B6B),
      outline: AppColors.darkOutline,
      outlineVariant: AppColors.darkOutline,
    );
    return _base(scheme, background: AppColors.darkBackground);
  }

  static ThemeData _base(ColorScheme scheme, {required Color background}) {
    final isDark = scheme.brightness == Brightness.dark;
    final title = isDark ? Colors.white : AppColors.navy;
    final text = isDark ? Colors.white : AppColors.textDark;
    final muted = isDark ? Colors.white60 : AppColors.textMuted;
    final border = isDark ? AppColors.darkOutline : AppColors.outline;
    final field = isDark ? AppColors.darkSurfaceHigh : Colors.white;
    final buttonBg = isDark ? AppColors.orange : AppColors.navy;
    final buttonFg = isDark ? AppColors.navyDark : Colors.white;
    final radius = BorderRadius.circular(14);

    final baseText = Typography.material2021(platform: TargetPlatform.android).black;
    final textTheme = baseText
        .copyWith(
          displaySmall: baseText.displaySmall?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.5),
          headlineMedium: const TextStyle(fontWeight: FontWeight.w800, fontSize: 26, letterSpacing: -0.4),
          headlineSmall: const TextStyle(fontWeight: FontWeight.w800, fontSize: 22, letterSpacing: -0.3),
          titleLarge: const TextStyle(fontWeight: FontWeight.w700, fontSize: 19, letterSpacing: -0.2),
          titleMedium: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          titleSmall: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          bodyLarge: const TextStyle(fontSize: 15, height: 1.45),
          bodyMedium: const TextStyle(fontSize: 14, height: 1.4),
          bodySmall: TextStyle(fontSize: 12, height: 1.35, color: muted),
          labelLarge: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, letterSpacing: 0.1),
        )
        .apply(bodyColor: text, displayColor: title);

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      brightness: scheme.brightness,
      primaryColor: AppColors.navy,
      scaffoldBackgroundColor: background,
      canvasColor: background,
      cardColor: scheme.surface,
      dividerColor: border,
      textTheme: textTheme,
      visualDensity: VisualDensity.standard,
      splashFactory: InkSparkle.splashFactory,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.windows: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.linux: FadeForwardsPageTransitionsBuilder(),
        },
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        foregroundColor: title,
        surfaceTintColor: Colors.transparent,
        // Barra de status transparente, com ícones visíveis sobre o fundo da AppBar.
        systemOverlayStyle: isDark ? AppTheme.lightStatusIcons : AppTheme.darkStatusIcons,
        elevation: 0,
        scrolledUnderElevation: 0.6,
        shadowColor: Colors.black26,
        centerTitle: false,
        titleSpacing: 20,
        titleTextStyle: TextStyle(color: title, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.3),
        iconTheme: IconThemeData(color: title),
        actionsIconTheme: IconThemeData(color: title),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: buttonBg,
          foregroundColor: buttonFg,
          disabledBackgroundColor: isDark ? Colors.white12 : const Color(0xFFD9DEE8),
          disabledForegroundColor: isDark ? Colors.white38 : const Color(0xFF8E95A6),
          elevation: 0,
          minimumSize: const Size(64, 52),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 22),
          shape: RoundedRectangleBorder(borderRadius: radius),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, letterSpacing: 0.1),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: buttonBg,
          foregroundColor: buttonFg,
          minimumSize: const Size(64, 52),
          shape: RoundedRectangleBorder(borderRadius: radius),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: title,
          side: BorderSide(color: border, width: 1.4),
          minimumSize: const Size(64, 52),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 22),
          shape: RoundedRectangleBorder(borderRadius: radius),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: isDark ? AppColors.orange : AppColors.navy,
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(style: IconButton.styleFrom(foregroundColor: title)),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.orangeStrong,
        foregroundColor: AppColors.navyDark,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        extendedTextStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: field,
        isDense: false,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: TextStyle(color: muted, fontSize: 14),
        labelStyle: TextStyle(color: muted, fontSize: 14),
        floatingLabelStyle: TextStyle(color: isDark ? AppColors.orange : AppColors.navy, fontWeight: FontWeight.w600),
        prefixIconColor: muted,
        suffixIconColor: muted,
        border: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: isDark ? AppColors.orange : AppColors.navy, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: scheme.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: scheme.error, width: 1.6),
        ),
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: border),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: isDark ? AppColors.darkSurfaceHigh : Colors.white,
        selectedColor: isDark ? AppColors.orange.withValues(alpha: 0.25) : AppColors.orangeSoft,
        side: BorderSide(color: border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        labelStyle: TextStyle(color: text, fontWeight: FontWeight.w600, fontSize: 13),
        secondaryLabelStyle: TextStyle(color: isDark ? AppColors.orange : AppColors.navy, fontWeight: FontWeight.w700),
        checkmarkColor: isDark ? AppColors.orange : AppColors.navy,
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scheme.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        height: 68,
        indicatorColor: isDark ? AppColors.orange.withValues(alpha: 0.22) : AppColors.orangeSoft,
        indicatorShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: 24,
            color: states.contains(WidgetState.selected) ? (isDark ? AppColors.orange : AppColors.orangeStrong) : muted,
          ),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 12,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w800 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? title : muted,
          ),
        ),
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: title,
        unselectedLabelColor: muted,
        indicatorColor: AppColors.orangeStrong,
        indicatorSize: TabBarIndicatorSize.label,
        dividerColor: border,
        labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: title,
        titleTextStyle: TextStyle(color: text, fontWeight: FontWeight.w600, fontSize: 15),
        subtitleTextStyle: TextStyle(color: muted, fontSize: 13),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      dividerTheme: DividerThemeData(color: border, thickness: 1, space: 1),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: scheme.surface,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(26))),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: scheme.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        titleTextStyle: TextStyle(color: title, fontSize: 19, fontWeight: FontWeight.w800),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isDark ? AppColors.darkSurfaceHigh : AppColors.navyDark,
        contentTextStyle: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
        actionTextColor: AppColors.orange,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.orangeStrong),
      badgeTheme: const BadgeThemeData(backgroundColor: AppColors.orangeStrong, textColor: AppColors.navyDark),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? Colors.white : null,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? (isDark ? AppColors.orangeStrong : AppColors.navy) : null,
        ),
      ),
      checkboxTheme: CheckboxThemeData(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5))),
    );
  }
}

/// Cores que mudam entre tema claro e escuro. Use `context.palette.x`
/// em vez de Colors.white / AppColors.navy fixos para o tema escuro funcionar.
class AppPalette {
  final bool isDark;

  const AppPalette(this.isDark);

  Color get card => isDark ? AppColors.darkSurface : Colors.white;

  Color get softCard => isDark ? AppColors.darkSurfaceHigh : const Color(0xFFEEF1F7);

  Color get background => isDark ? AppColors.darkBackground : AppColors.background;

  Color get title => isDark ? Colors.white : AppColors.navy;

  Color get text => isDark ? Colors.white : AppColors.textDark;

  Color get muted => isDark ? Colors.white60 : AppColors.textMuted;

  Color get border => isDark ? AppColors.darkOutline : AppColors.outline;

  Color get accent => isDark ? AppColors.orange : AppColors.orangeStrong;

  Color get link => isDark ? AppColors.navyLight : AppColors.navy;

  List<BoxShadow> get shadow => isDark
      ? const []
      : [BoxShadow(color: AppColors.navy.withValues(alpha: 0.06), blurRadius: 18, offset: const Offset(0, 6))];
}

extension AppPaletteContext on BuildContext {
  AppPalette get palette => AppPalette(Theme.of(this).brightness == Brightness.dark);
}
