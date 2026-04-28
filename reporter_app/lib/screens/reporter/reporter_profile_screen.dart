import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:reporter_app/providers/auth_provider.dart';

class ReporterProfileScreen extends StatefulWidget {
  const ReporterProfileScreen({super.key});

  @override
  State<ReporterProfileScreen> createState() => _ReporterProfileScreenState();
}

class _ReporterProfileScreenState extends State<ReporterProfileScreen> {
  Future<void> _openEditProfile() async {
    final auth = context.read<AuthProvider>();
    final user = auth.user;
    final nameController = TextEditingController(text: user?.fullName ?? '');
    final emailController = TextEditingController(text: user?.email ?? '');
    final phoneController = TextEditingController(text: user?.contactNumber ?? '+63');

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        bool saving = false;
        return StatefulBuilder(
          builder: (context, setSheetState) => Padding(
            padding: EdgeInsets.fromLTRB(
              16,
              14,
              16,
              16 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Edit Profile',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                TextField(
                  controller: nameController,
                  decoration: _input('Full Name'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: _input('Email Address'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: _input('Contact Number'),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: saving
                        ? null
                        : () async {
                            final name = nameController.text.trim();
                            final email = emailController.text.trim();
                            final phone = phoneController.text.trim();
                            if (name.isEmpty || email.isEmpty) return;
                            setSheetState(() => saving = true);
                            final ok = await auth.updateProfile(
                              name: name,
                              email: email,
                              contactNumber: phone.isEmpty ? null : phone,
                            );
                            if (!mounted || !context.mounted) return;
                            if (ok) {
                              if (context.mounted) Navigator.pop(context);
                              ScaffoldMessenger.of(sheetContext).showSnackBar(
                                const SnackBar(content: Text('Profile updated successfully')),
                              );
                            } else {
                              ScaffoldMessenger.of(sheetContext).showSnackBar(
                                SnackBar(
                                  content: Text(auth.error ?? 'Failed to update profile'),
                                ),
                              );
                            }
                            setSheetState(() => saving = false);
                          },
                    child: saving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Save Changes'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _openChangePassword() async {
    final auth = context.read<AuthProvider>();
    final currentController = TextEditingController();
    final nextController = TextEditingController();
    final confirmController = TextEditingController();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        bool saving = false;
        return StatefulBuilder(
          builder: (context, setSheetState) => Padding(
            padding: EdgeInsets.fromLTRB(
              16,
              14,
              16,
              16 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Change Password',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                TextField(
                  controller: currentController,
                  obscureText: true,
                  decoration: _input('Current Password'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: nextController,
                  obscureText: true,
                  decoration: _input('New Password'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: confirmController,
                  obscureText: true,
                  decoration: _input('Confirm New Password'),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: saving
                        ? null
                        : () async {
                            final current = currentController.text.trim();
                            final next = nextController.text.trim();
                            final confirm = confirmController.text.trim();
                            if (next != confirm) {
                              ScaffoldMessenger.of(sheetContext).showSnackBar(
                                const SnackBar(content: Text('New passwords do not match')),
                              );
                              return;
                            }
                            if (next.length < 6) {
                              ScaffoldMessenger.of(sheetContext).showSnackBar(
                                const SnackBar(content: Text('Password must be at least 6 characters')),
                              );
                              return;
                            }
                            setSheetState(() => saving = true);
                            final ok = await auth.updatePassword(
                              currentPassword: current,
                              newPassword: next,
                            );
                            if (!mounted || !context.mounted) return;
                            if (ok) {
                              if (context.mounted) Navigator.pop(context);
                              ScaffoldMessenger.of(sheetContext).showSnackBar(
                                const SnackBar(content: Text('Password updated successfully')),
                              );
                            } else {
                              ScaffoldMessenger.of(sheetContext).showSnackBar(
                                SnackBar(
                                  content: Text(auth.error ?? 'Failed to update password'),
                                ),
                              );
                            }
                            setSheetState(() => saving = false);
                          },
                    child: saving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Update Password'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  InputDecoration _input(String hint) {
    return InputDecoration(
      hintText: hint,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final initials = (user?.name ?? 'U')
        .split(' ')
        .where((e) => e.isNotEmpty)
        .map((e) => e[0])
        .take(2)
        .join()
        .toUpperCase();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('My Profile'),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _openEditProfile,
            icon: const Icon(Icons.edit_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Column(
              children: [
                Container(
                  width: 92,
                  height: 92,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [Color(0xFF3B82F6), Color(0xFF4F46E5)],
                    ),
                    border: Border.all(color: Colors.white, width: 3),
                  ),
                  child: Center(
                    child: Text(
                      initials.isEmpty ? 'U' : initials,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  user?.fullName ?? 'Citizen User',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                ),
                Text(
                  user?.email ?? '',
                  style: const TextStyle(color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _infoTile(Icons.phone_outlined, 'Phone Number', user?.contactNumber ?? 'Not provided'),
          _infoTile(
            Icons.verified_user_outlined,
            'Role',
            user?.role == 'REPORTER' ? 'Verified Reporter' : (user?.role ?? 'User'),
          ),
          const SizedBox(height: 20),
          ListTile(
            onTap: () => Navigator.of(context).pushReplacementNamed('/my-reports'),
            tileColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            leading: const Icon(Icons.description_outlined),
            title: const Text('My Incident Reports'),
            trailing: const Icon(Icons.chevron_right),
          ),
          const SizedBox(height: 8),
          ListTile(
            onTap: _openChangePassword,
            tileColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            leading: const Icon(Icons.key_outlined),
            title: const Text('Change Password'),
            trailing: const Icon(Icons.chevron_right),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFEF2F2),
              foregroundColor: const Color(0xFFDC2626),
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: const Icon(Icons.logout),
            label: const Text('Log Out'),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 2,
        onTap: (index) {
          if (index == 0) {
            Navigator.of(context).pushReplacementNamed('/home');
          } else if (index == 1) {
            Navigator.of(context).pushReplacementNamed('/my-reports');
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.description_outlined), label: 'Reports'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _infoTile(IconData icon, String title, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF475569)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
