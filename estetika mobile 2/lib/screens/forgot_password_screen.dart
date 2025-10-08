import 'package:flutter/material.dart';
import 'package:estetika_ui/widgets/custom_scaffold.dart';
import 'package:estetika_ui/widgets/custom_text_field.dart';
import 'package:estetika_ui/widgets/primary_button.dart';
import 'package:estetika_ui/widgets/account_switch_link.dart';
import 'package:estetika_ui/screens/signin_screen.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'package:estetika_ui/utils/toast.dart';
import 'package:estetika_ui/utils/logger.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _otpController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  int _currentStep = 1; // 1: Enter email & new password, 2: Enter OTP
  int _resendCooldown = 0;
  Timer? _cooldownTimer;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _otpController.dispose();
    _cooldownTimer?.cancel();
    super.dispose();
  }

  void _startCooldown() {
    setState(() {
      _resendCooldown = 30;
    });
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        if (_resendCooldown > 0) {
          _resendCooldown--;
        } else {
          timer.cancel();
        }
      });
    });
  }

  Future<void> _initiatePasswordReset() async {
    if (!_formKey.currentState!.validate()) return;

    // Additional validation
    if (_passwordController.text.length < 6) {
      setState(() {
        _errorMessage = 'Password must be at least 6 characters';
        _successMessage = null;
      });
      return;
    }

    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() {
        _errorMessage = 'Passwords do not match';
        _successMessage = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      AppLogger.info('Initiating password reset for: ${_emailController.text}');

      final response = await http.post(
        Uri.parse('https://moss-manila.onrender.com/api/auth/forgot/initiate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
        }),
      );

      AppLogger.info(
          'Password reset initiate response: ${response.statusCode}');

      if (response.statusCode == 200) {
        setState(() {
          _currentStep = 2;
          _successMessage = 'OTP sent to your email';
          _errorMessage = null;
        });
        _startCooldown();
        await showToast('OTP sent to your email');
      } else {
        final data = jsonDecode(response.body);
        final message = data['message'] ?? 'Failed to initiate password reset';
        setState(() {
          _errorMessage = message;
          _successMessage = null;
        });
        await showToast(message);
      }
    } catch (e, st) {
      AppLogger.error('Password reset initiate error',
          error: e, stackTrace: st);
      setState(() {
        _errorMessage = 'Failed to initiate password reset. Please try again.';
        _successMessage = null;
      });
      await showToast('Failed to initiate password reset. Please try again.');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _confirmPasswordReset() async {
    if (_otpController.text.trim().isEmpty) {
      setState(() {
        _errorMessage = 'Please enter the OTP';
        _successMessage = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      AppLogger.info('Confirming password reset with OTP');

      final response = await http.post(
        Uri.parse('https://moss-manila.onrender.com/api/auth/forgot/confirm'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': _emailController.text.trim(),
          'otp': _otpController.text.trim(),
        }),
      );

      AppLogger.info('Password reset confirm response: ${response.statusCode}');

      if (response.statusCode == 200) {
        setState(() {
          _successMessage = 'Password reset successful! You can now sign in.';
          _errorMessage = null;
        });
        await showToast('Password reset successful!');

        // Navigate back to sign in after a short delay
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const SigninScreen()),
            );
          }
        });
      } else {
        final data = jsonDecode(response.body);
        final message = data['message'] ?? 'Invalid or expired OTP';
        setState(() {
          _errorMessage = message;
          _successMessage = null;
        });
        await showToast(message);
      }
    } catch (e, st) {
      AppLogger.error('Password reset confirm error', error: e, stackTrace: st);
      setState(() {
        _errorMessage = 'Failed to confirm password reset. Please try again.';
        _successMessage = null;
      });
      await showToast('Failed to confirm password reset. Please try again.');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _resendOtp() async {
    if (_resendCooldown > 0) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      AppLogger.info('Resending OTP for password reset');

      final response = await http.post(
        Uri.parse('https://moss-manila.onrender.com/api/auth/forgot/resend'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': _emailController.text.trim(),
        }),
      );

      AppLogger.info('Resend OTP response: ${response.statusCode}');

      if (response.statusCode == 200) {
        setState(() {
          _successMessage = 'OTP re-sent to your email';
          _errorMessage = null;
        });
        _startCooldown();
        await showToast('OTP re-sent to your email');
      } else {
        final data = jsonDecode(response.body);
        final message = data['message'] ?? 'Failed to resend OTP';
        setState(() {
          _errorMessage = message;
          _successMessage = null;
        });
        await showToast(message);
      }
    } catch (e, st) {
      AppLogger.error('Resend OTP error', error: e, stackTrace: st);
      setState(() {
        _errorMessage = 'Failed to resend OTP. Please try again.';
        _successMessage = null;
      });
      await showToast('Failed to resend OTP. Please try again.');
    } finally {
      setState(() {
        _isLoading = false;
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
                        _currentStep == 1 ? 'Reset Password' : 'Enter OTP',
                        style: const TextStyle(
                          fontSize: 30.0,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Figtree',
                          color: Color(0xFF203B32),
                        ),
                      ),
                      const SizedBox(height: 20.0),
                      Text(
                        _currentStep == 1
                            ? 'Enter your email and new password. We will send you an OTP to confirm the reset.'
                            : 'Enter the 6-digit OTP sent to ${_emailController.text}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 16.0,
                          fontWeight: FontWeight.w400,
                          fontFamily: 'Figtree',
                          color: Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 30.0),

                      // Show success/error messages
                      if (_successMessage != null)
                        Container(
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.green.shade200),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.check_circle,
                                  color: Colors.green.shade700, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _successMessage!,
                                  style: TextStyle(
                                    color: Colors.green.shade700,
                                    fontFamily: 'Figtree',
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      if (_errorMessage != null)
                        Container(
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.error,
                                  color: Colors.red.shade700, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: TextStyle(
                                    color: Colors.red.shade700,
                                    fontFamily: 'Figtree',
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Step 1: Email and New Password
                      if (_currentStep == 1) ...[
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
                        const SizedBox(height: 20.0),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            label: const Text(
                              'New Password',
                              style: TextStyle(
                                fontFamily: 'Figtree',
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            hintText: 'Enter new password',
                            hintStyle: const TextStyle(
                              color: Colors.black26,
                              fontFamily: 'Figtree',
                              fontWeight: FontWeight.w300,
                            ),
                            border: OutlineInputBorder(
                              borderSide:
                                  const BorderSide(color: Colors.black12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderSide:
                                  const BorderSide(color: Colors.black12),
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
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter a password';
                            }
                            if (value.length < 6) {
                              return 'Password must be at least 6 characters';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 20.0),
                        TextFormField(
                          controller: _confirmPasswordController,
                          obscureText: _obscureConfirmPassword,
                          decoration: InputDecoration(
                            label: const Text(
                              'Confirm New Password',
                              style: TextStyle(
                                fontFamily: 'Figtree',
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            hintText: 'Re-enter new password',
                            hintStyle: const TextStyle(
                              color: Colors.black26,
                              fontFamily: 'Figtree',
                              fontWeight: FontWeight.w300,
                            ),
                            border: OutlineInputBorder(
                              borderSide:
                                  const BorderSide(color: Colors.black12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderSide:
                                  const BorderSide(color: Colors.black12),
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
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please confirm your password';
                            }
                            if (value != _passwordController.text) {
                              return 'Passwords do not match';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 32.0),
                        PrimaryButton(
                          text: 'Send OTP',
                          onPressed: _initiatePasswordReset,
                          isLoading: _isLoading,
                          padding: const EdgeInsets.symmetric(vertical: 16.0),
                        ),
                      ],

                      // Step 2: OTP Verification
                      if (_currentStep == 2) ...[
                        TextFormField(
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 8,
                            fontFamily: 'Figtree',
                          ),
                          decoration: InputDecoration(
                            hintText: '000000',
                            hintStyle: const TextStyle(
                              color: Colors.black26,
                              fontFamily: 'Figtree',
                            ),
                            border: OutlineInputBorder(
                              borderSide:
                                  const BorderSide(color: Colors.black12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderSide:
                                  const BorderSide(color: Colors.black12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            counterText: '',
                          ),
                        ),
                        const SizedBox(height: 20.0),

                        // Resend OTP button
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              "Didn't receive OTP? ",
                              style: TextStyle(
                                color: Colors.black54,
                                fontFamily: 'Figtree',
                              ),
                            ),
                            TextButton(
                              onPressed:
                                  _resendCooldown > 0 ? null : _resendOtp,
                              child: Text(
                                _resendCooldown > 0
                                    ? 'Resend in ${_resendCooldown}s'
                                    : 'Resend OTP',
                                style: TextStyle(
                                  color: _resendCooldown > 0
                                      ? Colors.grey
                                      : const Color(0xFF203B32),
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'Figtree',
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20.0),
                        PrimaryButton(
                          text: 'Verify & Reset',
                          onPressed: _confirmPasswordReset,
                          isLoading: _isLoading,
                          padding: const EdgeInsets.symmetric(vertical: 16.0),
                        ),
                        const SizedBox(height: 16.0),
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _currentStep = 1;
                              _otpController.clear();
                              _errorMessage = null;
                              _successMessage = null;
                            });
                          },
                          child: const Text(
                            'Back to Email',
                            style: TextStyle(
                              color: Color(0xFF203B32),
                              fontFamily: 'Figtree',
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 30.0),
                      AccountSwitchLink(
                        promptText: 'Remember your password? ',
                        linkText: 'Sign In',
                        onTap: () {
                          Navigator.pushReplacement(
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
