import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:reporter_app/models/incident.dart';
import 'package:reporter_app/providers/auth_provider.dart';
import 'package:reporter_app/providers/socket_provider.dart';
import 'package:reporter_app/services/api_service.dart';

class ReporterHomeScreen extends StatefulWidget {
  const ReporterHomeScreen({super.key});

  @override
  State<ReporterHomeScreen> createState() => _ReporterHomeScreenState();
}

class _ReporterHomeScreenState extends State<ReporterHomeScreen> {
  final ApiService _apiService = ApiService();
  List<Incident> _incidents = [];
  bool _loading = true;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _connectSocket();
      _loadIncidents();
      _registerSocketListeners();
    });
  }

  void _connectSocket() {
    final authProvider = context.read<AuthProvider>();
    final socketProvider = context.read<SocketProvider>();
    if (authProvider.token != null && !socketProvider.isConnected) {
      socketProvider.connect(authProvider.token!);
    }
  }

  void _registerSocketListeners() {
    final socketProvider = context.read<SocketProvider>();

    socketProvider.on('incident_status_updated', (data) {
      if (!mounted || data is! Map) return;
      final incidentId = (data['incident_id'] ?? '').toString();
      final status = (data['status'] ?? '').toString();
      setState(() {
        _incidents = _incidents.map((incident) {
          if (incident.id == incidentId) {
            return Incident(
              id: incident.id,
              incidentCode: incident.incidentCode,
              incidentType: incident.incidentType,
              description: incident.description,
              severity: incident.severity,
              latitude: incident.latitude,
              longitude: incident.longitude,
              mapPinAddress: incident.mapPinAddress,
              status: status.isEmpty ? incident.status : status,
              reporterName: incident.reporterName,
              reporterPhone: incident.reporterPhone,
              reporterId: incident.reporterId,
              createdAt: incident.createdAt,
              updatedAt: DateTime.now(),
              photoUrls: incident.photoUrls,
            );
          }
          return incident;
        }).toList();
      });
    });
  }

  Future<void> _loadIncidents() async {
    setState(() => _loading = true);
    try {
      final incidents = await _apiService
          .getMyIncidents()
          .timeout(const Duration(seconds: 15));
      if (!mounted) return;
      setState(() {
        _incidents = incidents;
        _loading = false;
        _loadError = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _incidents = [];
        _loadError = 'Could not load reports. Pull down to retry.';
      });
    }
  }

  @override
  void dispose() {
    final socketProvider = context.read<SocketProvider>();
    try {
      socketProvider.off('incident_status_updated');
    } catch (_) {}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final displayName = (authProvider.user?.fullName.trim().isNotEmpty ?? false)
        ? authProvider.user!.fullName
        : 'Community Reporter';
    final activeCount = _incidents
        .where((i) => ['REPORTED', 'VERIFIED', 'RESPONDING'].contains(i.status))
        .length;
    final recentIncidents = _incidents.take(5).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          Container(
            height: 260,
            decoration: const BoxDecoration(
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(38)),
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
              ),
            ),
          ),
          SafeArea(
            child: RefreshIndicator(
              onRefresh: _loadIncidents,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 120),
                children: [
                  _HomeHeader(
                    name: displayName,
                    hasActive: activeCount > 0,
                  ),
                  const SizedBox(height: 20),
                  _EmergencyCard(
                    onTap: () => Navigator.of(context).pushNamed('/report'),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          title: 'Total Reports',
                          value: _incidents.length.toString(),
                          loading: _loading,
                          icon: Icons.description_outlined,
                          iconColor: const Color(0xFFDBEAFE),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          title: 'Active',
                          value: activeCount.toString(),
                          loading: _loading,
                          icon: Icons.monitor_heart_outlined,
                          iconColor: const Color(0xFFFFEDD5),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'RECENT ACTIVITY',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.9,
                        ),
                      ),
                      TextButton(
                        onPressed: () => Navigator.of(context).pushNamed('/my-reports'),
                        child: const Text('View All'),
                      ),
                    ],
                  ),
                  if (_loadError != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        _loadError!,
                        style: const TextStyle(
                          color: Color(0xFFDC2626),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  if (_loading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 30),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (recentIncidents.isEmpty)
                    const _EmptyReportsCard()
                  else
                    ...recentIncidents.map(_IncidentTile.new),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _BottomNav(
        index: 0,
        onTap: (index) {
          if (index == 1) {
            Navigator.of(context).pushReplacementNamed('/my-reports');
          } else if (index == 2) {
            Navigator.of(context).pushReplacementNamed('/profile');
          }
        },
      ),
    );
  }
}

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({
    required this.name,
    required this.hasActive,
  });

  final String name;
  final bool hasActive;

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final initials = name
        .split(' ')
        .where((e) => e.isNotEmpty)
        .map((e) => e[0])
        .take(2)
        .join()
        .toUpperCase();
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${_greeting()},',
              style: const TextStyle(
                color: Color(0xFFBFDBFE),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '$name 👋',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        Row(
          children: [
            Stack(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: const Icon(Icons.notifications_none, color: Colors.white),
                ),
                if (hasActive)
                  const Positioned(
                    top: 8,
                    right: 10,
                    child: CircleAvatar(radius: 4, backgroundColor: Colors.red),
                  ),
              ],
            ),
            const SizedBox(width: 10),
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(21),
                gradient: const LinearGradient(
                  colors: [Color(0xFF3B82F6), Color(0xFF4F46E5)],
                ),
              ),
              child: Center(
                child: Text(
                  initials.isEmpty ? 'U' : initials,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _EmergencyCard extends StatelessWidget {
  const _EmergencyCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(28),
      onTap: onTap,
      child: Ink(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(26),
          gradient: const LinearGradient(
            colors: [Color(0xFFF43F5E), Color(0xFFE11D48)],
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x66E11D48),
              blurRadius: 30,
              offset: Offset(0, 10),
            ),
          ],
        ),
        child: const Column(
          children: [
            CircleAvatar(
              radius: 34,
              backgroundColor: Color(0x33FFFFFF),
              child: Icon(Icons.warning_amber_rounded, color: Colors.white, size: 36),
            ),
            SizedBox(height: 10),
            Text(
              'Emergency Report',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 2),
            Text(
              'Tap to request immediate assistance  >',
              style: TextStyle(color: Color(0xFFFECDD3), fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.title,
    required this.value,
    required this.loading,
    required this.icon,
    required this.iconColor,
  });

  final String title;
  final String value;
  final bool loading;
  final IconData icon;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 118,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Stack(
        children: [
          Positioned(
            top: 0,
            right: 0,
            child: Icon(icon, size: 48, color: iconColor),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title.toUpperCase(),
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.1,
                ),
              ),
              const Spacer(),
              loading
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(strokeWidth: 2.4),
                    )
                  : Text(
                      value,
                      style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900),
                    ),
            ],
          ),
        ],
      ),
    );
  }
}

class _IncidentTile extends StatelessWidget {
  const _IncidentTile(this.incident);

  final Incident incident;

  IconData _typeIcon() {
    final t = incident.incidentType.toUpperCase();
    if (t.contains('FIRE')) return Icons.local_fire_department;
    if (t.contains('MEDICAL')) return Icons.medical_services_outlined;
    if (t.contains('ACCIDENT')) return Icons.car_crash_outlined;
    if (t.contains('CRIME')) return Icons.gpp_bad_outlined;
    return Icons.description_outlined;
  }

  String _timeAgo(DateTime value) {
    final mins = DateTime.now().difference(value).inMinutes;
    if (mins < 1) return 'Just now';
    if (mins < 60) return '$mins min${mins > 1 ? 's' : ''} ago';
    final hrs = mins ~/ 60;
    if (hrs < 24) return '$hrs hr${hrs > 1 ? 's' : ''} ago';
    return DateFormat('MMM d').format(value);
  }

  @override
  Widget build(BuildContext context) {
    final isResolved = incident.status == 'RESOLVED' || incident.status == 'CLOSED';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: isResolved ? const Color(0xFFF1F5F9) : const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _typeIcon(),
              color: isResolved ? const Color(0xFF94A3B8) : const Color(0xFFF97316),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  incident.incidentType,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_timeAgo(incident.createdAt)} • ${incident.mapPinAddress ?? 'Unknown'}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
            decoration: BoxDecoration(
              color: isResolved ? const Color(0xFFF1F5F9) : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              incident.status,
              style: TextStyle(
                fontSize: 10,
                color: isResolved ? const Color(0xFF475569) : const Color(0xFF2563EB),
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyReportsCard extends StatelessWidget {
  const _EmptyReportsCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        children: [
          Icon(Icons.description_outlined, color: Color(0xFF94A3B8), size: 30),
          SizedBox(height: 8),
          Text(
            'No reports yet. Tap the button above to submit one.',
            style: TextStyle(color: Color(0xFF64748B)),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  const _BottomNav({
    required this.index,
    required this.onTap,
  });

  final int index;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: index,
      onTap: onTap,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.description_outlined), label: 'Reports'),
        BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
      ],
    );
  }
}
