import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as latlng;
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:reporter_app/providers/auth_provider.dart';
import 'package:reporter_app/services/api_service.dart';
import 'package:reporter_app/services/location_service.dart';
import 'package:reporter_app/models/incident_type.dart';
import 'dart:io';

class IncidentReportFormScreen extends StatefulWidget {
  const IncidentReportFormScreen({super.key});

  @override
  State<IncidentReportFormScreen> createState() =>
      _IncidentReportFormScreenState();
}

class _IncidentReportFormScreenState extends State<IncidentReportFormScreen> {
  late TextEditingController _reporterNameController;
  late TextEditingController _reporterPhoneController;

  final ApiService _apiService = ApiService();
  final LocationService _locationService = LocationService();
  final ImagePicker _imagePicker = ImagePicker();

  List<IncidentType> _incidentTypes = [];
  IncidentType? _selectedType;
  String _selectedSeverity = 'LOW';
  double? _latitude;
  double? _longitude;
  String? _address;
  List<File> _selectedPhotos = [];
  bool _isLoading = false;
  bool _gettingLocation = true;
  bool _addressLoading = false;
  String? _locationError;
  final MapController _mapController = MapController();
  latlng.LatLng _mapCenter = const latlng.LatLng(10.0, 122.9);

  final List<String> _severityLevels = ['LOW', 'HIGH', 'CRITICAL'];
  final Map<String, Color> _severityColors = {
    'LOW': const Color(0xFF10B981),
    'HIGH': const Color(0xFFF97316),
    'CRITICAL': const Color(0xFFEF4444),
  };

  @override
  void initState() {
    super.initState();
    _reporterNameController = TextEditingController();
    _reporterPhoneController = TextEditingController(text: '+63');
    _loadIncidentTypes();
    _detectLocation();
  }

  @override
  void dispose() {
    _reporterNameController.dispose();
    _reporterPhoneController.dispose();
    super.dispose();
  }

  Future<void> _loadIncidentTypes() async {
    try {
      final types = await _apiService.getIncidentTypes();
      setState(() {
        _incidentTypes = types;
        if (types.isNotEmpty) {
          _selectedType = types.firstWhere(
            (t) => t.name.toUpperCase() != 'OTHER',
            orElse: () => types.first,
          );
        }
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load incident types: $e')),
      );
    }
  }

  Future<void> _detectLocation() async {
    if (!mounted) return;
    setState(() => _gettingLocation = true);
    try {
      final position = await _locationService.getCurrentLocation();
      if (position != null) {
        if (!mounted) return;
        setState(() {
          _latitude = position.latitude;
          _longitude = position.longitude;
          _mapCenter = latlng.LatLng(position.latitude, position.longitude);
          _locationError = null;
        });
        await _resolveAddress(position.latitude, position.longitude);
        _mapController.move(_mapCenter, 16);
      } else {
        if (!mounted) return;
        setState(() {
          _locationError = 'Unable to get location. Please enable location services.';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _locationError = 'Error: ${e.toString()}';
      });
    }
    if (!mounted) return;
    setState(() => _gettingLocation = false);
  }

  Future<void> _resolveAddress(double lat, double lng) async {
    if (!mounted) return;
    setState(() => _addressLoading = true);
    try {
      final geoInfo = await _locationService.getReverseGeocodingInfo(lat, lng);
      if (!mounted) return;
      setState(() {
        _address = geoInfo['address'] ?? 'Location at ${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _address = 'Location at ${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';
      });
    } finally {
      if (mounted) {
        setState(() => _addressLoading = false);
      }
    }
  }

  Future<void> _onMapTap(latlng.LatLng latLng) async {
    setState(() {
      _latitude = latLng.latitude;
      _longitude = latLng.longitude;
      _mapCenter = latLng;
      _locationError = null;
    });
    await _resolveAddress(latLng.latitude, latLng.longitude);
  }

  Future<void> _capturePhoto() async {
    try {
      final XFile? photo = await _imagePicker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
      );

      if (photo != null) {
        setState(() {
          final current = List<File>.from(_selectedPhotos);
          if (current.length < 5) {
            current.add(File(photo.path));
          }
          _selectedPhotos = current;
        });

        if (_selectedPhotos.length >= 5) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Maximum 5 photos reached. Remove one to capture again.'),
            ),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking photos: $e')),
      );
    }
  }

  void _removePhoto(int index) {
    setState(() {
      _selectedPhotos.removeAt(index);
    });
  }

  Future<void> _submitReport() async {
    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an incident type')),
      );
      return;
    }

    if (_latitude == null || _longitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please detect your location')),
      );
      return;
    }
    final phone = _reporterPhoneController.text.trim();
    final validPhone = RegExp(r'^\+639\d{9}$').hasMatch(phone);
    if (!validPhone) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Contact number is required. Use +639XXXXXXXXX')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();
      final description = '${_selectedType!.name} - $_selectedSeverity: ${_severityDescription()}';
      final incident = await _apiService.createIncident(
        incidentType: _selectedType!.name,
        description: description,
        severity: _selectedSeverity,
        latitude: _latitude!,
        longitude: _longitude!,
        barangay: _address,
        city: null,
        reporterName: _reporterNameController.text.trim().isEmpty
            ? authProvider.user?.fullName
            : _reporterNameController.text.trim(),
        reporterPhone: phone,
      );

      if (_selectedPhotos.isNotEmpty && incident.id.isNotEmpty) {
        for (final photo in _selectedPhotos) {
          try {
            await _apiService.uploadEvidenceFile(
              incidentId: incident.id,
              file: photo,
            );
          } catch (_) {
            // Continue submitting even if some evidence uploads fail.
          }
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Incident reported successfully! Code: ${incident.incidentCode}'),
          ),
        );
        Navigator.of(context).pushReplacementNamed('/report-success');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error submitting report: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  String _severityDescription() {
    switch (_selectedSeverity) {
      case 'LOW':
        return 'Localized issue with limited impact.';
      case 'HIGH':
        return 'Serious incident requiring urgent coordinated response.';
      default:
        return 'Extreme emergency with immediate widespread risk.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final markers = (_latitude != null && _longitude != null)
        ? [
            Marker(
              point: latlng.LatLng(_latitude!, _longitude!),
              width: 44,
              height: 44,
              child: const Icon(
                Icons.location_pin,
                color: Color(0xFFDC2626),
                size: 38,
              ),
            ),
          ]
        : <Marker>[];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Column(
          children: [
            Text('Emergency Report'),
            SizedBox(height: 2),
            Text(
              'COMPLETE FORM',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_locationError != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          border: Border.all(color: const Color(0xFFFECACA)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626)),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_locationError!)),
                          ],
                        ),
                      ),
                    _sectionTitle('PHOTO EVIDENCE', Icons.camera_alt_outlined),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: const Text(
                        'Optional but recommended',
                        style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                      ),
                    ),
                    _photoPickerCard(),
                    if (_selectedPhotos.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      _photoGrid(),
                      const SizedBox(height: 4),
                      Text(
                        '${_selectedPhotos.length}/5 photos attached',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ],
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _sectionTitle('YOUR LOCATION', Icons.location_on_outlined),
                        TextButton.icon(
                          onPressed: _gettingLocation ? null : _detectLocation,
                          icon: Icon(
                            Icons.refresh,
                            size: 14,
                            color: _gettingLocation ? Colors.grey : const Color(0xFF16A34A),
                          ),
                          label: const Text('Refresh'),
                        ),
                      ],
                    ),
                    Container(
                      height: 200,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: _gettingLocation && _latitude == null
                          ? const Center(child: CircularProgressIndicator())
                          : FlutterMap(
                              mapController: _mapController,
                              options: MapOptions(
                                initialCenter: _mapCenter,
                                initialZoom: _latitude != null ? 16 : 13,
                                onTap: (_, point) => _onMapTap(point),
                              ),
                              children: [
                                TileLayer(
                                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                  userAgentPackageName: 'com.gaoirs.reporter_app',
                                ),
                                MarkerLayer(markers: markers),
                              ],
                            ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        border: Border.all(color: const Color(0xFFBBF7D0)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: _addressLoading
                          ? const Text('Resolving address...')
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'YOUR LOCATION - DETECTED',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF15803D),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _address ?? 'Tap the map to select location',
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                                if (_latitude != null && _longitude != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 6),
                                    child: Text(
                                      'GPS: ${_latitude!.toStringAsFixed(6)}°, ${_longitude!.toStringAsFixed(6)}°',
                                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                    ),
                                  ),
                              ],
                            ),
                    ),
                    const SizedBox(height: 16),
                    _sectionTitle('EMERGENCY TYPE *', Icons.warning_amber_rounded),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.white,
                      ),
                      child: DropdownButtonFormField<IncidentType>(
                        initialValue: _selectedType,
                        items: _incidentTypes.isEmpty
                            ? [
                                DropdownMenuItem(
                                  child: const Text('-- Select Emergency Type --'),
                                ),
                              ]
                            : _incidentTypes
                                .map((type) => DropdownMenuItem(
                                      value: type,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                        child: Row(
                                          children: [
                                            // Color indicator
                                            Container(
                                              width: 12,
                                              height: 12,
                                              decoration: BoxDecoration(
                                                color: Color(int.parse('0xFF${type.colorCode?.substring(1) ?? 'CCCCCC'}')),
                                                borderRadius: BorderRadius.circular(2),
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Text(
                                                type.name,
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ))
                                .toList(),
                        onChanged: (type) {
                          if (type != null) setState(() => _selectedType = type);
                        },
                        decoration: InputDecoration(
                          isDense: true,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          errorText: null,
                        ),
                        isExpanded: true,
                        hint: const Text('-- Select Emergency Type --'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _sectionTitle('INCIDENT SEVERITY', Icons.warning_amber_rounded),
                    Row(
                      children: _severityLevels.map((level) {
                        final selected = _selectedSeverity == level;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: InkWell(
                              onTap: () => setState(() => _selectedSeverity = level),
                              borderRadius: BorderRadius.circular(8),
                              child: Ink(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  color: selected ? _severityColors[level] : Colors.white,
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Center(
                                  child: Text(
                                    level,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: selected ? Colors.white : const Color(0xFF334155),
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _severityDescription(),
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _sectionTitle('OPTIONAL PERSONAL INFO', Icons.person_outline),
                    TextField(
                      controller: _reporterNameController,
                      decoration: _inputDecoration('Full Name'),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _reporterPhoneController,
                      keyboardType: TextInputType.phone,
                      maxLength: 13,
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[0-9+]')),
                      ],
                      decoration: _inputDecoration('+639XXXXXXXXX').copyWith(counterText: ''),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isLoading ? null : _submitReport,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFDC2626),
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: const Color(0xFFE2E8F0),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      icon: _isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.send),
                      label: Text(_isLoading ? 'Sending Report...' : 'Submit Emergency Report'),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'False reporting is punishable by law',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String text, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF64748B)),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _photoPickerCard() {
    return InkWell(
      onTap: _selectedPhotos.length >= 5 ? null : _capturePhoto,
      borderRadius: BorderRadius.circular(14),
      child: Ink(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFBFDBFE), width: 1.5),
        ),
        child: const Column(
          children: [
            Icon(Icons.camera_alt_outlined, size: 30, color: Color(0xFF3B82F6)),
            SizedBox(height: 6),
            Text(
              'Click to take or upload photo',
              style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF1D4ED8)),
            ),
            Text(
              '(Optional but recommended)',
              style: TextStyle(fontSize: 12, color: Color(0xFF3B82F6)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _photoGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
      ),
      itemCount: _selectedPhotos.length,
      itemBuilder: (context, index) {
        return Stack(
          children: [
            Positioned.fill(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.file(_selectedPhotos[index], fit: BoxFit.cover),
              ),
            ),
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () => _removePhoto(index),
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: const BoxDecoration(
                    color: Color(0x99000000),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close, color: Colors.white, size: 14),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF3B82F6)),
      ),
    );
  }
}
