import 'package:flutter/material.dart';

class CustomScaffold extends StatelessWidget {
  const CustomScaffold({super.key, this.child, this.showBackIcon = true});
  final Widget? child;
  final bool showBackIcon;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: showBackIcon, // Add this line
        iconTheme: const IconThemeData(
          color: Colors.white,
          size: 35.0,
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: showBackIcon
            ? Padding(
                padding: const EdgeInsets.only(
                    left: 8.0, top: 10.0), // Lower the icon
                child: Builder(
                  builder: (context) => IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => Navigator.of(context).maybePop(),
                    iconSize: 35.0,
                    color: Colors.white,
                    alignment: Alignment.center,
                  ),
                ),
              )
            : null,
      ),
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/images/leaves.jpg',
              fit: BoxFit.cover,
            ),
          ),
          SafeArea(
            child: child!,
          ),
        ],
      ),
    );
  }
}
