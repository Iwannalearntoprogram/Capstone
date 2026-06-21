import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:estetika_ui/config/api_config.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import 'package:estetika_ui/utils/toast.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

/// Restricts input to a positive decimal with a bounded number of integer
/// digits and at most [maxDecimalDigits] fractional digits. Also blocks any
/// non-numeric characters and more than one decimal point.
class _BoundedDecimalInputFormatter extends TextInputFormatter {
  _BoundedDecimalInputFormatter({required this.maxIntegerDigits});

  final int maxIntegerDigits;
  static const int maxDecimalDigits = 2;

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text;
    if (text.isEmpty) return newValue;
    // Digits with at most one optional decimal point.
    if (!RegExp(r'^\d*\.?\d*$').hasMatch(text)) return oldValue;
    final parts = text.split('.');
    if (parts.length > 2) return oldValue;
    if (parts[0].length > maxIntegerDigits) return oldValue;
    if (parts.length == 2 && parts[1].length > maxDecimalDigits) {
      return oldValue;
    }
    return newValue;
  }
}

class SendProjectScreen extends StatefulWidget {
  const SendProjectScreen({super.key});

  @override
  State<SendProjectScreen> createState() => _SendProjectScreenState();
}

class _SendProjectScreenState extends State<SendProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _projectNameController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _budgetController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _clientNameController = TextEditingController();
  final TextEditingController _contactNumberController =
      TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _projectSizeController = TextEditingController();
  final TextEditingController _inspirationLinkController =
      TextEditingController();

  // Track form progress
  double _formProgress = 0.0;
  final int _totalFormFields = 11;

  String? _roomType;
  String? _projectType;
  String? _priority;
  final List<String> _roomTypes = [
    'Living Room',
    'Bedroom',
    'Kitchen',
    'Bathroom',
    'Home Office',
    'Dining Room',
    'Whole House',
  ];
  final List<String> _projectTypes = [
    'Residential',
    'Commercial',
    'Renovation',
  ];
  final List<String> _priorityOptions = ['Budget', 'Style'];

  final List<File> _inspirationImages = [];
  final List<String> _inspirationLinks = [];
  final ImagePicker _picker = ImagePicker();

  bool _isSubmitting = false;

  DateTime? _startDate;
  DateTime? _endDate;

  // Add recommendation variables (updated for top 3)
  List<dynamic> _recommendations = [];
  String? _statusMessage;
  bool? _hasMatchFlag;
  bool? _isCheaperAlternativeFlag;
  int? _selectedRecommendationIndex; // user choice among top 3
  bool _isRecommendationLoading = false;
  bool _hasViewedRecommendation = false;
  // Grouped recommendation state (Whole House)
  bool _isGroupedRecommendation = false;
  List<Map<String, dynamic>> _recommendationGroups = [];
  Map<String, String?> _selectedRecByRoom = {};
  // Distinct word-tokens from every design recommendation's tags/preferences.
  // A typed design preference is considered valid (and "View Recommendation"
  // becomes available) when it contains at least one of these tags.
  Set<String> _knownDesignTagTokens = {};
  final NumberFormat _currencyFormat = NumberFormat('#,##0');
  // Budget: up to 7 integer digits + 2 decimals => max 9,999,999.99 (< P10M).
  final TextInputFormatter _budgetInputFormatter =
      _BoundedDecimalInputFormatter(maxIntegerDigits: 7);
  // Project size: up to 4 integer digits + 2 decimals => max 9,999.99 (< 10,000 sqm).
  final TextInputFormatter _projectSizeInputFormatter =
      _BoundedDecimalInputFormatter(maxIntegerDigits: 4);
  @override
  void initState() {
    super.initState();
    _setupTextControllerListeners();
    _loadUserData();
    _loadDesignTags();
  }

  Future<void> _loadDesignTags() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final uri = Uri.parse(
          '${ApiConfig.apiBaseUrl}/project/recommendation/tags');
      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final rawTags = (decoded is Map && decoded['tags'] is List)
            ? decoded['tags'] as List
            : const [];
        final tokens = <String>{};
        for (final tag in rawTags) {
          for (final match
              in RegExp(r'[a-z]{2,}').allMatches(tag.toString().toLowerCase())) {
            tokens.add(match.group(0)!);
          }
        }
        if (mounted) {
          setState(() {
            _knownDesignTagTokens = tokens;
          });
        }
      }
    } catch (_) {
      // If tags can't be loaded we leave the set empty; validation then falls
      // back to allowing the request and lets the server decide.
    }
  }

  bool _containsKnownDesignTag(String value) {
    // Until tags load (or if the fetch failed) don't block the user.
    if (_knownDesignTagTokens.isEmpty) return true;
    final typedTokens = RegExp(r'[a-z]{2,}')
        .allMatches(value.toLowerCase())
        .map((match) => match.group(0)!);
    return typedTokens.any(_knownDesignTagTokens.contains);
  }

  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    if (userString != null) {
      final user = jsonDecode(userString);
      setState(() {
        _clientNameController.text = user['fullName'] ?? '';
        _emailController.text = user['email'] ?? '';
        final phoneNumber = user['phoneNumber']?.toString() ?? '';
        _contactNumberController.text = phoneNumber.startsWith('+63')
            ? '0${phoneNumber.substring(3)}'
            : phoneNumber;
      });
      print('Loaded user: $user');
    }
  }

  void _updateFormProgress() {
    int filledFields = 0;

    if (_clientNameController.text.isNotEmpty) filledFields++;
    if (_emailController.text.isNotEmpty) filledFields++;
    if (_contactNumberController.text.isNotEmpty) filledFields++;
    if (_projectNameController.text.isNotEmpty) filledFields++;
    if (_roomType != null) filledFields++;
    if (_projectType != null) filledFields++;
    if (_priority != null) filledFields++;
    if (_projectSizeController.text.isNotEmpty) filledFields++;
    if (_locationController.text.isNotEmpty) filledFields++;
    if (_budgetController.text.isNotEmpty) filledFields++;
    if (_descriptionController.text.isNotEmpty) filledFields++;

    setState(() {
      _formProgress = filledFields / _totalFormFields;
    });
  }

  void _resetRecommendationState() {
    setState(() {
      _recommendations = [];
      _statusMessage = null;
      _hasMatchFlag = null;
      _isCheaperAlternativeFlag = null;
      _selectedRecommendationIndex = null;
      _isRecommendationLoading = false;
      _hasViewedRecommendation = false;
      _isGroupedRecommendation = false;
      _recommendationGroups = [];
      _selectedRecByRoom = {};
    });
  }

  void _setupTextControllerListeners() {
    _clientNameController.addListener(_updateFormProgress);
    _emailController.addListener(_updateFormProgress);
    _contactNumberController.addListener(_updateFormProgress);
    _projectNameController.addListener(_updateFormProgress);
    _projectSizeController.addListener(_updateFormProgress);
    _locationController.addListener(_updateFormProgress);
    _budgetController.addListener(_updateFormProgress);
    _descriptionController.addListener(_updateFormProgress);
  }

  @override
  void dispose() {
    _projectNameController.dispose();
    _locationController.dispose();
    _budgetController.dispose();
    _descriptionController.dispose();
    _clientNameController.dispose();
    _contactNumberController.dispose();
    _emailController.dispose();
    _projectSizeController.dispose();
    _inspirationLinkController.dispose();
    super.dispose();
  }

  String _trimmed(String? value) => value?.trim() ?? '';

  bool _hasMeaningfulLetters(String value) {
    final letters = RegExp(r'[A-Za-z]').allMatches(value).length;
    return letters >= 2 && !RegExp(r'^\d+$').hasMatch(value.trim());
  }

  bool _hasRepeatedJunkPattern(String value) {
    final cleaned = value.toLowerCase().replaceAll(RegExp(r'\s+'), '');
    if (cleaned.length < 6) return false;
    return RegExp(r'^(.)\1+$').hasMatch(cleaned) ||
        RegExp(r'^(.{1,3})\1+$').hasMatch(cleaned);
  }


  String? _validateProjectName(String? value) {
    final text = _trimmed(value);
    if (text.isEmpty) return 'Please enter project name';
    if (text.length < 3) return 'Project name must be at least 3 characters';

    final words =
        text.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    if (words.length > 5) return 'Project name must be 5 words or fewer';

    for (final word in words) {
      final letters = word.replaceAll(RegExp(r'[^a-zA-Z]'), '');
      if (letters.length < 5) continue;

      final vowelCount =
          RegExp(r'[aeiouAEIOUyY]').allMatches(letters).length;
      if (vowelCount / letters.length < 0.1) {
        return 'Project name contains unrecognizable words';
      }

      final consonantRuns = letters
          .replaceAll(RegExp(r'[aeiouAEIOUyY]'), ' ')
          .split(RegExp(r'\s+'))
          .where((r) => r.isNotEmpty)
          .toList();
      final maxRun = consonantRuns.isEmpty
          ? 0
          : consonantRuns.map((r) => r.length).reduce((a, b) => a > b ? a : b);
      if (maxRun >= 5) return 'Project name contains unrecognizable words';
    }

    return null;
  }

  String? _validateMeaningfulText(
    String? value,
    String label, {
    int minLength = 2,
    int maxLength = 120,
  }) {
    final text = _trimmed(value);
    if (text.isEmpty) return 'Please enter $label';
    if (text.length < minLength) {
      return '$label must be at least $minLength characters';
    }
    if (text.length > maxLength) {
      return '$label must be $maxLength characters or fewer';
    }
    if (!_hasMeaningfulLetters(text)) {
      return '$label must contain valid text';
    }
    if (_hasRepeatedJunkPattern(text)) {
      return '$label appears invalid';
    }
    return null;
  }

  String? _validateRequiredDropdown(
      String? value, String label, List<String> options) {
    if (value == null || value.trim().isEmpty) return 'Please select $label';
    if (!options.contains(value)) return 'Please select a valid $label';
    return null;
  }

  String? _validatePositiveNumber(
    String? value,
    String label, {
    String? invalidMessage,
  }) {
    final text = _trimmed(value);
    if (text.isEmpty) return 'Please enter $label';
    final number = double.tryParse(text);
    if (number == null || !number.isFinite) {
      return invalidMessage ?? 'Please enter a valid $label';
    }
    if (number <= 0) return '$label must be greater than 0';
    return null;
  }

  String? _validateBoundedPositiveNumber(
    String? value,
    String label, {
    required num max,
    String? invalidMessage,
    String? tooLargeMessage,
  }) {
    final base = _validatePositiveNumber(value, label,
        invalidMessage: invalidMessage);
    if (base != null) return base;
    final number = double.parse(_trimmed(value));
    if (number >= max) {
      return tooLargeMessage ?? '$label must be less than $max';
    }
    return null;
  }

  String? _validateContactNumber(String? value) {
    final digits = _trimmed(value).replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return 'Please enter contact number';
    if (digits.length != 11 || !digits.startsWith('09')) {
      return 'Enter a valid Philippine mobile number';
    }
    return null;
  }

  String? _validateEmailAddress(String? value) {
    final email = _trimmed(value);
    if (email.isEmpty) return 'Please enter email address';
    final bool emailValid = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    ).hasMatch(email);
    if (!emailValid) return 'Please enter a valid email address';
    return null;
  }

  String _sampleTagHint() {
    if (_knownDesignTagTokens.isEmpty) return 'modern, minimalist';
    return _knownDesignTagTokens.take(3).join(', ');
  }

  String? _validateDesignPreferences(String? value) {
    final text = _trimmed(value);
    if (text.isEmpty) {
      return 'Please enter design preferences and requirements';
    }
    if (text.length > 2000) {
      return 'Design preferences must be 2000 characters or fewer';
    }
    // The preferences are valid as long as they include at least one tag that
    // exists on a design recommendation in the Design Recommendation Manager.
    if (!_containsKnownDesignTag(text)) {
      return 'Include at least one design tag (e.g. ${_sampleTagHint()})';
    }
    return null;
  }

  String? _validateDateSelection() {
    if (_startDate == null) return 'Please select start date';
    if (_endDate == null) return 'Please select end date';
    if (!_endDate!.isAfter(_startDate!)) {
      return 'End date must be after the start date';
    }
    return null;
  }

  String? _validateRecommendationInputs() {
    // Only require the fields the matching actually uses: room type, budget,
    // priority, and design preferences. Project type, project size, and the
    // schedule are irrelevant to recommendations and shouldn't block viewing.
    return _validateRequiredDropdown(_roomType, 'room type', _roomTypes) ??
        _validateRequiredDropdown(_priority, 'priority', _priorityOptions) ??
        _validatePositiveNumber(_budgetController.text, 'budget') ??
        _validateDesignPreferences(_descriptionController.text);
  }

  Future<bool> _validateBeforeSubmit() async {
    final formValid = _formKey.currentState?.validate() ?? false;
    final dateError = _validateDateSelection();
    if (!formValid || dateError != null) {
      await showToast(dateError ?? 'Please correct the highlighted fields.');
      return false;
    }
    return true;
  }

  bool _isValidHttpUrl(String value) {
    final uri = Uri.tryParse(value);
    return uri != null &&
        (uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.host.isNotEmpty;
  }

  Future<void> _pickImage() async {
    try {
      final List<XFile> images = await _picker.pickMultiImage();
      if (images.isNotEmpty) {
        setState(() {
          for (var image in images) {
            _inspirationImages.add(File(image.path));
          }
        });
      }
    } catch (e) {
      await showToast('Error picking images. Please try again.');
    }
  }

  /// Trims, prefixes https:// when missing, and returns the link only if it is
  /// a valid http(s) URL; otherwise returns null.
  String? _normalizeInspirationLink(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return null;
    final link =
        (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
            ? trimmed
            : 'https://$trimmed';
    return _isValidHttpUrl(link) ? link : null;
  }

  Future<void> _addInspirationLink() async {
    if (_inspirationLinkController.text.trim().isEmpty) return;

    final link = _normalizeInspirationLink(_inspirationLinkController.text);
    if (link == null) {
      await showToast('Please enter a valid inspiration link.');
      return;
    }

    setState(() {
      _inspirationLinks.add(link);
      _inspirationLinkController.clear();
    });
    await showToast('Inspiration link added.');
  }

  Future<void> _openInspirationLink(String link) async {
    final uri = Uri.tryParse(link);
    if (uri == null ||
        !await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      await showToast('Could not open link.');
    }
  }

  void _removeInspirationImage(int index) {
    setState(() {
      _inspirationImages.removeAt(index);
    });
  }

  void _removeInspirationLink(int index) {
    setState(() {
      _inspirationLinks.removeAt(index);
    });
  }

  Future<void> _fetchRecommendation() async {
    final validationMessage = _validateRecommendationInputs();
    if (validationMessage != null) {
      await showToast(validationMessage);
      setState(() {
        _recommendations = [];
        _statusMessage = validationMessage;
        _hasMatchFlag = null;
        _isCheaperAlternativeFlag = null;
        _hasViewedRecommendation = true;
        _selectedRecommendationIndex = null;
      });
      return;
    }

    setState(() {
      _isRecommendationLoading = true;
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final requestBody = {
        "roomType": _roomType,
        "designPreferences": _descriptionController.text,
        "budget": double.tryParse(_budgetController.text) ?? 0,
        "priority": _priority,
      };
      print("Recommendation request body: $requestBody");
      final uri =
          Uri.parse('${ApiConfig.apiBaseUrl}/project/recommendation/match')
              .replace(queryParameters: {
        'roomType': _roomType ?? '',
        'designPreferences': _descriptionController.text,
        'budget': _budgetController.text,
        'priority': _priority ?? '',
      });

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      print("request body: ${jsonEncode(requestBody)}");
      print("Status Code: ${response.statusCode}");
      print("recom:" + response.body);
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final Map<String, dynamic> data =
            decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};

        final bool isGrouped = data['grouped'] == true;

        if (isGrouped) {
          final rawGroups = data['groups'];
          final List<Map<String, dynamic>> groups = [];
          if (rawGroups is List) {
            for (final g in rawGroups) {
              if (g is Map) {
                groups.add({
                  'roomType': g['roomType']?.toString() ?? '',
                  'recommendations': (g['recommendations'] is List)
                      ? g['recommendations'] as List<dynamic>
                      : <dynamic>[],
                });
              }
            }
          }
          setState(() {
            _statusMessage = data['message'] as String?;
            _isGroupedRecommendation = true;
            _recommendationGroups = groups;
            _recommendations = [];
            _hasMatchFlag = groups.isNotEmpty;
            _isCheaperAlternativeFlag = null;
            _isRecommendationLoading = false;
            _hasViewedRecommendation = true;
            _selectedRecommendationIndex = null;
            _selectedRecByRoom = {};
          });
        } else {
          // Accept either a list under `recommendations` or a single object under `recommendation`
          List<dynamic> recs = [];
          if (data['recommendations'] is List) {
            recs = data['recommendations'] as List<dynamic>;
          } else if (data['recommendation'] is Map) {
            recs = [data['recommendation'] as Map<String, dynamic>];
          } else if (data['data'] is Map) {
            final inner = data['data'] as Map;
            if (inner['recommendations'] is List) {
              recs = inner['recommendations'] as List<dynamic>;
            } else if (inner['recommendation'] is Map) {
              recs = [inner['recommendation'] as Map<String, dynamic>];
            }
          }

          // Debug: log how many recommendations we parsed
          try {
            final previewTitles = recs
                .take(3)
                .map((e) => (e is Map && e['title'] != null)
                    ? e['title'].toString()
                    : e.toString())
                .toList();
            print('Recommendations count: ${recs.length}');
            print('Recommendation titles (up to 3): $previewTitles');
          } catch (_) {}

          setState(() {
            _statusMessage = data['message'] as String?;
            _recommendations = recs;
            _isGroupedRecommendation = false;
            _recommendationGroups = [];
            _hasMatchFlag = data['hasMatch'] as bool?;
            _isCheaperAlternativeFlag = data['isCheaperAlternative'] as bool?;
            _isRecommendationLoading = false;
            _hasViewedRecommendation = true;
            _selectedRecommendationIndex = null;
            _selectedRecByRoom = {};
          });
        }
      } else {
        setState(() {
          _recommendations = [];
          _isGroupedRecommendation = false;
          _recommendationGroups = [];
          _selectedRecByRoom = {};
          String message = 'No design recommendation available.';
          try {
            final decoded = jsonDecode(response.body);
            if (decoded is Map && decoded['message'] is String) {
              message = decoded['message'] as String;
            }
          } catch (_) {}
          _statusMessage = message;
          _hasMatchFlag = null;
          _isCheaperAlternativeFlag = null;
          _isRecommendationLoading = false;
          _hasViewedRecommendation = true;
          _selectedRecommendationIndex = null;
        });
      }
    } catch (e) {
      setState(() {
        _recommendations = [];
        _isGroupedRecommendation = false;
        _recommendationGroups = [];
        _selectedRecByRoom = {};
        _statusMessage = 'Failed to load recommendations.';
        _hasMatchFlag = null;
        _isCheaperAlternativeFlag = null;
        _isRecommendationLoading = false;
        _hasViewedRecommendation = true;
        _selectedRecommendationIndex = null;
      });
    }
  }

  String _formatAmount(dynamic value) {
    final numericValue = value is num
        ? value.toDouble()
        : double.tryParse(value?.toString() ?? '');
    if (numericValue == null) {
      return '0';
    }
    return _currencyFormat.format(numericValue);
  }

  TextStyle _pesoTextStyle({
    double fontSize = 12,
    FontWeight fontWeight = FontWeight.w600,
    Color color = const Color(0xFF203B32),
  }) {
    return TextStyle(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      fontFamilyFallback: const ['Roboto', 'Arial', 'sans-serif'],
    );
  }

  Widget _buildBudgetRangeText(
    dynamic min,
    dynamic max, {
    Color color = const Color(0xFF203B32),
    double fontSize = 12,
    FontWeight fontWeight = FontWeight.w600,
  }) {
    return RichText(
      text: TextSpan(
        style: _pesoTextStyle(
          fontSize: fontSize,
          fontWeight: fontWeight,
          color: color,
        ),
        children: [
          TextSpan(text: '\u20B1${_formatAmount(min)}'),
          const TextSpan(text: ' - '),
          TextSpan(text: '\u20B1${_formatAmount(max)}'),
        ],
      ),
      overflow: TextOverflow.ellipsis,
    );
  }

  Widget _buildBudgetMetaPill(Map budgetRange) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F1EB),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFD9D5CB)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.payments_outlined,
            size: 14,
            color: Color(0xFF203B32),
          ),
          const SizedBox(width: 6),
          Flexible(
            child: _buildBudgetRangeText(
              budgetRange['min'],
              budgetRange['max'],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendationMetaPill({
    required IconData icon,
    required String label,
    Color backgroundColor = const Color(0xFFF3F1EB),
    Color textColor = const Color(0xFF203B32),
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFD9D5CB)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendationTag(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFD8D8D8)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          color: Color(0xFF4B4B4B),
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildRecommendationSection() {
    final recommendationValidationMessage = _validateRecommendationInputs();
    final bool canViewRecommendation = recommendationValidationMessage == null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Design Recommendation'),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: _isRecommendationLoading
              ? const Center(
                  child: CircularProgressIndicator(color: Color(0xFF203B32)))
              : _hasViewedRecommendation
                  ? (_recommendations.isNotEmpty ||
                          (_isGroupedRecommendation &&
                              _recommendationGroups.isNotEmpty)
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header row with message and refresh
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Text(
                                    _statusMessage ?? 'Top recommendations',
                                    style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF203B32)),
                                  ),
                                ),
                                IconButton(
                                  tooltip: 'Refresh',
                                  icon: const Icon(Icons.refresh,
                                      color: Color(0xFF203B32)),
                                  onPressed: _fetchRecommendation,
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            // Flags row
                            Wrap(
                              spacing: 8,
                              runSpacing: 4,
                              children: [
                                if (_hasMatchFlag != null)
                                  Chip(
                                    label: Text(_hasMatchFlag!
                                        ? 'Has Match'
                                        : 'No Exact Match'),
                                    backgroundColor: _hasMatchFlag!
                                        ? const Color(0xFFE8F5E9)
                                        : Colors.grey.shade200,
                                    labelStyle: TextStyle(
                                      color: _hasMatchFlag!
                                          ? const Color(0xFF203B32)
                                          : Colors.grey.shade700,
                                      fontSize: 12,
                                    ),
                                  ),
                                if (_isCheaperAlternativeFlag != null)
                                  Chip(
                                    label: Text(_isCheaperAlternativeFlag!
                                        ? 'Cheaper Alternative'
                                        : 'Within Budget'),
                                    backgroundColor: const Color(0xFFE3F2FD),
                                    labelStyle: const TextStyle(
                                        color: Color(0xFF0D47A1), fontSize: 12),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (_isGroupedRecommendation)
                              ..._recommendationGroups.map((group) {
                                final roomType =
                                    group['roomType'] as String? ?? '';
                                final recs =
                                    (group['recommendations'] as List?) ?? [];
                                return Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Padding(
                                      padding: const EdgeInsets.only(
                                          top: 12, bottom: 8),
                                      child: Text(
                                        roomType,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF203B32),
                                          letterSpacing: 0.2,
                                        ),
                                      ),
                                    ),
                                    ...recs.take(2).map((r) {
                                      final rec = r as Map;
                                      final recId =
                                          rec['_id']?.toString();
                                      final isSelected =
                                          _selectedRecByRoom[roomType] ==
                                              recId;
                                      return Padding(
                                        padding: const EdgeInsets.only(
                                            bottom: 12),
                                        child: _buildRecCard(
                                          rec: rec,
                                          isSelected: isSelected,
                                          onTap: () => setState(() {
                                            _selectedRecByRoom[roomType] =
                                                isSelected ? null : recId;
                                          }),
                                        ),
                                      );
                                    }),
                                  ],
                                );
                              })
                            else
                              ListView.separated(
                                shrinkWrap: true,
                                physics:
                                    const NeverScrollableScrollPhysics(),
                                itemCount: math.min(
                                    3, _recommendations.length),
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 12),
                                itemBuilder: (context, index) {
                                  final rec =
                                      _recommendations[index] as Map;
                                  final isSelected =
                                      _selectedRecommendationIndex ==
                                          index;
                                  return _buildRecCard(
                                    rec: rec,
                                    isSelected: isSelected,
                                    onTap: () => setState(() {
                                      _selectedRecommendationIndex = index;
                                    }),
                                  );
                                },
                              ),
                            const SizedBox(height: 8),
                            if (_isGroupedRecommendation &&
                                _selectedRecByRoom.values
                                    .any((v) => v != null))
                              ..._selectedRecByRoom.entries
                                  .where((e) => e.value != null)
                                  .map((e) {
                                final group =
                                    _recommendationGroups.firstWhere(
                                  (g) => g['roomType'] == e.key,
                                  orElse: () => {},
                                );
                                final recs =
                                    (group['recommendations'] as List?) ??
                                        [];
                                final rec = recs.cast<Map>().firstWhere(
                                      (r) =>
                                          r['_id']?.toString() == e.value,
                                      orElse: () => {},
                                    );
                                final title = rec['title']?.toString() ??
                                    'Untitled';
                                return Text(
                                  '${e.key}: $title',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF203B32),
                                    fontWeight: FontWeight.w500,
                                  ),
                                );
                              })
                            else if (!_isGroupedRecommendation &&
                                _selectedRecommendationIndex != null)
                              Text(
                                'Selected: ${(_recommendations[_selectedRecommendationIndex!] as Map)['title'] ?? 'Untitled'}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF203B32),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              _statusMessage ??
                                  'No design recommendation available.',
                              style: const TextStyle(color: Colors.grey),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            ElevatedButton.icon(
                              onPressed: canViewRecommendation
                                  ? _fetchRecommendation
                                  : null,
                              icon: const Icon(Icons.refresh),
                              label: const Text('Try Again'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF203B32),
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ],
                        ))
                  : Column(
                      children: [
                        ElevatedButton.icon(
                          onPressed: canViewRecommendation
                              ? _fetchRecommendation
                              : null,
                          icon: const Icon(Icons.lightbulb_outline),
                          label: const Text('View Recommendation'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: canViewRecommendation
                                ? const Color(0xFF203B32)
                                : Colors.grey[400],
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                        if (!canViewRecommendation) ...[
                          const SizedBox(height: 8),
                          Text(
                            recommendationValidationMessage,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontStyle: FontStyle.italic,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ],
                    ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildRecCard({
    required Map rec,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final imageLink = rec['imageLink'] as String?;
    final title = (rec['title'] ?? 'Untitled').toString();
    final spec = (rec['specification'] ?? '').toString();
    final type = (rec['type'] ?? '').toString();
    final tags = (rec['tags'] as List?)?.cast<dynamic>() ?? [];
    final budgetRange = rec['budgetRange'] as Map?;
    final matchScore = rec['matchScore'];

    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(
            color: isSelected
                ? const Color(0xFF203B32)
                : const Color(0xFFE2DED6),
            width: isSelected ? 1.6 : 1,
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(17),
                    topRight: Radius.circular(17),
                  ),
                  child: imageLink != null
                      ? Image.network(
                          getDirectImageLink(imageLink),
                          width: double.infinity,
                          height: 170,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              Container(
                            width: double.infinity,
                            height: 170,
                            color: Colors.grey.shade200,
                            child: const Icon(
                              Icons.broken_image,
                              color: Colors.grey,
                              size: 28,
                            ),
                          ),
                        )
                      : Container(
                          width: double.infinity,
                          height: 170,
                          color: Colors.grey.shade200,
                          child: const Icon(
                            Icons.image,
                            color: Colors.grey,
                            size: 28,
                          ),
                        ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF203B32)
                            : const Color(0xFF8F8F8F),
                        width: 2,
                      ),
                      color:
                          isSelected ? const Color(0xFF203B32) : Colors.white,
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, size: 18, color: Colors.white)
                        : null,
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 20,
                      height: 1.15,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF203B32),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (spec.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text(
                      spec,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.5,
                        color: Colors.grey.shade800,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      if (budgetRange != null)
                        _buildBudgetMetaPill(budgetRange),
                      if (type.isNotEmpty)
                        _buildRecommendationMetaPill(
                          icon: Icons.home_work_outlined,
                          label: type,
                        ),
                      if (matchScore != null)
                        _buildRecommendationMetaPill(
                          icon: Icons.auto_awesome,
                          label:
                              'Match ${(matchScore * 100).toStringAsFixed(0)}%',
                          backgroundColor: const Color(0xFFE8F5E9),
                          textColor: const Color(0xFF1B5E20),
                        ),
                    ],
                  ),
                  if (tags.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: tags
                          .take(6)
                          .map((t) => _buildRecommendationTag(t.toString()))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        showBackButton: true,
        actions: [],
        title: '',
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding:
                const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Progress indicator
                  LinearProgressIndicator(
                    value: _formProgress,
                    backgroundColor: Colors.grey[200],
                    color: const Color(0xFF203B32),
                    minHeight: 6,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  const SizedBox(height: 16),

                  // Header section
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Moss Design House Project Proposal',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF203B32),
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Cubao, Quezon City, Philippines',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Client Information Section
                  _buildSectionHeader('Client Information'),
                  const SizedBox(height: 16),

                  // Client Name
                  TextFormField(
                    controller: _clientNameController,
                    decoration: InputDecoration(
                      labelText: 'Full Name',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: (value) {
                      return _validateMeaningfulText(
                        value,
                        'client name',
                        minLength: 2,
                        maxLength: 80,
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Email Address
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: 'Email Address',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: _validateEmailAddress,
                  ),
                  const SizedBox(height: 16),

                  // Contact Number
                  TextFormField(
                    controller: _contactNumberController,
                    keyboardType: TextInputType.phone,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(11),
                    ],
                    decoration: InputDecoration(
                      labelText: 'Contact Number',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: _validateContactNumber,
                  ),
                  const SizedBox(height: 24),

                  // Project Information Section
                  _buildSectionHeader('Project Details'),
                  const SizedBox(height: 16),

                  // Project Name
                  TextFormField(
                    controller: _projectNameController,
                    decoration: InputDecoration(
                      labelText: 'Project Name',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: _validateProjectName,
                  ),
                  const SizedBox(height: 16),

                  // Room Type Dropdown
                  DropdownButtonFormField<String>(
                    value: _roomType,
                    decoration: InputDecoration(
                      labelText: 'Room/Area Type',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: _roomTypes.map((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                    onChanged: (newValue) {
                      setState(() {
                        _roomType = newValue;
                      });
                      _resetRecommendationState();
                      _updateFormProgress();
                    },
                    validator: (value) => _validateRequiredDropdown(
                        value, 'room type', _roomTypes),
                  ),
                  const SizedBox(height: 16),

                  DropdownButtonFormField<String>(
                    value: _projectType,
                    decoration: InputDecoration(
                      labelText: 'Project Type',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: _projectTypes.map((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                    onChanged: (newValue) {
                      setState(() {
                        _projectType = newValue;
                      });
                      _updateFormProgress();
                    },
                    validator: (value) => _validateRequiredDropdown(
                        value, 'project type', _projectTypes),
                  ),
                  const SizedBox(height: 16),

                  DropdownButtonFormField<String>(
                    value: _priority,
                    decoration: InputDecoration(
                      labelText: 'Priority',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: _priorityOptions.map((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                    onChanged: (newValue) {
                      setState(() {
                        _priority = newValue;
                      });
                      _resetRecommendationState();
                      _updateFormProgress();
                    },
                    validator: (value) => _validateRequiredDropdown(
                        value, 'priority', _priorityOptions),
                  ),
                  const SizedBox(height: 16),

                  // Project Size
                  TextFormField(
                    controller: _projectSizeController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [_projectSizeInputFormatter],
                    decoration: InputDecoration(
                      labelText: 'Project Size (sqm)',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      suffixText: 'sqm',
                    ),
                    validator: (value) {
                      return _validateBoundedPositiveNumber(
                        value,
                        'project size',
                        max: 10000,
                        invalidMessage: 'Please enter valid size',
                        tooLargeMessage:
                            'Project size must be less than 10,000 sqm',
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Location
                  TextFormField(
                    controller: _locationController,
                    decoration: InputDecoration(
                      labelText: 'Project Location',
                      hintText: 'E.g. Cubao, Quezon City',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: (value) {
                      return _validateMeaningfulText(
                        value,
                        'location',
                        minLength: 2,
                        maxLength: 120,
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Budget
                  TextFormField(
                    controller: _budgetController,
                    onChanged: (_) => _resetRecommendationState(),
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [_budgetInputFormatter],
                    decoration: InputDecoration(
                      labelText: 'Estimated Budget',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      prefixIcon: Padding(
                        padding: const EdgeInsets.only(left: 12, right: 8),
                        child: Center(
                          widthFactor: 1,
                          child: Text(
                            '\u20B1',
                            style: _pesoTextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                      prefixIconConstraints: const BoxConstraints(
                        minWidth: 0,
                        minHeight: 0,
                      ),
                    ),
                    validator: (value) {
                      return _validateBoundedPositiveNumber(
                        value,
                        'budget',
                        max: 10000000,
                        invalidMessage: 'Please enter valid amount',
                        tooLargeMessage:
                            'Budget must be less than ₱10,000,000',
                      );
                    },
                  ),
                  const SizedBox(height: 8),

                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _startDate ?? DateTime.now(),
                        firstDate: DateTime.now(),
                        lastDate: DateTime(2100),
                      );
                      if (picked != null) {
                        setState(() {
                          _startDate = picked;
                          // Clear a now-invalid end date (must stay after start).
                          if (_endDate != null &&
                              !_endDate!.isAfter(_startDate!)) {
                            _endDate = null;
                          }
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 16, horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _startDate != null
                                ? "${_startDate!.year}-${_startDate!.month.toString().padLeft(2, '0')}-${_startDate!.day.toString().padLeft(2, '0')}"
                                : 'Select start date',
                            style:
                                TextStyle(fontSize: 16, color: Colors.black87),
                          ),
                          const Icon(Icons.calendar_today,
                              size: 20, color: Color(0xFF203B32)),
                        ],
                      ),
                    ),
                  ),

                  // End Date Picker
                  const SizedBox(height: 8),

                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _endDate ??
                            (_startDate != null
                                ? _startDate!.add(const Duration(days: 1))
                                : DateTime.now()),
                        firstDate: _startDate != null
                            ? _startDate!.add(const Duration(days: 1))
                            : DateTime.now(),
                        lastDate: DateTime(2100),
                      );
                      if (picked != null) {
                        setState(() {
                          _endDate = picked;
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 16, horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _endDate != null
                                ? "${_endDate!.year}-${_endDate!.month.toString().padLeft(2, '0')}-${_endDate!.day.toString().padLeft(2, '0')}"
                                : 'Select end date',
                            style:
                                TextStyle(fontSize: 16, color: Colors.black87),
                          ),
                          const Icon(Icons.calendar_today,
                              size: 20, color: Color(0xFF203B32)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Description
                  TextFormField(
                    controller: _descriptionController,
                    onChanged: (_) => _resetRecommendationState(),
                    maxLines: 5,
                    inputFormatters: [
                      FilteringTextInputFormatter.deny(RegExp(r'[0-9]')),
                    ],
                    decoration: InputDecoration(
                      labelText: 'Design Preferences & Requirements',
                      alignLabelWithHint: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      hintText:
                          'Describe your preferred style, colors, must-have elements, etc.',
                    ),
                    validator: _validateDesignPreferences,
                  ),
                  const SizedBox(height: 24),

                  // Design Inspiration Section
                  _buildSectionHeader('Design Inspiration'),
                  const SizedBox(height: 16),

                  // Upload Images
                  SizedBox(
                    height: 56,
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _pickImage,
                      icon: const Icon(Icons.add_photo_alternate,
                          color: Color(0xFF203B32)),
                      label: const Text(
                        'Select Images',
                        style: TextStyle(
                          color: Color(0xFF203B32),
                          fontSize: 16.0,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        side: const BorderSide(color: Color(0xFF203B32)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Display uploaded images
                  if (_inspirationImages.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Uploaded Images:',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          '${_inspirationImages.length} images',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 120,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _inspirationImages.length,
                        itemBuilder: (context, index) {
                          return Stack(
                            children: [
                              Container(
                                margin: const EdgeInsets.only(right: 8),
                                width: 120,
                                height: 120,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  image: DecorationImage(
                                    image: FileImage(_inspirationImages[index]),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 5,
                                right: 13,
                                child: GestureDetector(
                                  onTap: () => _removeInspirationImage(index),
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.close,
                                      size: 16,
                                      color: Colors.red,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Add Inspiration Links
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _inspirationLinkController,
                          keyboardType: TextInputType.url,
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _addInspirationLink(),
                          decoration: InputDecoration(
                            labelText: 'Inspiration Link',
                            hintText: 'Enter URL of inspiration design',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _addInspirationLink,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF203B32),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('+'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Display inspiration links
                  if (_inspirationLinks.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Added Links:',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          '${_inspirationLinks.length} links',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _inspirationLinks.length,
                      itemBuilder: (context, index) {
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: ListTile(
                            onTap: () =>
                                _openInspirationLink(_inspirationLinks[index]),
                            leading: const Icon(Icons.link,
                                color: Color(0xFF203B32)),
                            title: Text(
                              _inspirationLinks[index],
                              style: const TextStyle(
                                fontSize: 14,
                                color: Color(0xFF203B32),
                                decoration: TextDecoration.underline,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.close, color: Colors.red),
                              onPressed: () => _removeInspirationLink(index),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                  ],

                  const SizedBox(height: 32),

                  // Add recommendation section here, BEFORE the submit button
                  _buildRecommendationSection(),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 60.0,
                    child: ElevatedButton(
                      onPressed: _isSubmitting
                          ? null
                          : () async {
                              if (await _validateBeforeSubmit()) {
                                await _submitProjectProposal();
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF203B32),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        elevation: 3,
                        disabledBackgroundColor: Colors.grey[400],
                      ),
                      child: _isSubmitting
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              'Submit to Moss Design House',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),

          // Overlay loader (only shown during form submission)
          if (_isSubmitting)
            Container(
              color: Colors.black.withOpacity(0.3),
              child: const Center(
                child: CircularProgressIndicator(color: Color(0xFF203B32)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 20,
            decoration: BoxDecoration(
              color: const Color(0xFF203B32),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF203B32),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitProjectProposal() async {
    setState(() {
      _isSubmitting = true;
    });

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userString = prefs.getString('user');
    if (token == null || userString == null) {
      await showToast('User not logged in');
      setState(() {
        _isSubmitting = false;
      });
      return;
    }
    final user = jsonDecode(userString);

    // Resolve the inspiration link: prefer an added link, otherwise use the
    // text still sitting in the field (so a typed-but-not-added link isn't lost).
    String? inspirationLink =
        _inspirationLinks.isNotEmpty ? _inspirationLinks.first : null;
    if (inspirationLink == null &&
        _inspirationLinkController.text.trim().isNotEmpty) {
      inspirationLink =
          _normalizeInspirationLink(_inspirationLinkController.text);
      if (inspirationLink == null) {
        await showToast('Please enter a valid inspiration link.');
        setState(() {
          _isSubmitting = false;
        });
        return;
      }
    }

    final Map<String, dynamic> body = {
      "title": _projectNameController.text,
      "description": _descriptionController.text,
      "budget": double.tryParse(_budgetController.text) ?? 0,
      "startDate": _startDate != null ? _startDate!.toIso8601String() : null,
      "endDate": _endDate != null ? _endDate!.toIso8601String() : null,
      "projectCreator": user['_id'] ?? user['id'],
      "roomType": _roomType,
      "projectType": _projectType,
      "priority": _priority,
      "projectSize": double.tryParse(_projectSizeController.text) ?? 0,
      "projectLocation": _locationController.text,
      "designInspiration": inspirationLink,
      if (_isGroupedRecommendation) ...{
        "designRecommendations": _selectedRecByRoom.values
            .where((v) => v != null)
            .toList(),
      } else ...{
        "designRecommendation":
            (_selectedRecommendationIndex != null &&
                    _selectedRecommendationIndex! < _recommendations.length)
                ? ((_recommendations[_selectedRecommendationIndex!]
                    as Map)['_id'])
                : null,
      },
    };

    body.removeWhere((key, value) => value == null);
    // Remove empty designRecommendations list so backend treats it as unset
    if (body['designRecommendations'] is List &&
        (body['designRecommendations'] as List).isEmpty) {
      body.remove('designRecommendations');
    }

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiBaseUrl}/project'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      );
      print('body: ${body}');
      print(
          'Project proposal response: ${response.statusCode} ${response.body}');

      setState(() {
        _isSubmitting = false;
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        await showToast('Project submitted successfully.');
        if (mounted) {
          Navigator.pop(context, true);
        }
      } else {
        String msg;
        try {
          final decoded = jsonDecode(response.body);
          msg = decoded is Map && decoded['message'] is String
              ? decoded['message'] as String
              : 'Submission failed: ${response.statusCode}';
        } catch (_) {
          msg = 'Submission failed: ${response.statusCode}';
        }
        await showToast(msg);
      }
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });
      await showToast('Error: $e');
    }
  }

  String getDirectImageLink(String url) {
    final regExp = RegExp(r'drive\.google\.com\/file\/d\/([^\/]+)');
    final match = regExp.firstMatch(url);
    if (match != null && match.groupCount >= 1) {
      final id = match.group(1);
      return 'https://drive.google.com/uc?export=view&id=$id';
    }
    return url; // fallback to original
  }
}
