import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geo;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  late String nominatimUrl;

  factory LocationService() {
    return _instance;
  }

  LocationService._internal() {
    nominatimUrl = dotenv.env['NOMINATIM_URL'] ?? 'https://nominatim.openstreetmap.org';
  }

  Future<bool> checkLocationPermission() async {
    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      return await requestLocationPermission();
    } else if (permission == LocationPermission.deniedForever) {
      return false;
    }
    return true;
  }

  Future<bool> requestLocationPermission() async {
    final permission = await Geolocator.requestPermission();
    return permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always;
  }

  Future<Position?> getCurrentLocation({
    Duration timeout = const Duration(seconds: 30),
  }) async {
    try {
      final hasPermission = await checkLocationPermission();
      if (!hasPermission) return null;

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: timeout,
      );
      return position;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, String?>> getReverseGeocodingInfo(
    double latitude,
    double longitude,
  ) async {
    try {
      // Try using Nominatim (OpenStreetMap)
      final response = await http
          .get(
            Uri.parse(
              '$nominatimUrl/reverse?format=json&lat=$latitude&lon=$longitude',
            ),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final address = data['address'] ?? {};

        return {
          'barangay': address['sub_hamlet'] ??
              address['village'] ??
              address['suburb'] ??
              address['town'] ??
              address['city'],
          'city': address['city'] ?? address['county'] ?? address['state'],
          'address': data['display_name'],
        };
      }
    } catch (e) {
      // Fallback to plugin
    }

    // Fallback to Flutter geocoding plugin
    try {
      final placemarks = await geo.placemarkFromCoordinates(latitude, longitude);
      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        return {
          'barangay': place.subLocality ?? place.locality,
          'city': place.administrativeArea ?? place.country,
          'address':
              '${place.street}, ${place.subLocality}, ${place.administrativeArea}',
        };
      }
    } catch (e) {
      // Continue
    }

    return {
      'barangay': null,
      'city': null,
      'address': null,
    };
  }

  Future<List<geo.Placemark>> getAddressFromCoordinates(
    double latitude,
    double longitude,
  ) async {
    try {
      return await geo.placemarkFromCoordinates(latitude, longitude);
    } catch (e) {
      return [];
    }
  }

  double calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
  }
}
