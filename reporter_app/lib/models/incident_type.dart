class IncidentType {
  final int id;
  final String name;
  final String? colorCode;
  final String iconLabel;

  IncidentType({
    required this.id,
    required this.name,
    this.colorCode,
    required this.iconLabel,
  });

  factory IncidentType.fromJson(Map<String, dynamic> json) {
    return IncidentType(
      id: json['type_id'] ?? json['id'] ?? 0,
      name: json['name'] ?? '',
      colorCode: json['color_code'] ?? '#6B7280',
      iconLabel: json['icon_label'] ?? 'file_text',
    );
  }
}
