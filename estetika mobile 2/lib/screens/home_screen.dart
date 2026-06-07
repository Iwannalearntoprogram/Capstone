import 'package:flutter/material.dart';
import 'package:estetika_ui/config/api_config.dart';
import 'package:flutter_carousel_slider/carousel_slider.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:estetika_ui/screens/projects_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _projectsData = [];
  List<dynamic> _designersData = [];
  bool _isLoading = true;
  bool _isDesignersLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProjects();
    _fetchDesigners();
  }

  Future<void> _fetchProjects() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.get(
        Uri.parse('${ApiConfig.apiBaseUrl}/project?index=true'),
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _projectsData = data['project'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _projectsData = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _projectsData = [];
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchDesigners() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.get(
        Uri.parse('${ApiConfig.apiBaseUrl}/user'),
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Filter users with role == "designer"
        final designers =
            (data as List).where((user) => user['role'] == 'designer').toList();
        setState(() {
          _designersData = designers;
          _isDesignersLoading = false;
        });
      } else {
        setState(() {
          _designersData = [];
          _isDesignersLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _designersData = [];
        _isDesignersLoading = false;
      });
    }
  }

  // Static images shown when no project images are available yet.
  static const List<String> _fallbackCarouselAssets = [
    'assets/images/interior1.jpg',
    'assets/images/interior2.jpg',
    'assets/images/interior3.jpg',
  ];

  // Collect image URLs from the fetched projects' files (deduped, capped).
  List<String> _projectImageUrls() {
    final seen = <String>{};
    final urls = <String>[];
    for (final project in _projectsData) {
      if (project is! Map) continue;
      final files = project['files'];
      if (files is! List) continue;
      for (final file in files) {
        if (file is! String || !_isImageUrl(file)) continue;
        final url = _getDirectImageLink(file);
        if (seen.add(url)) urls.add(url);
        if (urls.length >= 8) return urls;
      }
    }
    return urls;
  }

  bool _isImageUrl(String url) {
    final path = url.split('?').first.toLowerCase();
    return path.endsWith('.jpg') ||
        path.endsWith('.jpeg') ||
        path.endsWith('.png') ||
        path.endsWith('.gif') ||
        path.endsWith('.bmp') ||
        path.endsWith('.webp');
  }

  // Convert Google Drive share links to a direct-view URL (mirrors project_detail_screen).
  String _getDirectImageLink(String url) {
    final match =
        RegExp(r'drive\.google\.com\/file\/d\/([^\/]+)').firstMatch(url);
    if (match != null && match.groupCount >= 1) {
      return 'https://drive.google.com/uc?export=view&id=${match.group(1)}';
    }
    return url;
  }

  Widget _buildCarouselSlide(
    BuildContext context, {
    required String path,
    required bool isNetwork,
  }) {
    final Widget image = isNetwork
        ? Image.network(
            path,
            width: double.infinity,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, progress) => progress == null
                ? child
                : Container(
                    color: Colors.grey.shade200,
                    child: const Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
            errorBuilder: (context, error, stackTrace) => Image.asset(
              _fallbackCarouselAssets.first,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          )
        : Image.asset(path, width: double.infinity, fit: BoxFit.cover);

    return Container(
      width: MediaQuery.of(context).size.width,
      margin: const EdgeInsets.symmetric(horizontal: 5.0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10.0),
        child: image,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(actions: [], title: ''),
      body: _isLoading || _isDesignersLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
              children: [
                // Navigation buttons row
                Padding(
                  padding: const EdgeInsets.symmetric(
                    vertical: 16.0,
                    horizontal: 24.0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildNavButton(context, 0, 'Home'),
                      const SizedBox(width: 16),
                      _buildNavButton(context, 1, 'Projects'),
                    ],
                  ),
                ),

                // Moss In Numbers section
                Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 24.0, vertical: 5.0),
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(12.0),
                    ),
                    padding: const EdgeInsets.symmetric(
                        vertical: 16.0, horizontal: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Text(
                          'Moss In Numbers',
                          style: TextStyle(
                            fontSize: 25,
                            fontWeight: FontWeight.bold,
                            color: Color(0xff203B32),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem(
                              'Current Designers',
                              _designersData.length.toString(),
                            ),
                            _buildStatItem(
                              'Projects Completed',
                              _projectsData
                                  .where(
                                      (proj) => proj['status'] == 'completed')
                                  .length
                                  .toString(),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16.0),

                // Carousel slider for project images (falls back to static
                // interior photos when no project images are available).
                Builder(
                  builder: (context) {
                    final projectImages = _projectImageUrls();
                    final useNetwork = projectImages.isNotEmpty;
                    final slides =
                        useNetwork ? projectImages : _fallbackCarouselAssets;
                    return SizedBox(
                      height: 200.0,
                      child: CarouselSlider(
                        slideTransform: const CubeTransform(),
                        slideIndicator: CircularSlideIndicator(
                          padding: const EdgeInsets.only(bottom: 20),
                          currentIndicatorColor: const Color(0xff0a4b39),
                        ),
                        autoSliderDelay: const Duration(seconds: 10),
                        enableAutoSlider: true,
                        unlimitedMode: true,
                        viewportFraction: 0.9,
                        children: slides
                            .map((path) => _buildCarouselSlide(
                                  context,
                                  path: path,
                                  isNetwork: useNetwork,
                                ))
                            .toList(),
                      ),
                    );
                  },
                ),
                // About Us section
                Container(
                  padding: const EdgeInsets.fromLTRB(20.0, 20.0, 20.0, 32.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'About us :',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Welcome to our Interior Design Studio in Quezon City, where creativity meets functionality. We specialize in creating standout interiors that perfectly capture those special moments that call for exceptional design.\n\nOur team combines innovative thinking with timeless elegance, ensuring every space we touch becomes a reflection of our clients\' unique vision and lifestyle. From residential sanctuaries to commercial marvels, we bring dreams to life.',
                        style: TextStyle(fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            ),
    );
  }

  // Helper method to build statistic items
  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xff0a4b39),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[700],
          ),
        ),
      ],
    );
  }

  // Helper method to build navigation buttons
  Widget _buildNavButton(BuildContext context, int index, String title) {
    return GestureDetector(
      onTap: () {
        if (index == 1) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const ProjectsScreen()),
          );
        }
      },
      child: Container(
        width: 140,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: index == 0 ? const Color(0xff203B32) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: index == 0 ? Colors.transparent : Colors.grey[300]!,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: TextStyle(
            color: index == 0 ? Colors.white : Colors.black,
            fontSize: 16,
          ),
        ),
      ),
    );
  }
}
