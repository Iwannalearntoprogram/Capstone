import 'package:flutter/material.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final bool isInboxScreen;
  final bool isNotificationScreen;
  final bool isProfileScreen;
  final bool showBackButton;

  const CustomAppBar({
    super.key,
    this.isInboxScreen = false,
    this.isNotificationScreen = false,
    this.isProfileScreen = false,
    this.showBackButton = false, 
    required List actions, 
    required String title,
  });

  @override
  Size get preferredSize => const Size.fromHeight(70.0);

  @override
  Widget build(BuildContext context) {
    const Color appBarColor = Color(0xff203B32);
    const Color iconColor = Colors.white;

    return AppBar(
      backgroundColor: appBarColor,
      elevation: 0,
      automaticallyImplyLeading: false,
      leading: showBackButton
          ? Padding(
              padding: const EdgeInsets.only(left: 8.0, top: 8.0, bottom: 8.0),
              child: IconButton(
                icon: const Icon(
                  Icons.arrow_back,
                  color: iconColor,
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
        Padding(
          padding: const EdgeInsets.only(right: 6.0, top: 14.0, bottom: 14.0),
          child: IconButton(
            icon: Icon(
              isInboxScreen ? Icons.mail : Icons.mail_outline,
              color: iconColor,
              size: 30.0,
            ),
            onPressed: isInboxScreen
                ? null
                : () => Navigator.pushNamed(context, '/inbox'),
            padding: EdgeInsets.zero,
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 6.0, top: 14.0, bottom: 14.0),
          child: IconButton(
            icon: Icon(
              isNotificationScreen ? Icons.notifications : Icons.notifications_none,
              color: iconColor,
              size: 30.0,
            ),
            onPressed: isNotificationScreen
                ? null
                : () => Navigator.pushNamed(context, '/notification'),
            padding: EdgeInsets.zero,
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 12.0, top: 14.0, bottom: 14.0),
          child: IconButton(
            icon: Icon(
              isProfileScreen ? Icons.person : Icons.person_outline,
              color: iconColor,
              size: 30.0,
            ),
            onPressed: isProfileScreen
                ? null
                : () => Navigator.pushNamed(context, '/profile'),
            padding: EdgeInsets.zero,
          ),
        ),
      ],
      bottom: const PreferredSize(
        preferredSize: Size.fromHeight(2.0),
        child: Divider(
          color: Colors.white,
          height: 1.0,
          thickness: 1.0,
        ),
      ),
    );
  }
}
