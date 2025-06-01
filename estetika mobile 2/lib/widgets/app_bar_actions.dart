import 'package:flutter/material.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final BuildContext context;
  final bool isInboxScreen;
  final bool isNotificationScreen;
  final bool isProfileScreen;
  final bool showBackButton;
  
  const CustomAppBar({
    super.key,
    required this.context,
    this.isInboxScreen = false,
    this.isNotificationScreen = false,
    this.isProfileScreen = false,
    this.showBackButton = false,
  });

  @override
  Size get preferredSize => const Size.fromHeight(70.0);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      automaticallyImplyLeading: false,
      leading: showBackButton
          ? Padding(
              padding: const EdgeInsets.only(left: 8.0, top: 8.0, bottom: 8.0),
              child: IconButton(
                icon: const Icon(
                  Icons.arrow_back,
                  color: Colors.black,
                  size: 30.0,
                ),
                onPressed: () {
                  Navigator.pushReplacementNamed(context, '/home');
                },
              ),
            )
          : null,
      title: null,
      centerTitle: true,
      actions: [
        // Mail icon
        Padding(
          padding: const EdgeInsets.only(right: 8.0, top: 8.0, bottom: 8.0),
          child: IconButton(
            icon: Icon(
              isInboxScreen ? Icons.mail : Icons.mail_outline,
              color: isInboxScreen ? const Color(0xff203B32) : Colors.black,
              size: 30.0,
            ),
            onPressed: isInboxScreen
                ? null
                : () => Navigator.pushNamed(context, '/inbox'),
          ),
        ),
        // Notification icon
        Padding(
          padding: const EdgeInsets.only(right: 8.0, top: 8.0, bottom: 8.0),
          child: IconButton(
            icon: Icon(
              isNotificationScreen ? Icons.notifications : Icons.notifications_none,
              color: isNotificationScreen ? const Color(0xff203B32) : Colors.black,
              size: 30.0,
            ),
            onPressed: isNotificationScreen
                ? null
                : () => Navigator.pushNamed(context, '/notification'),
          ),
        ),
        // Profile icon
        Padding(
          padding: const EdgeInsets.only(right: 16.0, top: 8.0, bottom: 8.0),
          child: IconButton(
            icon: Icon(
              isProfileScreen ? Icons.person : Icons.person_outline,
              color: isProfileScreen ? const Color(0xff203B32) : Colors.black,
              size: 30.0,
            ),
            onPressed: isProfileScreen
                ? null
                : () => Navigator.pushNamed(context, '/profile'),
          ),
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(2.0),
        child: Container(
          color: Colors.grey[300],
          height: 1.0,
        ),
      ),
    );
  }
}