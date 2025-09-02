import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:intl/intl.dart';
import 'package:estetika_ui/screens/projects_screen.dart';
import 'package:estetika_ui/screens/inbox_screen.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  List<NotificationItem> _notifications = [];
  bool _showOnlyUnread = false;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  List<NotificationItem> get _filteredNotifications => _showOnlyUnread
      ? _notifications.where((n) => !n.isRead).toList()
      : _notifications;

  Future<void> _fetchNotifications() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    final token = prefs.getString('token');
    if (userString == null || token == null) return;
    final user = jsonDecode(userString);
    final userId = user['_id'] ?? user['id'];

    final response = await http.get(
      Uri.parse(
          'https://capstone-moss.onrender.com/api/user/notification?recipient=$userId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      print(data);
      final notif = data['notifications'];
      if (notif != null) {
        setState(() {
          _notifications = List<NotificationItem>.from(
            (notif as List).map((item) => NotificationItem(
                  id: item['_id'] ?? '',
                  title: item['type'] == 'overdue'
                      ? 'Task Overdue'
                      : (item['type'] ?? 'Notification'),
                  description: item['message'] ?? '',
                  time: DateTime.tryParse(item['createdAt'] ?? '') ??
                      DateTime.now(),
                  isRead: item['read'] ?? false,
                )),
          );
        });
      }
    }
  }

  Future<void> _refreshNotifications() async {
    await _fetchNotifications();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        isNotificationScreen: true,
        showBackButton: true,
        actions: [
          IconButton(
            icon: Icon(
              _showOnlyUnread ? Icons.filter_alt : Icons.filter_alt_outlined,
              color: _showOnlyUnread ? const Color(0xff203B32) : Colors.grey,
            ),
            onPressed: () {
              setState(() {
                _showOnlyUnread = !_showOnlyUnread;
              });
            },
            tooltip: 'Show unread only',
          ),
        ],
        title: '',
      ),
      body: RefreshIndicator(
        onRefresh: _refreshNotifications,
        color: const Color(0xff203B32),
        child: _filteredNotifications.isEmpty
            ? _buildEmptyState()
            : _buildNotificationsList(),
      ),
    );
  }

  Widget _buildEmptyState() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.7,
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.notifications_none,
                  size: 64,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                Text(
                  _showOnlyUnread && _notifications.isNotEmpty
                      ? "No unread notifications"
                      : "No notifications yet",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _showOnlyUnread && _notifications.isNotEmpty
                      ? "You've read all your notifications"
                      : "Your notifications will appear here",
                  style: TextStyle(
                    color: Colors.grey[500],
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNotificationsList() {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
      itemCount: _filteredNotifications.length,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final notification = _filteredNotifications[index];
        return Dismissible(
          key: Key(notification.id),
          direction: DismissDirection.endToStart,
          background: Container(
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 20.0),
            decoration: BoxDecoration(
              color: Colors.red[400],
              borderRadius: BorderRadius.circular(12.0),
            ),
            child: const Icon(
              Icons.delete,
              color: Colors.white,
            ),
          ),
          onDismissed: (direction) {
            _removeNotification(notification.id);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Notification removed'),
                action: SnackBarAction(
                  label: 'UNDO',
                  onPressed: () {
                    setState(() {
                      _notifications.insert(index, notification);
                    });
                  },
                ),
                backgroundColor: const Color(0xff203B32),
              ),
            );
          },
          child: _buildNotificationItem(notification),
        );
      },
    );
  }

  Widget _buildNotificationItem(NotificationItem notification) {
    return GestureDetector(
      onTap: () {
        if (!notification.isRead) {
          _markAsRead(notification.id);
        }
        // Navigation logic here based on description
        final desc = notification.description.toLowerCase();
        if (desc.contains('project')) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ProjectsScreen(),
            ),
          );
        } else if (desc.contains('message') || desc.contains('messaged')) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => InboxScreen(),
            ),
          );
        } else {
          // Default: show notification detail
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) =>
                  NotificationDetailScreen(notification: notification),
            ),
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16.0),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12.0),
          border: Border.all(color: Colors.grey[300]!),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 1,
              blurRadius: 3,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Notification icon with badge
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: notification.isRead
                    ? Colors.grey[200]
                    : const Color(0xff203B32).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(
                  _getNotificationIcon(notification.title),
                  color: notification.isRead
                      ? Colors.grey[600]
                      : const Color(0xff203B32),
                  size: 24,
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Notification content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: notification.isRead
                          ? FontWeight.normal
                          : FontWeight.bold,
                      color:
                          notification.isRead ? Colors.grey[700] : Colors.black,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _formatDate(notification.time),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
            ),
            if (!notification.isRead)
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xff203B32),
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      // Today
      return 'Today at ${DateFormat('h:mm a').format(date)}';
    } else if (difference.inDays == 1) {
      // Yesterday
      return 'Yesterday at ${DateFormat('h:mm a').format(date)}';
    } else if (difference.inDays < 7) {
      // Within the last week
      return DateFormat('EEEE').format(date);
    } else {
      // Older
      return DateFormat('MMM d, yyyy').format(date);
    }
  }

  IconData _getNotificationIcon(String title) {
    if (title.contains("Message")) return Icons.mail;
    if (title.contains("Project")) return Icons.assignment;
    if (title.contains("Collaboration")) return Icons.people;
    if (title.contains("Payment")) return Icons.payment;
    return Icons.notifications;
  }

  void _markAsRead(String id) {
    setState(() {
      final index = _notifications.indexWhere((n) => n.id == id);
      if (index != -1) {
        _notifications[index] = _notifications[index].copyWith(isRead: true);
      }
    });
  }

  void _removeNotification(String id) {
    setState(() {
      _notifications.removeWhere((n) => n.id == id);
    });
  }
}

class NotificationItem {
  final String id;
  final String title;
  final String description;
  final DateTime time;
  final bool isRead;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.description,
    required this.time,
    required this.isRead,
  });

  NotificationItem copyWith({
    String? id,
    String? title,
    String? description,
    DateTime? time,
    bool? isRead,
  }) {
    return NotificationItem(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      time: time ?? this.time,
      isRead: isRead ?? this.isRead,
    );
  }
}

// Notification Detail Screen

class NotificationDetailScreen extends StatelessWidget {
  final NotificationItem notification;

  const NotificationDetailScreen({super.key, required this.notification});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Details'),
        backgroundColor: const Color(0xff203B32),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: GestureDetector(
        onTap: () {
          final desc = notification.description.toLowerCase();
          if (desc.contains('project')) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ProjectsScreen(),
              ),
            );
          } else if (desc.contains('message') || desc.contains('messaged')) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => InboxScreen(),
              ),
            );
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                notification.title,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xff203B32),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                DateFormat('MMM d, yyyy • h:mm a').format(notification.time),
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 24),
              Text(
                notification.description,
                style: const TextStyle(
                  fontSize: 18,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
