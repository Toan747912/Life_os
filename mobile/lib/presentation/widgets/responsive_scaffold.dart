import 'package:flutter/material.dart';

class ResponsiveScaffold extends StatelessWidget {
  final Widget mobileBody;
  final Widget? desktopBody;

  const ResponsiveScaffold({
    super.key,
    required this.mobileBody,
    this.desktopBody,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 600) {
          return mobileBody;
        } else {
          return desktopBody ?? mobileBody;
        }
      },
    );
  }
}
