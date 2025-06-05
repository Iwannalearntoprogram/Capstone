import 'package:flutter/material.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:estetika_ui/screens/chat_detail_screen.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  late IO.Socket _socket;
  final List<MessageItem> _messages = [];
  final TextEditingController _searchController = TextEditingController();
  String? _userId;
  String? _userToken;
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _filteredUsers = [];

  @override
  void initState() {
    super.initState();
    _initSocket();
    _fetchUsers();
  }

  void _initSocket() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    final token = prefs.getString('token');
    if (userString == null || token == null) return;
    final user = jsonDecode(userString);
    _userId = user['_id'] ?? user['id'];
    _userToken = token;

    print('Initializing socket for user: $_userId');

    _socket = IO.io(
      'https://capstone-thl5.onrender.com',
      IO.OptionBuilder()
          .setTransports(['websocket']).setAuth({'token': _userToken}).build(),
    );

    _socket.on('connect', (_) {
      print('Socket connected: ${_socket.id}');
      if (_userId != null) {
        _socket.emit('online', _userId);
      }
    });

    _socket.on('connect_error', (error) {
      print('Socket connection error: $error');
    });

    _socket.on('receive_private_message', (data) {
      print('Received message: $data');
      setState(() {
        _messages.add(
          MessageItem(
            sender: data['sender']?.toString() ?? '',
            recipient: data['recipient']?.toString() ?? '',
            content: data['content']?.toString() ?? '',
            timestamp: data['timestamp'] != null
                ? DateTime.tryParse(data['timestamp'].toString()) ??
                    DateTime.now()
                : DateTime.now(),
            isFromUser: data['sender'] == _userId,
            isRead: data['isRead'] ?? false,
            fileLink: data['fileLink'],
            fileType: data['fileType'],
            fileName: data['fileName'],
          ),
        );
      });
    });

    _socket.connect();
  }

  Future<void> _fetchUsers() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    final token = prefs.getString('token');
    if (userString == null || token == null) return;
    final user = jsonDecode(userString);
    _userId = user['_id'] ?? user['id'];
    _userToken = token;

    final response = await http.get(
      Uri.parse('https://capstone-thl5.onrender.com/api/user?exclude=$_userId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      final List users = jsonDecode(response.body);
      setState(() {
        _users = users.cast<Map<String, dynamic>>();
        _filteredUsers = List.from(_users);
      });
    }
  }

  Future<void> _fetchMessagesForUser(Map<String, dynamic> user) async {
    if (_userId == null || _userToken == null) return;
    try {
      final otherUserId = user['id'] ?? user['_id'];
      final response = await http.get(
        Uri.parse(
            'https://capstone-thl5.onrender.com/api/message?user1=$_userId&user2=$otherUserId'),
        headers: {
          'Authorization': 'Bearer $_userToken',
        },
      );
      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);

        final existingMessages = _messages
            .where((m) =>
                !((m.sender == otherUserId && m.recipient == _userId) ||
                    (m.sender == _userId && m.recipient == otherUserId)))
            .toList();

        final newMessages = data
            .map<MessageItem>((msg) => MessageItem(
                  sender: msg['sender']?.toString() ?? '',
                  recipient: msg['recipient']?.toString() ?? '',
                  content: msg['content']?.toString() ?? '',
                  timestamp: msg['timestamp'] != null
                      ? DateTime.tryParse(msg['timestamp'].toString()) ??
                          DateTime.now()
                      : DateTime.now(),
                  isFromUser: msg['sender'] == _userId,
                  profileImage: null,
                  isRead: msg['isRead'] ?? true,
                  fileLink: msg['fileLink'],
                  fileType: msg['fileType'],
                  fileName: msg['fileName'],
                ))
            .toList();

        setState(() {
          _messages.clear();
          _messages.addAll(existingMessages);
          _messages.addAll(newMessages);
        });
      }
    } catch (e) {
      print('Error fetching messages: $e');
    }
  }

  List<MessageItem> _getConversationMessages(String otherUserId) {
    final conv = _messages
        .where((m) =>
            (m.sender == otherUserId && m.recipient == _userId) ||
            (m.sender == _userId && m.recipient == otherUserId))
        .toList();
    conv.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return conv;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: 'Inbox',
        actions: [],
        isInboxScreen: true,
        showBackButton: true,
      ),
      body: Column(
        children: [
          _buildUserSearchBar(),
          Expanded(child: _buildConversationsList()),
        ],
      ),
    );
  }

  Widget _buildUserSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search users...',
          prefixIcon: Icon(Icons.search),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        ),
        onChanged: (query) {
          setState(() {
            _filteredUsers = _users
                .where((user) => (user['firstName'] ??
                        user['fullName'] ??
                        user['username'] ??
                        '')
                    .toLowerCase()
                    .contains(query.toLowerCase()))
                .toList();
          });
        },
      ),
    );
  }

  Widget _buildConversationsList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
      itemCount: _filteredUsers.length,
      itemBuilder: (context, index) {
        final user = _filteredUsers[index];
        final otherUserId = user['id'] ?? user['_id'];
        final displayName = user['firstName'] ??
            user['fullName'] ??
            user['username'] ??
            'Unknown';

        final conversationMessages = _getConversationMessages(otherUserId);
        final latestMessage =
            conversationMessages.isNotEmpty ? conversationMessages.first : null;

        return InkWell(
          onTap: () async {
            await _fetchMessagesForUser(user);

            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ChatDetailScreen(
                  title: displayName,
                  profileImage: user['profileImage'] != null &&
                          user['profileImage'].toString().isNotEmpty
                      ? user['profileImage']
                      : null,
                  messages: _getConversationMessages(otherUserId),
                  isOnline: user['socketId'] != null,
                  onSendMessage: (text) {
                    print('onSendMessage: $text');
                    if (otherUserId == null || otherUserId.toString().isEmpty) {
                      print('Error: recipientId is null or empty');
                      return;
                    }

                    final newMessage = MessageItem(
                      sender: _userId ?? "You",
                      recipient: otherUserId,
                      content: text,
                      timestamp: DateTime.now(),
                      isFromUser: true,
                      isRead: true,
                    );

                    setState(() {
                      _messages.add(newMessage);
                    });

                    _socket.emit('send_private_message', {
                      'sender': _userId,
                      'recipientId': otherUserId,
                      'content': text,
                    });
                  },
                  onSendFile: ({
                    required String fileLink,
                    required String fileType,
                    required String fileName,
                  }) {
                    if (otherUserId == null || otherUserId.toString().isEmpty) {
                      print('Error: recipientId is null or empty');
                      return;
                    }

                    final newMessage = MessageItem(
                      sender: _userId ?? "You",
                      recipient: otherUserId,
                      content: '', // Not used for file messages
                      timestamp: DateTime.now(),
                      isFromUser: true,
                      isRead: true,
                      fileLink: fileLink,
                      fileType: fileType,
                      fileName: fileName,
                    );

                    setState(() {
                      _messages.add(newMessage);
                    });

                    _socket.emit('send_private_file', {
                      'recipientId': otherUserId,
                      'fileLink': fileLink,
                      'fileType': fileType,
                      'fileName': fileName,
                    });
                  },
                ),
              ),
            ).then((_) {
              setState(() {});
            });
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 16.0),
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(12.0),
              color: (latestMessage != null && !latestMessage.isRead)
                  ? Colors.grey[50]
                  : Colors.white,
            ),
            child: Row(
              children: [
                // Avatar
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: Colors.green[700],
                      backgroundImage: user['profileImage'] != null &&
                              user['profileImage'].toString().isNotEmpty
                          ? NetworkImage(user['profileImage'])
                          : null,
                      child: (user['profileImage'] == null ||
                              user['profileImage'].toString().isEmpty)
                          ? Text(
                              displayName[0].toUpperCase(),
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold),
                            )
                          : null,
                    ),
                    if (latestMessage != null && !latestMessage.isRead)
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: const BoxDecoration(
                            color: Color(0xff203B32),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 16),
                // Message preview
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight:
                              (latestMessage != null && !latestMessage.isRead)
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        latestMessage?.content ?? 'Start a conversation...',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                          fontWeight:
                              (latestMessage != null && !latestMessage.isRead)
                                  ? FontWeight.w500
                                  : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
                // Timestamp
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      latestMessage != null
                          ? _formatDate(latestMessage.timestamp)
                          : '',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (latestMessage != null && !latestMessage.isRead)
                      const Icon(
                        Icons.circle,
                        size: 10,
                        color: Color(0xff203B32),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatDate(DateTime date) {
    return "${date.month}/${date.day}/${date.year}";
  }

  @override
  void dispose() {
    _socket.disconnect();
    super.dispose();
  }
}

class MessageItem {
  final String sender;
  final String recipient;
  final String content;
  final DateTime timestamp;
  final bool isFromUser;
  final String? profileImage;
  final bool isRead;
  final String? fileLink;
  final String? fileType;
  final String? fileName;

  MessageItem({
    required this.sender,
    required this.recipient,
    required this.content,
    required this.timestamp,
    required this.isFromUser,
    this.profileImage,
    required this.isRead,
    this.fileLink,
    this.fileType,
    this.fileName,
  });
}
