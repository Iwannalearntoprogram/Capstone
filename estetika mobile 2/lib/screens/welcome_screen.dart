import 'package:estetika_ui/screens/signin_screen.dart';
import 'package:estetika_ui/screens/signup_screen.dart';
import 'package:estetika_ui/widgets/custom_scaffold.dart';
import 'package:estetika_ui/widgets/welcome_button.dart';
import 'package:flutter/material.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      showBackIcon: false, // This disables the back icon
      child: Stack(
        children: [
          // Background content
          Positioned.fill(
            child: Image.asset(
              'assets/images/leaves.jpg', // Path to your background image
              fit: BoxFit.cover, // Ensure the background covers the screen
              alignment: Alignment.center, // Adjust alignment to zoom in
            ),
          ),
          // PNG logo
          Align(
            alignment: Alignment.topCenter,
            child: Padding(
              padding:
                  const EdgeInsets.only(top: 100.0), // Adjust the top padding
              child: Image.asset(
                'assets/images/mosslogo.png', // Path to your PNG file
                width: 700, // Increased the width of the logo
                height: 300, // Increased the height of the logo
                fit: BoxFit.contain,
              ),
            ),
          ),
          // Buttons at the bottom
          Column(
            children: [
              const Spacer(), // Pushes the buttons to the bottom
              Padding(
                padding:
                    const EdgeInsets.only(bottom: 50.0), // Lower the buttons
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Center(
                      child: SizedBox(
                        width: 220, // Match button width
                        child: WelcomeButton(
                          buttonText: 'Sign In',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => SigninScreen()),
                            );
                          },
                          color: Colors.transparent, // Transparent button
                          textColor: Colors.white, // White text color
                          textStyle: const TextStyle(
                            fontFamily: 'Figtree',
                            fontWeight: FontWeight.w600, // Demi
                            fontSize: 20.0,
                          ),
                          borderColor: Colors.white, // White border
                          borderWidth: 1.0, // Thinner border
                        ),
                      ),
                    ),
                    const SizedBox(height: 10), // Add spacing between buttons
                    Center(
                      child: SizedBox(
                        width: 220, // Match button width
                        child: WelcomeButton(
                          buttonText: 'Sign Up',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => SignUpScreen()),
                            );
                          },
                          color: Colors.white, // Beige button color
                          textColor:
                              const Color(0xFF203B32), // Moss green text color
                          textStyle: const TextStyle(
                            fontFamily: 'Figtree',
                            fontWeight: FontWeight.w600, // Demi
                            fontSize: 20.0,
                          ),
                          borderColor:
                              const Color(0xFF203B32), // Moss green border
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
