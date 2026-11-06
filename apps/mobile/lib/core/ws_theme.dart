import 'package:flutter/material.dart';

/// WHOLESALE B2B Design System v3 — Flutter port.
/// Mirrors packages/design-tokens/tokens.css: navy trust + signal orange.
class WsColors {
  static const canvas = Color(0xFFF3F5F9);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceMuted = Color(0xFFEEF1F6);

  static const text = Color(0xFF15273E);
  static const text2 = Color(0xFF3C4F68);
  static const muted = Color(0xFF64748B);
  static const faint = Color(0xFF8FA0B5);

  static const brand = Color(0xFFEA580C);
  static const brandHover = Color(0xFF9A3412);
  static const brandLight = Color(0xFFFFEDD5);
  static const brandFaint = Color(0xFFFFF7ED);
  static const navy = Color(0xFF173A5E);
  static const navyDark = Color(0xFF0F243B);
  static const navyInk = Color(0xFF0B1C30);

  static const border = Color(0xFFD5DDE8);
  static const borderSubtle = Color(0xFFE6EBF2);

  static const success = Color(0xFF15803D);
  static const successBg = Color(0xFFDCFCE7);
  static const warning = Color(0xFFB45309);
  static const warningBg = Color(0xFFFEF3C7);
  static const danger = Color(0xFFB91C1C);
  static const dangerBg = Color(0xFFFEE2E2);
  static const info = Color(0xFF1D4ED8);
  static const infoBg = Color(0xFFDBEAFE);
}

ThemeData wsTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: WsColors.brand,
    primary: WsColors.brand,
    secondary: WsColors.navy,
    surface: WsColors.surface,
  );
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: WsColors.canvas,
    fontFamily: 'NotoSansKR',
    fontFamilyFallback: const ['Roboto', 'sans-serif'],
  );
  return base.copyWith(
    appBarTheme: const AppBarTheme(
      backgroundColor: WsColors.surface,
      foregroundColor: WsColors.text,
      elevation: 0,
      scrolledUnderElevation: 1,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w800,
        color: WsColors.text,
        letterSpacing: -0.2,
      ),
    ),
    cardTheme: CardThemeData(
      color: WsColors.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: WsColors.borderSubtle),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: WsColors.brand,
        foregroundColor: Colors.white,
        textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: WsColors.text,
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        side: const BorderSide(color: WsColors.border),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: WsColors.info,
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: WsColors.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      hintStyle: const TextStyle(color: WsColors.faint, fontSize: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: WsColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: WsColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: WsColors.brand, width: 1.6),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: WsColors.surface,
      side: const BorderSide(color: WsColors.border),
      labelStyle: const TextStyle(
        color: WsColors.text2,
        fontWeight: FontWeight.w600,
        fontSize: 12,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: WsColors.surface,
      selectedItemColor: WsColors.brand,
      unselectedItemColor: WsColors.muted,
      selectedLabelStyle: TextStyle(fontWeight: FontWeight.w800, fontSize: 11),
      unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    dividerTheme: const DividerThemeData(
      color: WsColors.borderSubtle,
      thickness: 1,
      space: 1,
    ),
  );
}

/// Small pill badge mirroring .ws-badge.
class WsBadge extends StatelessWidget {
  final String label;
  final Color bg;
  final Color fg;
  final IconData? icon;

  const WsBadge(this.label, {super.key, required this.bg, required this.fg, this.icon});

  const WsBadge.ok(String label, {Key? key, IconData? icon})
      : this(label, key: key, bg: WsColors.successBg, fg: WsColors.success, icon: icon);
  const WsBadge.warn(String label, {Key? key, IconData? icon})
      : this(label, key: key, bg: WsColors.warningBg, fg: WsColors.warning, icon: icon);
  const WsBadge.bad(String label, {Key? key, IconData? icon})
      : this(label, key: key, bg: WsColors.dangerBg, fg: WsColors.danger, icon: icon);
  const WsBadge.info(String label, {Key? key, IconData? icon})
      : this(label, key: key, bg: WsColors.infoBg, fg: WsColors.info, icon: icon);
  const WsBadge.brand(String label, {Key? key, IconData? icon})
      : this(label, key: key, bg: WsColors.brandLight, fg: WsColors.brand, icon: icon);
  const WsBadge.navy(String label, {Key? key, IconData? icon})
      : this(label, key: key, bg: WsColors.navy, fg: Colors.white, icon: icon);
  const WsBadge.muted(String label, {Key? key, IconData? icon})
      : this(label, key: key, bg: WsColors.surfaceMuted, fg: WsColors.text2, icon: icon);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 11, color: fg),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: fg),
          ),
        ],
      ),
    );
  }
}

/// Section title row mirroring .ws-section-head.
class WsSectionHead extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  const WsSectionHead(this.title, {super.key, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.2,
            color: WsColors.text,
          ),
        ),
        if (actionLabel != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

/// KPI stat card mirroring .ws-stat.
class WsStatCard extends StatelessWidget {
  final String label;
  final String value;
  final String? foot;
  final Color? valueColor;

  const WsStatCard({
    super.key,
    required this.label,
    required this.value,
    this.foot,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: WsColors.muted)),
            const SizedBox(height: 4),
            Text(value,
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                    color: valueColor ?? WsColors.text)),
            if (foot != null) ...[
              const SizedBox(height: 2),
              Text(foot!,
                  style: const TextStyle(fontSize: 11, color: WsColors.faint)),
            ],
          ],
        ),
      ),
    );
  }
}

/// Empty state mirroring .ws-empty.
class WsEmpty extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? body;
  final String? actionLabel;
  final VoidCallback? onAction;

  const WsEmpty({
    super.key,
    required this.icon,
    required this.title,
    this.body,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: WsColors.surfaceMuted,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 26, color: WsColors.muted),
            ),
            const SizedBox(height: 12),
            Text(title,
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w800, color: WsColors.text)),
            if (body != null) ...[
              const SizedBox(height: 6),
              Text(body!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, color: WsColors.muted)),
            ],
            if (actionLabel != null) ...[
              const SizedBox(height: 16),
              ElevatedButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

/// Info banner mirroring .ws-banner.
class WsBanner extends StatelessWidget {
  final String text;
  final IconData icon;
  final Color bg;
  final Color fg;

  const WsBanner._(this.text,
      {required this.icon, required this.bg, required this.fg});

  const WsBanner.info(String text, {Key? key})
      : this._(text, icon: Icons.info_outline, bg: WsColors.infoBg, fg: WsColors.info);
  const WsBanner.warn(String text, {Key? key})
      : this._(text,
            icon: Icons.warning_amber_outlined,
            bg: WsColors.warningBg,
            fg: WsColors.warning);
  const WsBanner.bad(String text, {Key? key})
      : this._(text,
            icon: Icons.error_outline, bg: WsColors.dangerBg, fg: WsColors.danger);
  const WsBanner.ok(String text, {Key? key})
      : this._(text,
            icon: Icons.check_circle_outline,
            bg: WsColors.successBg,
            fg: WsColors.success);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: fg),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: TextStyle(
                    fontSize: 13, color: fg, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
