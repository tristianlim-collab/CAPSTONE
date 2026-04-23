class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? contactNumber;
  final String? unitId;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.contactNumber,
    this.unitId,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['id'] ?? json['user_id'] ?? '').toString(),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'REPORTER',
      contactNumber: json['contact_number']?.toString(),
      unitId: json['unit_id']?.toString(),
    );
  }

  // Split name into first/last for display
  String get firstName {
    final parts = name.split(' ');
    return parts.isNotEmpty ? parts.first : '';
  }

  String get lastName {
    final parts = name.split(' ');
    return parts.length > 1 ? parts.sublist(1).join(' ') : '';
  }

  String get fullName => name;
}
