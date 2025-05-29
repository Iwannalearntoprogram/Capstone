import 'package:flutter/material.dart';
import 'package:estetika_ui/widgets/custom_scaffold.dart';
import 'package:estetika_ui/widgets/custom_text_field.dart';
import 'package:estetika_ui/widgets/primary_button.dart';
import 'package:estetika_ui/widgets/account_switch_link.dart';
import 'package:estetika_ui/screens/signin_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  // Renamed
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() =>
      _ForgetPasswordScreenState(); // Renamed
}

class _ForgetPasswordScreenState extends State<ForgotPasswordScreen> {
  // Renamed
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _resetPassword() {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      // Simulate API call
      Future.delayed(const Duration(seconds: 2), () {
        setState(() {
          _isLoading = false;
        });

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password reset link sent to your email'),
            backgroundColor: Color(0xFF203B32),
          ),
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      child: Column(
        children: [
          const Expanded(flex: 1, child: SizedBox(height: 10)),
          Expanded(
            flex: 20,
            child: Container(
              padding: const EdgeInsets.fromLTRB(25, 10, 25, 20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(40.0),
                  topRight: Radius.circular(40.0),
                ),
              ),
              child: SingleChildScrollView(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const SizedBox(height: 30.0),
                      Text(
                        'Forgot Password',
                        style: TextStyle(
                          fontSize: 30.0,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Figtree',
                          color: const Color(0xFF203B32),
                        ),
                      ),
                      const SizedBox(height: 20.0),
                      const Text(
                        'Enter your email address and we will send you a link to reset your password',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16.0,
                          fontWeight: FontWeight.w400,
                          fontFamily: 'Figtree',
                          color: Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 40.0),
                      CustomTextField(
                        label: 'Email',
                        hintText: 'Enter your email',
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your email';
                          }
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                              .hasMatch(value)) {
                            return 'Please enter a valid email address';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 40.0),
                      PrimaryButton(
                        text: 'Reset Password',
                        onPressed: _resetPassword,
                        isLoading: _isLoading,
                        padding: const EdgeInsets.symmetric(vertical: 16.0),
                      ),
                      const SizedBox(height: 30.0),
                      AccountSwitchLink(
                        promptText: 'Remember your password? ',
                        linkText: 'Sign In',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const SigninScreen(),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
