import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

class SocketProvider extends ChangeNotifier {
  late socket_io.Socket _socket;
  bool _isConnected = false;
  String? _error;
  late String socketUrl;

  bool get isConnected => _isConnected;
  String? get error => _error;

  SocketProvider() {
    socketUrl = dotenv.env['SOCKET_IO_URL'] ?? 'http://10.0.2.2:3001';
  }

  void connect(String token) {
    if (_isConnected) return;

    try {
      _socket = socket_io.io(
        socketUrl,
        socket_io.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .setExtraHeaders({'Authorization': 'Bearer $token'})
            .build(),
      );

      _socket.onConnect((_) {
        _isConnected = true;
        _error = null;
        notifyListeners();
      });

      _socket.onDisconnect((_) {
        _isConnected = false;
        notifyListeners();
      });

      _socket.onError((error) {
        _error = error.toString();
        notifyListeners();
      });

      _socket.on('new_incident', (data) {
        notifyListeners();
      });

      _socket.on('incident_status_updated', (data) {
        notifyListeners();
      });
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  void disconnect() {
    if (_socket.connected) {
      _socket.disconnect();
      _isConnected = false;
      notifyListeners();
    }
  }

  void emit(String event, dynamic data) {
    if (_isConnected) {
      _socket.emit(event, data);
    }
  }

  void on(String event, Function(dynamic) callback) {
    _socket.on(event, callback);
  }

  void off(String event) {
    _socket.off(event);
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
