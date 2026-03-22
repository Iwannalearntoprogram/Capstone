import 'package:flutter/material.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.width = 220, this.height, this.alignment});

  final double width;
  final double? height;
  final AlignmentGeometry? alignment;

  @override
  Widget build(BuildContext context) {
    final image = Image.asset(
      'assets/images/logo-moss-circle.png',
      width: width,
      height: height,
      fit: BoxFit.contain,
    );

    if (alignment == null) {
      return image;
    }

    return Align(
      alignment: alignment!,
      child: image,
    );
  }
}
