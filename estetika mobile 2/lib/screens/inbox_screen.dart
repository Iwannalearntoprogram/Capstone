import 'package:flutter/material.dart';

// Messaging/inbox feature removed.
// Kept a minimal stub so imports don't break during transition.

class InboxScreen extends StatelessWidget {
  const InboxScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inbox (removed)'),
        backgroundColor: const Color(0xff203B32),
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Messaging has been removed from this app.'),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => Navigator.pushReplacementNamed(context, '/home'),
              child: const Text('Go home'),
            ),
          ],
        ),
      ),
    );
  }
}
