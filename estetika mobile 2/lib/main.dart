import 'package:estetika_ui/screens/welcome_screen.dart';
import 'package:flutter/material.dart';
import 'package:estetika_ui/theme/theme.dart';
import 'package:estetika_ui/screens/home_screen.dart';
import 'package:estetika_ui/screens/signin_screen.dart';
import 'package:estetika_ui/screens/profile_screen.dart';
import 'package:estetika_ui/screens/inbox_screen.dart';
import 'package:estetika_ui/screens/projects_screen.dart';
import 'package:estetika_ui/screens/notification_screen.dart';
// import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // await dotenv.load(fileName: ".env");
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Estetika',
      theme: lightMode,
      home: const WelcomeScreen(),
      routes: {
        '/welcome': (context) => const WelcomeScreen(),
        '/signin': (context) => const SigninScreen(),
        '/home': (context) => const HomeScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/inbox': (context) => const InboxScreen(),
        '/notification': (context) => const NotificationScreen(),
        '/projects': (context) => const ProjectsScreen(),
      },
    );
  }
}
