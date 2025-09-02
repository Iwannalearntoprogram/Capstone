import 'package:flutter/material.dart';

// Messaging/chat feature removed. Kept a lightweight stub to avoid breaking imports.

class ChatDetailScreen extends StatelessWidget {
  const ChatDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat (removed)'),
        backgroundColor: const Color(0xff203B32),
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Chat functionality has been removed.'),
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
