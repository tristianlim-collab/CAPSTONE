import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:reporter_app/models/user.dart';
import 'package:reporter_app/services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _user;
  String? _token;
  bool _isLoading = true;
  String? _error;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null && _user != null;
  String? get error => _error;

  AuthProvider() {
    _initAuth();
  }

  Future<void> _initAuth() async {
    _isLoading = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      if (token != null && !JwtDecoder.isExpired(token)) {
        _token = token;
        _apiService.setToken(token);
        await _fetchUser();
      } else {
        _token = null;
        _user = null;
        if (token != null) {
          prefs.remove('jwt_token');
        }
      }
    } catch (e) {
      _error = e.toString();
      _token = null;
      _user = null;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> _fetchUser() async {
    try {
      _user = await _apiService.getMe();
      _error = null;
    } catch (e) {
      _error = e.toString();
      _user = null;
      _token = null;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String contactNumber,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        contactNumber: contactNumber,
      );

      _token = response['token'];
      _apiService.setToken(_token!);
      _user = User.fromJson(response['user']);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', _token!);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.login(
        email: email,
        password: password,
      );

      _token = response['token'];
      _apiService.setToken(_token!);
      _user = User.fromJson(response['user']);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', _token!);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = null;
      _token = null;
      _apiService.clearToken();

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('jwt_token');
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }
}
