import 'package:flutter/material.dart';
import 'nav_button.dart';

class NavBar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onIndexSelected;
  final List<String> itemTitles;
  
  const NavBar({
    super.key,
    required this.selectedIndex,
    required this.onIndexSelected,
    this.itemTitles = const ['Home', 'Projects'],
  });
  
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: 16.0,
        horizontal: 24.0,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          itemTitles.length,
          (index) {
            return Row(
              children: [
                NavButton(
                  title: itemTitles[index],
                  isSelected: selectedIndex == index,
                  onTap: () => onIndexSelected(index),
                ),
                if (index < itemTitles.length - 1)
                  const SizedBox(width: 16),
              ],
            );
          },
        ),
      ),
    );
  }
}