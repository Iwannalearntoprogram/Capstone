import 'package:flutter/material.dart';

class NavButton extends StatelessWidget {
  final String title;
  final bool isSelected;
  final VoidCallback onTap;
  final double width;
  
  const NavButton({
    super.key,
    required this.title,
    required this.isSelected,
    required this.onTap,
    this.width = 140,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: width,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xff203B32) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? Colors.transparent : Colors.grey[300]!,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black,
            fontSize: 16,
            fontFamily: 'Figtree',
          ),
        ),
      ),
    );
  }
}