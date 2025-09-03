import 'package:estetika_ui/screens/signin_screen.dart';
import 'package:estetika_ui/screens/welcome_screen.dart';
import 'package:estetika_ui/widgets/custom_scaffold.dart';
import 'package:estetika_ui/widgets/google_sign_in_button.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/services.dart';
import 'package:estetika_ui/utils/toast.dart';
import 'package:estetika_ui/utils/logger.dart';
import 'dart:convert';
import 'dart:async';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formSignupKey = GlobalKey<FormState>();
  bool agreePersonalData = true;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isSubmitting = false;

  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your email';
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter a password';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!RegExp(r'[a-z]').hasMatch(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(value)) {
      return 'Password must contain at least one special character';
    }
    return null;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _registerUser() async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    final url =
        Uri.parse('https://capstone-moss.onrender.com/api/auth/register');
    // Normalize phone to E.164 using +63 prefix (Philippines)
    final String localDigits =
        _phoneController.text.replaceAll(RegExp(r'\D'), '');
    final String e164Phone = '+63$localDigits';

    final body = {
      "username": _usernameController.text.trim(),
      "firstName": _firstNameController.text.trim(),
      "lastName": _lastNameController.text.trim(),
      "email": _emailController.text.trim(),
      "password": _passwordController.text,
      "phoneNumber": e164Phone,
    };

    try {
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 15));

      Map<String, dynamic>? data;
      try {
        data = response.body.isNotEmpty
            ? jsonDecode(response.body) as Map<String, dynamic>
            : null;
      } catch (_) {
        data = null;
      }

      if (response.statusCode == 201) {
        await showToast('Registration successful! Please sign in.',
            success: true);
        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const SigninScreen()),
        );
      } else {
        AppLogger.error('Registration failed', error: response.statusCode);
        AppLogger.error('Registration response: ${response.body}');
        final msg = data != null && data['message'] is String
            ? data['message'] as String
            : 'Registration failed (${response.statusCode})';
        await showToast(msg);
      }
    } on TimeoutException catch (e, st) {
      AppLogger.error('Registration timeout', error: e, stackTrace: st);
      await showToast('Network timeout. Please try again.');
    } catch (e, st) {
      AppLogger.error('Registration exception', error: e, stackTrace: st);
      await showToast('An error occurred. Please try again.');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      showBackIcon: true,
      child: WillPopScope(
        onWillPop: () async {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const WelcomeScreen()),
          );
          return false;
        },
        child: Column(
          children: [
            const Expanded(flex: 1, child: SizedBox(height: 10)),
            Expanded(
              flex: 20,
              child: Container(
                padding: const EdgeInsets.fromLTRB(25, 40, 25, 20),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(40.0),
                    topRight: Radius.circular(40.0),
                  ),
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    return SingleChildScrollView(
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          minHeight: constraints.maxHeight,
                        ),
                        child: IntrinsicHeight(
                          child: Form(
                            key: _formSignupKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Text(
                                  'Create Account',
                                  style: TextStyle(
                                    fontSize: 30.0,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'Figtree',
                                    color: const Color(0xFF203B32),
                                  ),
                                ),
                                const SizedBox(height: 40.0),
                                Row(
                                  children: [
                                    Expanded(
                                      child: TextFormField(
                                        controller: _firstNameController,
                                        validator: (value) =>
                                            value == null || value.isEmpty
                                                ? 'Enter first name'
                                                : null,
                                        decoration: InputDecoration(
                                          label: const Text('First Name'),
                                          hintText: 'First Name',
                                          border: OutlineInputBorder(
                                            borderRadius:
                                                BorderRadius.circular(10),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: TextFormField(
                                        controller: _lastNameController,
                                        validator: (value) =>
                                            value == null || value.isEmpty
                                                ? 'Enter last name'
                                                : null,
                                        decoration: InputDecoration(
                                          label: const Text('Last Name'),
                                          hintText: 'Last Name',
                                          border: OutlineInputBorder(
                                            borderRadius:
                                                BorderRadius.circular(10),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 25.0),
                                TextFormField(
                                  controller: _usernameController,
                                  validator: (value) =>
                                      value == null || value.isEmpty
                                          ? 'Enter username'
                                          : null,
                                  decoration: InputDecoration(
                                    label: const Text('Username'),
                                    hintText: 'Enter Username',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 25.0),
                                TextFormField(
                                  controller: _emailController,
                                  validator: validateEmail,
                                  decoration: InputDecoration(
                                    label: const Text('Email'),
                                    hintText: 'Enter Email',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 25.0),
                                TextFormField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(10),
                                  ],
                                  validator: (value) {
                                    final digits = (value ?? '')
                                        .replaceAll(RegExp('\\D'), '');
                                    if (digits.isEmpty) {
                                      return 'Please enter your phone number';
                                    }
                                    if (digits.length != 10) {
                                      return 'Enter 10 digits (e.g., 9XXXXXXXXX)';
                                    }
                                    if (!digits.startsWith('9')) {
                                      return 'PH mobile numbers start with 9';
                                    }
                                    return null;
                                  },
                                  decoration: InputDecoration(
                                    label: const Text('Phone Number'),
                                    hintText: '9XXXXXXXXX',
                                    prefixText: '🇵🇭  +63 ',
                                    prefixStyle: const TextStyle(
                                      color: Color(0xFF203B32),
                                      fontWeight: FontWeight.w600,
                                    ),
                                    helperText:
                                        'Philippines (+63) — enter 10 digits only',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 25.0),
                                TextFormField(
                                  controller: _passwordController,
                                  obscureText: _obscurePassword,
                                  validator: validatePassword,
                                  decoration: InputDecoration(
                                    label: const Text('Password'),
                                    hintText: 'Enter Password',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscurePassword
                                            ? Icons.visibility_off
                                            : Icons.visibility,
                                        color: Colors.grey,
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _obscurePassword = !_obscurePassword;
                                        });
                                      },
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 25.0),
                                TextFormField(
                                  controller: _confirmPasswordController,
                                  obscureText: _obscureConfirmPassword,
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Please confirm your password';
                                    }
                                    if (value != _passwordController.text) {
                                      return 'Passwords do not match';
                                    }
                                    return null;
                                  },
                                  decoration: InputDecoration(
                                    label: const Text('Confirm Password'),
                                    hintText: 'Re-enter Password',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscureConfirmPassword
                                            ? Icons.visibility_off
                                            : Icons.visibility,
                                        color: Colors.grey,
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _obscureConfirmPassword =
                                              !_obscureConfirmPassword;
                                        });
                                      },
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 25.0),
                                Row(
                                  children: [
                                    Checkbox(
                                      value: agreePersonalData,
                                      onChanged: (bool? value) {
                                        setState(() {
                                          agreePersonalData = value!;
                                        });
                                      },
                                      activeColor: const Color(0xFF203B32),
                                    ),
                                    const Expanded(
                                      child: Text(
                                        'I agree to the processing of my personal data',
                                        style: TextStyle(
                                          color: Colors.black45,
                                          fontFamily: 'Figtree',
                                          fontWeight: FontWeight.w400,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 25.0),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: _isSubmitting
                                        ? null
                                        : () {
                                            if (_formSignupKey.currentState!
                                                    .validate() &&
                                                agreePersonalData) {
                                              _registerUser();
                                            } else if (!agreePersonalData) {
                                              showToast(
                                                  'Please agree to the processing of personal data');
                                            }
                                          },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF203B32),
                                      foregroundColor: Colors.white,
                                    ),
                                    child: _isSubmitting
                                        ? const SizedBox(
                                            height: 22,
                                            width: 22,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Colors.white,
                                            ),
                                          )
                                        : const Text(
                                            'Sign Up',
                                            style: TextStyle(
                                              fontFamily: 'Figtree',
                                              fontWeight: FontWeight.w500,
                                              fontSize: 18,
                                            ),
                                          ),
                                  ),
                                ),
                                const SizedBox(height: 25.0),
                                const Row(
                                  children: [
                                    Expanded(child: Divider()),
                                    Padding(
                                      padding:
                                          EdgeInsets.symmetric(horizontal: 16),
                                      child: Text(
                                        'OR',
                                        style: TextStyle(
                                          color: Colors.grey,
                                          fontFamily: 'Figtree',
                                          fontWeight: FontWeight.w400,
                                        ),
                                      ),
                                    ),
                                    Expanded(child: Divider()),
                                  ],
                                ),
                                const SizedBox(height: 25.0),
                                const GoogleSignInButton(
                                  buttonText: 'Sign up with Google',
                                  isSignUp: true,
                                ),
                                const SizedBox(height: 25.0),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Text(
                                      'Already have an account? ',
                                      style: TextStyle(
                                        color: Colors.black45,
                                        fontFamily: 'Figtree',
                                        fontWeight: FontWeight.w400,
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (e) =>
                                                const SigninScreen(),
                                          ),
                                        );
                                      },
                                      child: Text(
                                        'Sign in',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontFamily: 'Figtree',
                                          color: const Color(0xFF203B32),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
