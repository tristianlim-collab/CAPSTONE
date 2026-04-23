class IncidentType {
  final int id;
  final String name;
  final String color;
  final String iconLabel;

  IncidentType({
    required this.id,
    required this.name,
    required this.color,
    required this.iconLabel,
  });

  factory IncidentType.fromJson(Map<String, dynamic> json) {
    return IncidentType(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      color: json['color'] ?? '#6B7280',
      iconLabel: json['icon_label'] ?? 'file_text',
    );
  }
}
