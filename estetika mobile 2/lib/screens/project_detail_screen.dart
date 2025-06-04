import 'package:flutter/material.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

class ProjectDetailScreen extends StatefulWidget {
  final Map<String, dynamic> project;

  const ProjectDetailScreen({
    super.key,
    required this.project,
  });

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  // Project milestone stages
  // final List<String> _projectStages = [
  //   'Briefing',
  //   'Concept Design',
  //   'Design Development',
  //   'Documentation',
  //   'Implementation',
  //   'Completion'
  // ];

  late Map<String, dynamic> _projectData;
  late Map<String, dynamic> _clientInfo = {};
  bool _isLoading = true;
  bool _hasError = false;
  double _overallProgress = 0.0;
  List<Map<String, dynamic>> _timelinePhases = [];
  List<dynamic> _projectUpdates = [];

  @override
  void initState() {
    super.initState();
    _projectData = widget.project;
    _loadClientInfo();
    _loadProjectDetails();
    _fetchUpdatedProject();
  }

  Future<void> _loadClientInfo() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    if (userString != null) {
      _clientInfo = Map<String, dynamic>.from(jsonDecode(userString));
    } else {
      _clientInfo = {};
    }
    setState(() {});
  }

  Future<void> _loadProjectDetails() async {
    await Future.delayed(const Duration(milliseconds: 300));
    try {
      _projectData = widget.project;
      await _fetchOverallProgress();
      await _fetchTimelinePhases();
      setState(() {
        _isLoading = false;
        _hasError = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _hasError = true;
      });
    }
  }

  Future<void> _fetchOverallProgress() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final projectId = _projectData['_id'];
      final response = await http.get(
        Uri.parse(
            'https://capstone-thl5.onrender.com/api/phase?projectId=$projectId'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      print('Overall progress response status: ${response.statusCode}');
      print('Overall progress response body: ${response.body}');
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        print('Overall progress response: ${response.body}');
        final List phases = decoded['phase'] ?? [];
        if (phases.isNotEmpty) {
          double total = 0;
          int count = 0;
          for (var phase in phases) {
            if (phase['progress'] != null) {
              total += (phase['progress'] as num).toDouble();
              count++;
            }
          }
          _overallProgress = count > 0 ? total / count : 0.0;
        } else {
          _overallProgress = 0.0;
        }
      } else {
        _overallProgress = 0.0;
      }
    } catch (e) {
      _overallProgress = 0.0;
    }
  }

  Future<void> _fetchTimelinePhases() async {
    _timelinePhases = [];
    final List timeline = _projectData['timeline'] ?? [];

    // Get token from SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    for (var id in timeline) {
      try {
        final phaseId =
            id is Map && id.containsKey('_id') ? id['_id'] : id.toString();
        final response = await http.get(
          Uri.parse('https://capstone-thl5.onrender.com/api/phase?id=$phaseId'),
          headers: {
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
        );
        print('Status: ${response.body}');
        if (response.statusCode == 200) {
          final decoded = jsonDecode(response.body);
          if (decoded['phase'] != null) {
            _timelinePhases.add(decoded['phase']);
          }
        }
      } catch (e) {
        // Optionally handle error
      }
    }
    print('Timeline phases: $_timelinePhases'); // <-- Print the timeline here
    setState(() {});
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final DateTime dateTime = DateTime.parse(dateString);
      final String formattedDate =
          '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')}';
      return formattedDate;
    } catch (e) {
      return dateString; // Return the original string if parsing fails
    }
  }

  @override
  void didUpdateWidget(covariant ProjectDetailScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.project['_id'] != oldWidget.project['_id']) {
      _projectData = widget.project;
      _fetchTimelinePhases();
      _fetchUpdatedProject();
    }
  }

  Future<void> _fetchUpdatedProject() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final projectId = _projectData['_id'];
    print('Fetching updated project with ID: $projectId');
    try {
      final response = await http.get(
        Uri.parse(
            'https://capstone-thl5.onrender.com/api/project/update?projectId=$projectId'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('Decoded project data: $data');
        if (data['update'] != null) {
          setState(() {
            _projectUpdates = data['update'];
          });
          await _fetchOverallProgress();
          await _fetchTimelinePhases();
        }
      }
    } catch (e) {
      print('Error fetching updated project: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        showBackButton: true,
        title: 'Project Details',
        actions: [],
      ),
      body: _isLoading
          ? _buildLoadingView()
          : _hasError
              ? _buildErrorView()
              : _buildProjectDetailsView(),
    );
  }

  Widget _buildLoadingView() {
    return const Center(
      child: CircularProgressIndicator(
        color: Color(0xFF203B32),
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            color: Colors.red,
            size: 48,
          ),
          const SizedBox(height: 16),
          const Text(
            'Failed to load project details',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _isLoading = true;
                _hasError = false;
              });
              _loadProjectDetails();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF203B32),
              foregroundColor: Colors.white,
            ),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildProjectDetailsView() {
    final status = _projectData['status'];
    final statusColor = _getStatusColor(status);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Project header with status
          _buildProjectHeader(statusColor),
          const SizedBox(height: 24),

          // Project Progress section
          _buildProgressSection(),

          // Designer section
          _buildDesignerSection(),

          // Project Details section
          _buildSectionHeader('Project Details'),
          _buildDetailCard([
            _buildDetailRow('Project Name', _projectData['title']),
            _buildDetailRow('Room Type', _projectData['roomType']),
            _buildDetailRow('Budget', '₱${_projectData['budget'] ?? 'N/A'}'),
            _buildDetailRow(
                'Start Date', _formatDate(_projectData['startDate'])),
            _buildDetailRow('End Date', _formatDate(_projectData['endDate'])),
            _buildDetailRow('Status',
                _projectData['status']?.toString().toUpperCase() ?? 'N/A'),
            _buildDetailRow('Progress', '${_projectData['progress'] ?? 0}%'),
          ]),
          const SizedBox(height: 16),

          // Client Information section
          _buildSectionHeader('Client Information'),
          _buildDetailCard([
            _buildDetailRow('Client Name',
                _clientInfo['fullName'] ?? _clientInfo['username']),
            _buildDetailRow(
                'Contact Number', _clientInfo['phoneNumber'] ?? 'N/A'),
            _buildDetailRow('Email', _clientInfo['email'] ?? 'N/A'),
          ]),
          const SizedBox(height: 16),

          // Project Description
          _buildSectionHeader('Requirements & Description'),
          _buildDescriptionCard(_projectData['description']),
          const SizedBox(height: 16),

          // Inspiration Links

          _buildInspirationLinksSection(),

          // Project Timeline
          _buildSectionHeader('Project Timeline'),
          _buildTimelineSection(),
          const SizedBox(height: 16),

          // Design Recommendation Section (ADD THIS)
          if (_projectData['designRecommendation'] != null)
            _buildRecommendationSection(),

          // Comments Section
          _buildCommentsSection(),

          // Action Buttons
          _buildActionButtons(),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildProjectHeader(Color statusColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  _projectData['title'],
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF203B32),
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor),
                ),
                child: Text(
                  _projectData['status'],
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            "Project Location: ${_projectData['location']?.toString() ?? 'N/A'}",
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[700],
            ),
          ),
          Text(
            "Start Date: ${_formatDate(_projectData['startDate'])}",
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressSection() {
    final double progressValue = _overallProgress; // Use fetched progress
    final currentStage = _projectData['currentStage']?.toString() ?? 'N/A';

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Project Progress',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF203B32),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              CircularPercentIndicator(
                radius: 45.0,
                lineWidth: 10.0,
                animation: true,
                percent: _projectData['progress'] / 100,
                center: Text(
                  '${_projectData['progress']}%',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18.0,
                  ),
                ),
                circularStrokeCap: CircularStrokeCap.round,
                progressColor: const Color(0xFF203B32),
                backgroundColor: Colors.grey[300]!,
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Current Stage',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      currentStage,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF203B32),
                      ),
                    ),
                  ],
                ),
              )
            ],
          ),
          const SizedBox(height: 16),
          LinearProgressIndicator(
            value: progressValue / 100,
            backgroundColor: Colors.grey[200],
            color: const Color(0xFF203B32),
            minHeight: 6,
            borderRadius: BorderRadius.circular(10),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Briefing',
                style: TextStyle(fontSize: 12),
              ),
              const Text(
                'Completion',
                style: TextStyle(fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDesignerSection() {
    final List members = _projectData['members'] ?? [];
    if (members.isEmpty) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 24),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: const Text(
          'No designer assigned yet.',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }

    final designer = members.first;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Designer Assigned',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF203B32),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: Colors.grey[300],
                // Use a placeholder if no image
                child: Text(
                  designer['fullName'] != null &&
                          designer['fullName'].isNotEmpty
                      ? designer['fullName'][0]
                      : '',
                  style: const TextStyle(fontSize: 24, color: Colors.black),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      designer['fullName'] ?? 'N/A',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      designer['email'] ?? 'N/A',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[700],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      designer['role'] ?? 'N/A',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[700],
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  // Action to message the designer
                },
                icon: const Icon(Icons.message_outlined, size: 18),
                label: const Text('Message'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF203B32),
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
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

  Widget _buildDetailCard(List<Widget> children) {
    return Container(
      width: double.infinity, // <-- Add this line
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildDetailRow(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[700],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value?.toString() ?? 'N/A', // <-- Fix here
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDescriptionCard(String description) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Text(
        description,
        style: const TextStyle(
          fontSize: 16,
          height: 1.5,
        ),
      ),
    );
  }

  Widget _buildInspirationLinksSection() {
    List<String> links = [];
    if (_projectData['designInspo'] != null &&
        _projectData['designInspo'].toString().isNotEmpty) {
      links.add(_projectData['designInspo']);
    }
    if (_projectData['inspirationLinks'] != null) {
      links.addAll((_projectData['inspirationLinks'] as List).cast<String>());
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Inspiration Links'),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: links.isEmpty
              ? const Text('No inspiration links provided.',
                  style: TextStyle(color: Colors.grey))
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: links.map((link) => _buildLinkItem(link)).toList(),
                ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildLinkItem(String link) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: InkWell(
        onTap: () async {
          final Uri url = Uri.parse(link);
          if (await canLaunchUrl(url)) {
            await launchUrl(url);
          }
        },
        child: Row(
          children: [
            const Icon(
              Icons.link,
              size: 18,
              color: Color(0xFF203B32),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                link,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.blue,
                  decoration: TextDecoration.underline,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineSection() {
    if (_timelinePhases.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: const Text('No timeline available.',
            style: TextStyle(color: Colors.grey)),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(_timelinePhases.length, (index) {
          final phase = _timelinePhases[index];
          final isFirst = index == 0;
          final isLast = index == _timelinePhases.length - 1;
          final isCompleted = (phase['progress'] ?? 0) >= 100;
          return _buildTimelineItem(
            title: phase['title'] ?? 'No Title',
            date: _formatDate(phase['startDate']),
            isFirst: isFirst,
            isLast: isLast,
            isCompleted: isCompleted,
          );
        }),
      ),
    );
  }

  Widget _buildCommentsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Comments & Updates'),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: _projectUpdates.isEmpty
              ? const Text('No updates yet.',
                  style: TextStyle(color: Colors.grey))
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _projectUpdates.length,
                  itemBuilder: (context, index) {
                    // Reverse the order: latest first
                    final update =
                        _projectUpdates[_projectUpdates.length - 1 - index];
                    return _buildUpdateItem(update);
                  },
                ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildUpdateItem(Map<String, dynamic> update) {
    final designer = update['designerId'];
    final author = designer?['fullName'] ?? 'Unknown';
    final description = update['description'] ?? '';
    final imageLink = update['imageLink'];
    final createdAt = update['createdAt'];
    final formattedDate = createdAt != null ? _formatDateTime(createdAt) : '';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: Color(0xFF203B32),
                  child: Text(
                    author.isNotEmpty ? author[0] : '',
                    style: const TextStyle(fontSize: 18, color: Colors.white),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        author,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      if (formattedDate.isNotEmpty)
                        Text(
                          formattedDate,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              description,
              style: const TextStyle(fontSize: 15),
            ),
            if (imageLink != null && imageLink.isNotEmpty) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  imageLink,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.broken_image,
                      size: 48,
                      color: Colors.grey),
                ),
              ),
            ],
            if (author.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Client: ${update['clientId'] != null && update['clientId']['fullName'] != null ? update['clientId']['fullName'] : 'Unknown'}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.grey,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // Helper for formatting date and time
  String _formatDateTime(String dateTimeString) {
    try {
      final dateTime = DateTime.parse(dateTimeString);
      return '${dateTime.month}/${dateTime.day}/${dateTime.year}, '
          '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTimeString;
    }
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {
                // Implement messaging functionality
              },
              icon: const Icon(Icons.message_outlined),
              label: const Text('Message'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF203B32),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: const BorderSide(color: Color(0xFF203B32)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {
                // Implement call functionality
              },
              icon: const Icon(Icons.phone_outlined),
              label: const Text('Call'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF203B32),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem({
    required String title,
    required String date,
    required bool isFirst,
    required bool isLast,
    bool isCompleted = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline indicator
        Column(
          children: [
            // Top connector
            if (!isFirst)
              Container(
                width: 2,
                height: 16,
                color: Colors.grey[300],
              ),
            // Circle
            Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: isCompleted ? const Color(0xFF203B32) : Colors.white,
                border: Border.all(
                  color:
                      isCompleted ? const Color(0xFF203B32) : Colors.grey[400]!,
                  width: 2,
                ),
                shape: BoxShape.circle,
              ),
            ),
            // Bottom connector
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: Colors.grey[300],
              ),
          ],
        ),
        const SizedBox(width: 12),
        // Timeline content
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color:
                        isCompleted ? const Color(0xFF203B32) : Colors.black87,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  date,
                  style: const TextStyle(fontSize: 13, color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRecommendationSection() {
    final recommendation = _projectData['designRecommendation'];

    if (recommendation == null) {
      return const SizedBox.shrink();
    }

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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (recommendation['imageLink'] != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    recommendation['imageLink'],
                    height: 180,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.broken_image,
                        size: 48,
                        color: Colors.grey),
                  ),
                ),
              const SizedBox(height: 12),
              Text(
                recommendation['title'] ?? 'No Title',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF203B32),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                recommendation['specification'] ?? '',
                style: const TextStyle(fontSize: 15),
              ),
              const SizedBox(height: 8),
              if (recommendation['budgetRange'] != null)
                Text(
                  'Budget Range: ₱${recommendation['budgetRange']['min']} - ₱${recommendation['budgetRange']['max']}',
                  style: const TextStyle(fontSize: 14, color: Colors.grey),
                ),
              if (recommendation['type'] != null)
                Text(
                  'Type: ${recommendation['type']}',
                  style: const TextStyle(fontSize: 14, color: Colors.grey),
                ),
              if (recommendation['tags'] != null)
                Wrap(
                  spacing: 6,
                  children: (recommendation['tags'] as List)
                      .map((tag) => Chip(
                            label: Text(tag.toString()),
                            backgroundColor: const Color(0xFFE8F5E9),
                            labelStyle: const TextStyle(
                                color: Color(0xFF203B32), fontSize: 12),
                          ))
                      .toList(),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'ongoing':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }
}
