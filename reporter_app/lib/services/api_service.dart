import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:reporter_app/models/incident.dart';
import 'package:reporter_app/models/incident_type.dart';
import 'package:reporter_app/models/user.dart';
import 'dart:convert';
import 'dart:io';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  static const Duration _timeout = Duration(seconds: 12);
  late String baseUrl;
  String? _token;

  factory ApiService() {
    return _instance;
  }

  ApiService._internal() {
    // Try to load from .env, fallback to emulator address
    baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:3001';
  }

  void setToken(String token) {
    _token = token;
  }

  void clearToken() {
    _token = null;
  }

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  // Auth endpoints
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String contactNumber,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/register'),
        headers: _headers,
        body: jsonEncode({
          'email': email,
          'password': password,
          'name': '$firstName $lastName',  // Combine first and last name
          'contact_number': contactNumber,  // Changed from contactNumber
          'role': 'REPORTER',
        }),
      ).timeout(_timeout);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception(jsonDecode(response.body)['message'] ?? 'Registration failed');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: _headers,
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      ).timeout(_timeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception(jsonDecode(response.body)['message'] ?? 'Login failed');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<User> getMe() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/auth/me'),
        headers: _headers,
      ).timeout(_timeout);

      if (response.statusCode == 200) {
        return User.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to get user');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<User> updateProfile({
    required String name,
    required String email,
    String? contactNumber,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/auth/me'),
        headers: _headers,
        body: jsonEncode({
          'name': name,
          'email': email,
          'contact_number': contactNumber,
        }),
      ).timeout(_timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return User.fromJson(data['user'] ?? data);
      } else {
        throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to update profile');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/auth/me/password'),
        headers: _headers,
        body: jsonEncode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      ).timeout(_timeout);

      if (response.statusCode != 200) {
        throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to update password');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Incident endpoints
  Future<Incident> createIncident({
    required String incidentType,
    required String description,
    required String severity,
    required double latitude,
    required double longitude,
    required String? barangay,
    required String? city,
    String? reporterName,
    String? reporterPhone,
    List<String>? photoUrls,
  }) async {
    try {
      // First, get incident types to find the ID for the given type name
      final typesResponse = await http.get(
        Uri.parse('$baseUrl/api/incident-types'),
        headers: _headers,
      ).timeout(_timeout);

      if (typesResponse.statusCode != 200) {
        throw Exception('Failed to fetch incident types');
      }

      final typesList = jsonDecode(typesResponse.body) as List;
      final selectedType = typesList.firstWhere(
        (t) => t['name'].toString().toUpperCase() == incidentType.toUpperCase(),
        orElse: () => null,
      );

      if (selectedType == null) {
        throw Exception('Invalid incident type: $incidentType');
      }

      final incidentTypeId = selectedType['type_id'];
      final mapPinAddress = '$barangay, $city'.replaceAll('null, ', '').replaceAll(', null', '');

      final response = await http.post(
        Uri.parse('$baseUrl/api/incidents'),
        headers: _headers,
        body: jsonEncode({
          'incident_type_id': incidentTypeId,
          'description': description,
          'severity': severity,
          'latitude': latitude,
          'longitude': longitude,
          'map_pin_address': mapPinAddress,
        }),
      ).timeout(_timeout);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return Incident.fromJson(jsonDecode(response.body));
      } else {
        throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to create incident');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<List<Incident>> getMyIncidents() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/incidents?reporter=me'),
        headers: _headers,
      ).timeout(_timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List incidents = data['data'] ?? data ?? [];
        return incidents.map((i) => Incident.fromJson(i)).toList();
      } else {
        throw Exception('Failed to fetch incidents');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<Incident> getIncidentById(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/incidents/$id'),
        headers: _headers,
      ).timeout(_timeout);

      if (response.statusCode == 200) {
        return Incident.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to fetch incident');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Incident types
  Future<List<IncidentType>> getIncidentTypes() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/incident-types'),
        headers: _headers,
      ).timeout(_timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List types = data['data'] ?? data ?? [];
        return types.map((t) => IncidentType.fromJson(t)).toList();
      } else {
        throw Exception('Failed to fetch incident types');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Evidence/Photo upload
  Future<Map<String, dynamic>> uploadPhotoFromUrl({
    required int incidentId,
    required String imageUrl,
    required String uploadedBy,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/evidence/from-url'),
        headers: _headers,
        body: jsonEncode({
          'incidentId': incidentId,
          'imageUrl': imageUrl,
          'uploadedBy': uploadedBy,
        }),
      ).timeout(_timeout);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to upload photo');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getEvidenceForIncident(int incidentId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/evidence/$incidentId'),
        headers: _headers,
      ).timeout(_timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['data'] ?? data ?? []);
      } else {
        throw Exception('Failed to fetch evidence');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> uploadEvidenceFile({
    required String incidentId,
    required File file,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/api/evidence'),
      );
      request.headers['Accept'] = 'application/json';
      if (_token != null) {
        request.headers['Authorization'] = 'Bearer $_token';
      }

      request.fields['incident_id'] = incidentId;
      request.files.add(await http.MultipartFile.fromPath('file', file.path));

      final streamedResponse = await request.send().timeout(_timeout);
      final response = await http.Response.fromStream(streamedResponse);
      final decoded = response.body.isNotEmpty ? jsonDecode(response.body) : <String, dynamic>{};

      if (response.statusCode == 201 || response.statusCode == 200) {
        return Map<String, dynamic>.from(decoded);
      } else {
        throw Exception(decoded['message'] ?? 'Failed to upload evidence');
      }
    } catch (e) {
      rethrow;
    }
  }
}
