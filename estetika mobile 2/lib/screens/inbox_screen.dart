import 'package:flutter/material.dart';
import 'package:estetika_ui/widgets/custom_app_bar.dart';
import 'package:estetika_ui/screens/chat_detail_screen.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  IO.Socket? _socket;
  final List<MessageItem> _messages = [];
  final TextEditingController _searchController = TextEditingController();
  String? _userId;
  String? _userToken;
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _filteredUsers = [];

  Function(dynamic)? _onReceivePrivateMessage;
  Function(dynamic)? _onReceivePrivateFile;

  // Add StreamController
  StreamController<List<MessageItem>>? _messageStreamController;
  Stream<List<MessageItem>>? _messageStream;

  @override
  void initState() {
    super.initState();
    _messageStreamController = StreamController<List<MessageItem>>.broadcast();
    _messageStream = _messageStreamController!.stream;
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
      'https://moss-manila.onrender.com',
      IO.OptionBuilder()
          .setTransports(['websocket']).setAuth({'token': _userToken}).build(),
    );

    _socket!.on('connect', (_) {
      print('Socket connected: ${_socket!.id}');
      if (_userId != null) {
        _socket!.emit('online', _userId);
      }
    });

    _socket!.on('connect_error', (error) {
      print('Socket connection error: $error');
    });

    _onReceivePrivateMessage = (data) {
      print('Received message: $data');
      if (!mounted) return;

      final newMessage = MessageItem(
        sender: data['sender']?.toString() ?? '',
        recipient: data['recipient']?.toString() ?? '',
        content: data['content']?.toString() ?? '',
        timestamp: data['timestamp'] != null
            ? DateTime.tryParse(data['timestamp'].toString()) ?? DateTime.now()
            : DateTime.now(),
        isFromUser: data['sender'] == _userId,
        isRead: data['isRead'] ?? false,
        fileLink: data['fileLink'],
        fileType: data['fileType'],
        fileName: data['fileName'],
      );

      setState(() {
        _messages.add(newMessage);
      });

      // Notify stream listeners
      _messageStreamController?.add(List.from(_messages));
    };

    _onReceivePrivateFile = (data) {
      if (!mounted) return;

      final newMessage = MessageItem(
        sender: data['sender']?.toString() ?? '',
        recipient: data['recipient']?.toString() ?? '',
        content: data['content']?.toString() ?? '',
        timestamp: data['timestamp'] != null
            ? DateTime.tryParse(data['timestamp'].toString()) ?? DateTime.now()
            : DateTime.now(),
        isFromUser: data['sender'] == _userId,
        isRead: data['isRead'] ?? false,
        fileLink: data['fileLink'],
        fileType: data['fileType'],
        fileName: data['fileName'],
      );

      setState(() {
        _messages.add(newMessage);
      });

      // Notify stream listeners
      _messageStreamController?.add(List.from(_messages));
    };

    _socket!.on('receive_private_message', _onReceivePrivateMessage!);
    _socket!.on('receive_private_file', _onReceivePrivateFile!);

    _socket!.connect();
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
      Uri.parse('https://moss-manila.onrender.com/api/user?exclude=$_userId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      final List users = jsonDecode(response.body);
      setState(() {
        _users = users.cast<Map<String, dynamic>>();
        _filteredUsers = List.from(_users);
      });

      // Fetch messages for all users to populate previews
      for (var user in _users) {
        await _fetchMessagesForUser(user);
      }
    }
  }

  Future<void> _fetchMessagesForUser(Map<String, dynamic> user) async {
    if (_userId == null || _userToken == null) return;
    try {
      final otherUserId = user['id'] ?? user['_id'];
      if (otherUserId == null) {
        print('Error: otherUserId is null');
        return;
      }
      final response = await http.get(
        Uri.parse(
            'https://moss-manila.onrender.com/api/message?user1=$_userId&user2=$otherUserId'),
        headers: {
          'Authorization': 'Bearer $_userToken',
        },
      );
      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        print(data);
        final existingMessages = _messages
            .where((m) =>
                !((m.sender == otherUserId && m.recipient == _userId) ||
                    (m.sender == _userId && m.recipient == otherUserId)))
            .toList();

        final newMessages = data.map<MessageItem>((msg) {
          // Handle file messages
          String? fileLink;
          String? fileType;
          String? fileName;
          String content = msg['content']?.toString() ?? '';

          if (msg['file'] != null) {
            fileLink = msg['file']['url']?.toString();
            fileType = msg['file']['type']?.toString();
            fileName = msg['file']['name']?.toString();
            // For preview, set content if not present
            if (content.isEmpty && fileLink != null && fileType != null) {
              if (fileType.toLowerCase().contains('image')) {
                content = '[Image] $fileLink';
              } else {
                content = '[File] $fileLink';
              }
            }
          } else {
            // Fallback to flat fields if present
            fileLink = msg['fileLink'];
            fileType = msg['fileType'];
            fileName = msg['fileName'];
            if (content.isEmpty && fileLink != null && fileType != null) {
              if (fileType.toLowerCase().contains('image')) {
                content = '[Image] $fileLink';
              } else {
                content = '[File] $fileLink';
              }
            }
          }

          return MessageItem(
            sender: msg['sender']?.toString() ?? '',
            recipient: msg['recipient']?.toString() ?? '',
            content: content,
            timestamp: msg['timestamp'] != null
                ? DateTime.tryParse(msg['timestamp'].toString()) ??
                    DateTime.now()
                : DateTime.now(),
            isFromUser: msg['sender'] == _userId,
            profileImage: null,
            isRead: msg['isRead'] ?? true,
            fileLink: fileLink,
            fileType: fileType,
            fileName: fileName,
          );
        }).toList();

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
    final conv = _messages.where((m) {
      final isConversation =
          (m.sender == otherUserId && m.recipient == _userId) ||
              (m.sender == _userId && m.recipient == otherUserId);

      return isConversation;
    }).toList();

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
    // Sort users by latest message timestamp
    final sortedUsers = List<Map<String, dynamic>>.from(_filteredUsers);
    sortedUsers.sort((a, b) {
      final aUserId = a['id'] ?? a['_id'];
      final bUserId = b['id'] ?? b['_id'];
      final aMessages = _getConversationMessages(aUserId);
      final bMessages = _getConversationMessages(bUserId);

      if (aMessages.isEmpty && bMessages.isEmpty) return 0;
      if (aMessages.isEmpty) return 1;
      if (bMessages.isEmpty) return -1;

      return bMessages.first.timestamp.compareTo(aMessages.first.timestamp);
    });

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
      itemCount: sortedUsers.length,
      itemBuilder: (context, index) {
        final user = sortedUsers[index];
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
                  recipientId: otherUserId,
                  messageStream: _messageStream, // Add this line
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

                    if (mounted) {
                      setState(() {
                        _messages.add(newMessage);
                      });
                      // Notify stream listeners
                      _messageStreamController?.add(List.from(_messages));
                    }

                    if (_socket != null && _socket!.connected) {
                      _socket!.emit('send_private_message', {
                        'sender': _userId,
                        'recipientId': otherUserId,
                        'content': text,
                      });
                    }
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
                      content: '',
                      timestamp: DateTime.now(),
                      isFromUser: true,
                      isRead: true,
                      fileLink: fileLink,
                      fileType: fileType,
                      fileName: fileName,
                    );

                    if (mounted) {
                      setState(() {
                        _messages.add(newMessage);
                      });
                      // Notify stream listeners
                      _messageStreamController?.add(List.from(_messages));
                    }

                    if (_socket != null && _socket!.connected) {
                      _socket!.emit('send_private_file', {
                        'sender': _userId,
                        'recipientId': otherUserId,
                        'fileLink': fileLink,
                        'fileType': fileType,
                        'fileName': fileName,
                        'timestamp': DateTime.now().toIso8601String(),
                      });
                    }
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
                    // Online/Offline indicator
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          color: user['socketId'] != null
                              ? Colors.green
                              : Colors.grey,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white,
                            width: 2,
                          ),
                        ),
                      ),
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
                        _getMessagePreview(latestMessage),
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
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDate = DateTime(date.year, date.month, date.day);

    if (messageDate == today) {
      final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
      final minute = date.minute.toString().padLeft(2, '0');
      final period = date.hour >= 12 ? 'PM' : 'AM';
      return "$hour:$minute $period";
    } else if (messageDate == today.subtract(const Duration(days: 1))) {
      return "Yesterday";
    } else {
      return "${date.month}/${date.day}/${date.year}";
    }
  }

  String _getMessagePreview(MessageItem? message) {
    if (message == null) return 'Start a conversation...';

    // Handle file messages
    if (message.fileLink != null && message.fileType != null) {
      if (message.fileType!.toLowerCase().contains('image')) {
        return message.isFromUser ? 'You sent a photo' : 'Sent a photo';
      } else if (message.fileType!.toLowerCase().contains('pdf')) {
        return message.isFromUser ? 'You sent a PDF' : 'Sent a PDF';
      } else {
        return message.isFromUser ? 'You sent a file' : 'Sent a file';
      }
    }

    // Handle text messages
    if (message.content.isNotEmpty) {
      return message.isFromUser ? 'You: ${message.content}' : message.content;
    }

    return 'Start a conversation...';
  }

  @override
  void dispose() {
    _messageStreamController?.close(); // Close the stream controller

    // Clean up socket listeners and disconnect
    if (_socket != null) {
      if (_onReceivePrivateMessage != null) {
        _socket!.off('receive_private_message', _onReceivePrivateMessage!);
      }
      if (_onReceivePrivateFile != null) {
        _socket!.off('receive_private_file', _onReceivePrivateFile!);
      }
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }

    // Clear the callback references
    _onReceivePrivateMessage = null;
    _onReceivePrivateFile = null;

    _searchController.dispose();
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
    this.isRead = true,
    this.fileLink,
    this.fileType,
    this.fileName,
  });
}
