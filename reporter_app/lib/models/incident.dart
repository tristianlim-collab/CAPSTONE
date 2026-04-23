class Incident {
  final int id;
  final String incidentCode;
  final String incidentType;
  final String description;
  final String severity;
  final double latitude;
  final double longitude;
  final String? barangay;
  final String? city;
  final String status;
  final String? reporterName;
  final String? reporterPhone;
  final int reporterId;
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
    this.barangay,
    this.city,
    required this.status,
    this.reporterName,
    this.reporterPhone,
    required this.reporterId,
    required this.createdAt,
    required this.updatedAt,
    this.photoUrls,
  });

  factory Incident.fromJson(Map<String, dynamic> json) {
    return Incident(
      id: json['id'] ?? 0,
      incidentCode: json['incidentCode'] ?? '',
      incidentType: json['incidentType'] ?? 'OTHER',
      description: json['description'] ?? '',
      severity: json['severity'] ?? 'MEDIUM',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      barangay: json['barangay'],
      city: json['city'],
      status: json['status'] ?? 'REPORTED',
      reporterName: json['reporterName'],
      reporterPhone: json['reporterPhone'],
      reporterId: json['reporterId'] ?? 0,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toString()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toString()),
      photoUrls: (json['evidence'] as List?)?.map((e) => e['fileUrl'] as String).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'incidentCode': incidentCode,
      'incidentType': incidentType,
      'description': description,
      'severity': severity,
      'latitude': latitude,
      'longitude': longitude,
      'barangay': barangay,
      'city': city,
      'status': status,
      'reporterName': reporterName,
      'reporterPhone': reporterPhone,
      'reporterId': reporterId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  get location => '$barangay${city != null ? ', $city' : ''}';
}
