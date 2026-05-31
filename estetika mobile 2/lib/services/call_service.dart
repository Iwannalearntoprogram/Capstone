import 'dart:async';

import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

class CallService {
  final socket_io.Socket socket;
  final String currentUserId;
  final String peerId;
  final String callId;
  final bool isVideo;
  final void Function(String status) onStatusChanged;
  final void Function()? onRemoteStream;
  final void Function()? onEnded;

  final RTCVideoRenderer localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer remoteRenderer = RTCVideoRenderer();

  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  bool _hasRemoteDescription = false;
  bool _isDisposed = false;
  bool _isSpeakerOn = true;
  bool _renderersInitialized = false;
  bool _listenersRegistered = false;
  final List<RTCIceCandidate> _pendingCandidates = [];

  late final Function(dynamic) _onCallAccepted;
  late final Function(dynamic) _onCallRejected;
  late final Function(dynamic) _onCallUnavailable;
  late final Function(dynamic) _onCallBusy;
  late final Function(dynamic) _onCallEnded;
  late final Function(dynamic) _onCallSignal;

  CallService({
    required this.socket,
    required this.currentUserId,
    required this.peerId,
    required this.callId,
    required this.isVideo,
    required this.onStatusChanged,
    this.onRemoteStream,
    this.onEnded,
  });

  Future<void> initialize() async {
    await _requestPermissions();
    await localRenderer.initialize();
    await remoteRenderer.initialize();
    _renderersInitialized = true;
    await _createPeerConnection();
    _registerSocketListeners();
  }

  void invite() {
    onStatusChanged('Ringing...');
    socket.emit('call_invite', {
      'recipientId': peerId,
      'callId': callId,
      'type': isVideo ? 'video' : 'voice',
    });
  }

  void acceptIncoming() {
    onStatusChanged('Connecting...');
    socket.emit('call_accept', {
      'recipientId': peerId,
      'callId': callId,
      'type': isVideo ? 'video' : 'voice',
    });
  }

  void rejectIncoming() {
    socket.emit('call_reject', {
      'recipientId': peerId,
      'callId': callId,
    });
  }

  Future<void> endCall({bool notifyPeer = true}) async {
    if (_isDisposed) return;

    if (notifyPeer) {
      socket.emit('call_end', {
        'recipientId': peerId,
        'callId': callId,
      });
    }

    await dispose();
  }

  Future<void> toggleMute(bool muted) async {
    final audioTracks = _localStream?.getAudioTracks() ?? [];
    for (final track in audioTracks) {
      track.enabled = !muted;
    }
  }

  Future<void> toggleCamera(bool cameraOff) async {
    final videoTracks = _localStream?.getVideoTracks() ?? [];
    for (final track in videoTracks) {
      track.enabled = !cameraOff;
    }
  }

  Future<void> switchCamera() async {
    final videoTracks = _localStream?.getVideoTracks() ?? [];
    if (videoTracks.isEmpty) return;
    await Helper.switchCamera(videoTracks.first);
  }

  Future<void> toggleSpeaker(bool speakerOn) async {
    _isSpeakerOn = speakerOn;
    await Helper.setSpeakerphoneOn(_isSpeakerOn);
  }

  Future<void> dispose() async {
    if (_isDisposed) return;
    _isDisposed = true;

    if (_listenersRegistered) {
      _unregisterSocketListeners();
    }

    final tracks = _localStream?.getTracks() ?? [];
    for (final track in tracks) {
      await track.stop();
    }

    await _localStream?.dispose();
    await _peerConnection?.close();
    await _peerConnection?.dispose();
    if (_renderersInitialized) {
      await localRenderer.dispose();
      await remoteRenderer.dispose();
    }
  }

  Future<void> _requestPermissions() async {
    final permissions = <Permission>[Permission.microphone];
    if (isVideo) permissions.add(Permission.camera);

    final statuses = await permissions.request();
    final denied = statuses.values.any((status) => !status.isGranted);
    if (denied) {
      throw Exception(
        isVideo
            ? 'Camera and microphone permissions are required for video calls.'
            : 'Microphone permission is required for voice calls.',
      );
    }
  }

  Future<void> _createPeerConnection() async {
    final configuration = {
      'iceServers': [
        {
          'urls': [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
          ],
        },
      ],
    };

    _peerConnection = await createPeerConnection(configuration);
    _peerConnection!.onIceCandidate = (candidate) {
      if (candidate.candidate == null) return;
      socket.emit('call_signal', {
        'recipientId': peerId,
        'callId': callId,
        'signal': {
          'type': 'candidate',
          'candidate': {
            'candidate': candidate.candidate,
            'sdpMid': candidate.sdpMid,
            'sdpMLineIndex': candidate.sdpMLineIndex,
          },
        },
      });
    };

    _peerConnection!.onTrack = (event) {
      if (event.streams.isEmpty) return;
      remoteRenderer.srcObject = event.streams.first;
      onRemoteStream?.call();
    };

    _peerConnection!.onConnectionState = (state) {
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
        onStatusChanged('Connected');
      } else if (state ==
          RTCPeerConnectionState.RTCPeerConnectionStateDisconnected) {
        onStatusChanged('Reconnecting...');
      } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed) {
        onStatusChanged('Call failed');
      } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateClosed) {
        onStatusChanged('Call ended');
      }
    };

    _localStream = await navigator.mediaDevices.getUserMedia({
      'audio': true,
      'video': isVideo
          ? {
              'facingMode': 'user',
            }
          : false,
    });

    localRenderer.srcObject = _localStream;
    for (final track in _localStream!.getTracks()) {
      await _peerConnection!.addTrack(track, _localStream!);
    }

    await Helper.setSpeakerphoneOn(_isSpeakerOn);
  }

  void _registerSocketListeners() {
    _onCallAccepted = (data) async {
      if (!_isCurrentCall(data)) return;
      onStatusChanged('Connecting...');
      await _createOffer();
    };

    _onCallRejected = (data) async {
      if (!_isCurrentCall(data)) return;
      onStatusChanged('Call declined');
      await dispose();
      onEnded?.call();
    };

    _onCallUnavailable = (data) async {
      if (!_isCurrentCall(data)) return;
      onStatusChanged('User is unavailable');
      await dispose();
      onEnded?.call();
    };

    _onCallBusy = (data) async {
      if (!_isCurrentCall(data)) return;
      onStatusChanged('User is busy');
      await dispose();
      onEnded?.call();
    };

    _onCallEnded = (data) async {
      if (!_isCurrentCall(data)) return;
      onStatusChanged('Call ended');
      await dispose();
      onEnded?.call();
    };

    _onCallSignal = (data) async {
      if (!_isCurrentCall(data)) return;
      final signal = Map<String, dynamic>.from(data['signal'] as Map);
      await _handleSignal(signal);
    };

    socket.on('call_accepted', _onCallAccepted);
    socket.on('call_rejected', _onCallRejected);
    socket.on('call_unavailable', _onCallUnavailable);
    socket.on('call_busy', _onCallBusy);
    socket.on('call_ended', _onCallEnded);
    socket.on('call_signal', _onCallSignal);
    _listenersRegistered = true;
  }

  void _unregisterSocketListeners() {
    socket.off('call_accepted', _onCallAccepted);
    socket.off('call_rejected', _onCallRejected);
    socket.off('call_unavailable', _onCallUnavailable);
    socket.off('call_busy', _onCallBusy);
    socket.off('call_ended', _onCallEnded);
    socket.off('call_signal', _onCallSignal);
  }

  bool _isCurrentCall(dynamic data) {
    if (data is! Map) return false;
    return data['callId'] == callId;
  }

  Future<void> _handleSignal(Map<String, dynamic> signal) async {
    final type = signal['type']?.toString();

    if (type == 'offer') {
      final description = Map<String, dynamic>.from(signal['sdp'] as Map);
      await _peerConnection!.setRemoteDescription(
        RTCSessionDescription(description['sdp'], description['type']),
      );
      _hasRemoteDescription = true;
      await _flushPendingCandidates();
      await _createAnswer();
    } else if (type == 'answer') {
      final description = Map<String, dynamic>.from(signal['sdp'] as Map);
      await _peerConnection!.setRemoteDescription(
        RTCSessionDescription(description['sdp'], description['type']),
      );
      _hasRemoteDescription = true;
      await _flushPendingCandidates();
    } else if (type == 'candidate') {
      final candidateData =
          Map<String, dynamic>.from(signal['candidate'] as Map);
      final candidate = RTCIceCandidate(
        candidateData['candidate'],
        candidateData['sdpMid'],
        candidateData['sdpMLineIndex'],
      );

      if (_hasRemoteDescription) {
        await _peerConnection!.addCandidate(candidate);
      } else {
        _pendingCandidates.add(candidate);
      }
    }
  }

  Future<void> _createOffer() async {
    final offer = await _peerConnection!.createOffer();
    await _peerConnection!.setLocalDescription(offer);
    socket.emit('call_signal', {
      'recipientId': peerId,
      'callId': callId,
      'signal': {
        'type': 'offer',
        'sdp': offer.toMap(),
      },
    });
  }

  Future<void> _createAnswer() async {
    final answer = await _peerConnection!.createAnswer();
    await _peerConnection!.setLocalDescription(answer);
    socket.emit('call_signal', {
      'recipientId': peerId,
      'callId': callId,
      'signal': {
        'type': 'answer',
        'sdp': answer.toMap(),
      },
    });
  }

  Future<void> _flushPendingCandidates() async {
    for (final candidate in _pendingCandidates) {
      await _peerConnection!.addCandidate(candidate);
    }
    _pendingCandidates.clear();
  }
}
