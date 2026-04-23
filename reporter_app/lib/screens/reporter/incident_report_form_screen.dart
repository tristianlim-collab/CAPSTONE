import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:reporter_app/providers/auth_provider.dart';
import 'package:reporter_app/services/api_service.dart';
import 'package:reporter_app/services/location_service.dart';
import 'package:reporter_app/models/incident_type.dart';
import 'dart:io';

class IncidentReportFormScreen extends StatefulWidget {
  const IncidentReportFormScreen({Key? key}) : super(key: key);

  @override
  State<IncidentReportFormScreen> createState() =>
      _IncidentReportFormScreenState();
}

class _IncidentReportFormScreenState extends State<IncidentReportFormScreen> {
  late TextEditingController _descriptionController;
  late TextEditingController _reporterNameController;
  late TextEditingController _reporterPhoneController;

  final ApiService _apiService = ApiService();
  final LocationService _locationService = LocationService();
  final ImagePicker _imagePicker = ImagePicker();

  List<IncidentType> _incidentTypes = [];
  IncidentType? _selectedType;
  String _selectedSeverity = 'MEDIUM';
  double? _latitude;
  double? _longitude;
  String? _barangay;
  String? _city;
  List<File> _selectedPhotos = [];
  bool _isLoading = false;
  bool _gettingLocation = false;
  String? _locationError;

  final List<String> _severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  final Map<String, Color> _severityColors = {
    'LOW': Colors.blue,
    'MEDIUM': Colors.orange,
    'HIGH': Colors.red,
    'CRITICAL': Colors.purple,
  };

  @override
  void initState() {
    super.initState();
    _descriptionController = TextEditingController();
    _reporterNameController = TextEditingController();
    _reporterPhoneController = TextEditingController();
    _loadIncidentTypes();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
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
          _selectedType = types.first;
        }
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load incident types: $e')),
      );
    }
  }

  Future<void> _detectLocation() async {
    setState(() => _gettingLocation = true);
    try {
      final position = await _locationService.getCurrentLocation();
      if (position != null) {
        setState(() {
          _latitude = position.latitude;
          _longitude = position.longitude;
        });

        final geoInfo = await _locationService.getReverseGeocodingInfo(
          position.latitude,
          position.longitude,
        );

        setState(() {
          _barangay = geoInfo['barangay'];
          _city = geoInfo['city'];
          _locationError = null;
        });
      } else {
        setState(() {
          _locationError = 'Unable to get location. Please enable location services.';
        });
      }
    } catch (e) {
      setState(() {
        _locationError = 'Error: ${e.toString()}';
      });
    }
    setState(() => _gettingLocation = false);
  }

  Future<void> _selectPhotos() async {
    try {
      final List<XFile> pickedFiles = await _imagePicker.pickMultiImage(
        maxWidth: 1024,
        maxHeight: 1024,
      );

      if (pickedFiles.isNotEmpty) {
        setState(() {
          _selectedPhotos = pickedFiles
              .map((file) => File(file.path))
              .where((file) => _selectedPhotos.length < 5)
              .toList();
        });

        if (_selectedPhotos.length < pickedFiles.length) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Maximum 5 photos allowed. Some were not added.'),
            ),
          );
        }
      }
    } catch (e) {
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

    if (_descriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter incident description')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();
      final incident = await _apiService.createIncident(
        incidentType: _selectedType!.name,
        description: _descriptionController.text.trim(),
        severity: _selectedSeverity,
        latitude: _latitude!,
        longitude: _longitude!,
        barangay: _barangay,
        city: _city,
        reporterName: _reporterNameController.text.trim().isEmpty
            ? authProvider.user?.fullName
            : _reporterNameController.text.trim(),
        reporterPhone: _reporterPhoneController.text.trim(),
      );

      // Upload photos if any
      if (_selectedPhotos.isNotEmpty && incident.id > 0) {
        for (final photo in _selectedPhotos) {
          // Note: In a real app, you'd upload to Cloudinary first
          // For now, we're using the from-url endpoint
          // This is a simplified version - in production you'd upload to a storage service
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Incident reported successfully! Code: ${incident.incidentCode}'),
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error submitting report: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Incident'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Section 1: Photos
              Text(
                'Add Photos (Optional)',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              if (_selectedPhotos.isNotEmpty)
                GridView.builder(
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
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            image: DecorationImage(
                              image: FileImage(_selectedPhotos[index]),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        Positioned(
                          top: 0,
                          right: 0,
                          child: GestureDetector(
                            onTap: () => _removePhoto(index),
                            child: Container(
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                              padding: const EdgeInsets.all(4),
                              child: const Icon(
                                Icons.close,
                                color: Colors.white,
                                size: 16,
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                )
              else
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey, width: 1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: const Center(
                    child: Text('No photos selected'),
                  ),
                ),
              const SizedBox(height: 12),
              if (_selectedPhotos.length < 5)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _selectPhotos,
                    icon: const Icon(Icons.camera_alt),
                    label:
                        Text(_selectedPhotos.isEmpty ? 'Add Photos' : 'Add More'),
                  ),
                ),
              const SizedBox(height: 32),

              // Section 2: Location
              Text(
                'Location Detection',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              if (_latitude != null && _longitude != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.location_on,
                                color: Colors.green, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (_barangay != null)
                                    Text(
                                      '📍 Barangay $_barangay${_city != null ? ', $_city' : ''}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                    ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '$_latitude, $_longitude',
                                    style:
                                        Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                )
              else if (_locationError != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Row(
                      children: [
                        const Icon(Icons.error, color: Colors.red, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _locationError!,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.red,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey, width: 1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: const Center(
                    child: Text('Location not detected'),
                  ),
                ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _gettingLocation ? null : _detectLocation,
                  icon: _gettingLocation
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.my_location),
                  label: Text(_gettingLocation
                      ? 'Detecting...'
                      : 'Detect My Location'),
                ),
              ),
              const SizedBox(height: 32),

              // Section 3: Incident Type
              Text(
                'Emergency Type',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<IncidentType>(
                initialValue: _selectedType,
                items: _incidentTypes
                    .map(
                      (type) => DropdownMenuItem(
                        value: type,
                        child: Text(type.name),
                      ),
                    )
                    .toList(),
                onChanged: (type) {
                  setState(() => _selectedType = type);
                },
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Section 4: Description
              Text(
                'Description',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: InputDecoration(
                  hintText: 'Describe the incident in detail',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Section 5: Severity
              Text(
                'Severity Level',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: _severityLevels
                    .map(
                      (severity) => ChoiceChip(
                        label: Text(severity),
                        selected: _selectedSeverity == severity,
                        onSelected: (selected) {
                          setState(() {
                            _selectedSeverity = severity;
                          });
                        },
                        backgroundColor: _severityColors[severity]
                            ?.withValues(alpha: 0.2),
                        selectedColor: _severityColors[severity],
                        labelStyle: TextStyle(
                          color: _selectedSeverity == severity
                              ? Colors.white
                              : Colors.black,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 32),

              // Section 6: Personal Info
              Text(
                'Personal Information (Optional)',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _reporterNameController,
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  hintText: 'Your full name',
                  prefixIcon: const Icon(Icons.person_outlined),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _reporterPhoneController,
                decoration: InputDecoration(
                  labelText: 'Contact Number',
                  hintText: '09XX-XXX-XXXX',
                  prefixIcon: const Icon(Icons.phone_outlined),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 32),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitReport,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : const Text('Submit Report'),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
