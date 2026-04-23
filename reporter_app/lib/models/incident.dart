class Incident {
  final String id;
  final String incidentCode;
  final String incidentType;
  final String description;
  final String severity;
  final double latitude;
  final double longitude;
  final String? mapPinAddress;
  final String status;
  final String? reporterName;
  final String? reporterPhone;
  final String reporterId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<String>? photoUrls;

  Incident({
    required this.id,
    required this.incidentCode,
    required this.incidentType,
    required this.description,
    required this.severity,
    required this.latitude,
    required this.longitude,
    this.mapPinAddress,
    required this.status,
    this.reporterName,
    this.reporterPhone,
    required this.reporterId,
    required this.createdAt,
    required this.updatedAt,
    this.photoUrls,
  });

  factory Incident.fromJson(Map<String, dynamic> json) {
    // Handle incident_type which can be a string or an object with 'name'
    String typeName = 'OTHER';
    if (json['incident_type'] is Map) {
      typeName = json['incident_type']['name'] ?? 'OTHER';
    } else if (json['incident_type'] is String) {
      typeName = json['incident_type'];
    } else if (json['incidentType'] is String) {
      typeName = json['incidentType'];
    }

    return Incident(
      id: (json['incident_id'] ?? json['id'] ?? '').toString(),
      incidentCode: json['incident_code'] ?? json['incidentCode'] ?? '',
      incidentType: typeName,
      description: json['description'] ?? '',
      severity: json['severity'] ?? 'MEDIUM',
      latitude: _toDouble(json['latitude']),
      longitude: _toDouble(json['longitude']),
      mapPinAddress: json['map_pin_address'] ?? json['mapPinAddress'],
      status: json['status'] ?? 'REPORTED',
      reporterName: json['reporter_name'] ?? json['reporterName'] ?? (json['reporter'] is Map ? json['reporter']['name'] : null),
      reporterPhone: json['reporter_contact'] ?? json['reporterPhone'],
      reporterId: (json['reporter_id'] ?? json['reporterId'] ?? '').toString(),
      createdAt: DateTime.tryParse(json['reported_at'] ?? json['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updated_at'] ?? json['updatedAt'] ?? '') ?? DateTime.now(),
      photoUrls: _extractPhotoUrls(json['evidence']),
    );
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static List<String>? _extractPhotoUrls(dynamic evidence) {
    if (evidence == null || evidence is! List) return null;
    return evidence
        .where((e) => e is Map && (e['file_path'] != null || e['fileUrl'] != null))
        .map<String>((e) => (e['file_path'] ?? e['fileUrl']).toString())
        .toList();
  }

  String get location => mapPinAddress ?? '';
}
