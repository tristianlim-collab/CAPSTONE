import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:reporter_app/providers/auth_provider.dart';
import 'package:reporter_app/providers/socket_provider.dart';

class ReporterHomeScreen extends StatefulWidget {
  const ReporterHomeScreen({super.key});

  @override
  State<ReporterHomeScreen> createState() => _ReporterHomeScreenState();
}

class _ReporterHomeScreenState extends State<ReporterHomeScreen> {
  @override
  void initState() {
    super.initState();
    // Initialize Socket.io connection
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final authProvider = context.read<AuthProvider>();
      final socketProvider = context.read<SocketProvider>();
      if (authProvider.token != null && !socketProvider.isConnected) {
        socketProvider.connect(authProvider.token!);
      }
    });
  }

  void _showProfileMenu() {
    showModalBottomSheet(
      context: context,
      builder: (_) => Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.person),
                title: Text(authProvider.user?.fullName ?? 'Profile'),
                subtitle: Text(authProvider.user?.email ?? ''),
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.logout),
                title: const Text('Logout'),
                onTap: () async {
                  Navigator.pop(context);
                  await authProvider.logout();
                  if (mounted) {
                    Navigator.of(context).pushReplacementNamed('/login');
                  }
                },
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GAOIRS Reporter'),
        elevation: 0,
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome, ${authProvider.user?.firstName}!',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Report incidents in real-time',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey,
                        ),
                  ),
                  const SizedBox(height: 32),
                  // Quick action cards
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    children: [
                      _ActionCard(
                        icon: Icons.add_circle_outline,
                        title: 'Report Incident',
                        color: Colors.blue,
                        onTap: () {
                          Navigator.of(context).pushNamed('/report');
                        },
                      ),
                      _ActionCard(
                        icon: Icons.list_alt,
                        title: 'My Reports',
                        color: Colors.orange,
                        onTap: () {
                          Navigator.of(context).pushNamed('/my-reports');
                        },
                      ),
                      _ActionCard(
                        icon: Icons.person,
                        title: 'Profile',
                        color: Colors.green,
                        onTap: _showProfileMenu,
                      ),
                      _ActionCard(
                        icon: Icons.info_outline,
                        title: 'About',
                        color: Colors.purple,
                        onTap: () {
                          showDialog(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text('About GAOIRS'),
                              content: const Text(
                                'Geospatial Approach to Optimize Incident Response System\n\n'
                                'A mobile application for real-time incident reporting and emergency response coordination.',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text('Close'),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Text(
                    'Quick Tips',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  _TipCard(
                    icon: Icons.location_on,
                    title: 'Enable Location',
                    description:
                        'Allow location access for accurate incident coordinates.',
                  ),
                  const SizedBox(height: 8),
                  _TipCard(
                    icon: Icons.camera_alt,
                    title: 'Add Photos',
                    description:
                        'Attach up to 5 photos as evidence when reporting.',
                  ),
                  const SizedBox(height: 8),
                  _TipCard(
                    icon: Icons.warning,
                    title: 'Be Accurate',
                    description:
                        'Provide accurate details to help response units faster.',
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 2,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TipCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _TipCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.secondary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
