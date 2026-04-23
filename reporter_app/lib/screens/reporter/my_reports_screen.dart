import 'package:flutter/material.dart';
import 'package:reporter_app/services/api_service.dart';
import 'package:reporter_app/models/incident.dart';
import 'package:intl/intl.dart';
import 'package:reporter_app/theme/app_theme.dart';

class MyReportsScreen extends StatefulWidget {
  const MyReportsScreen({super.key});

  @override
  State<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends State<MyReportsScreen> {
  final ApiService _apiService = ApiService();
  late Future<List<Incident>> _incidentsFuture;

  @override
  void initState() {
    super.initState();
    _loadIncidents();
  }

  void _loadIncidents() {
    _incidentsFuture = _apiService.getMyIncidents();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Reports'),
        centerTitle: true,
      ),
      body: FutureBuilder<List<Incident>>(
        future: _incidentsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error: ${snapshot.error}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _loadIncidents();
                      });
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final incidents = snapshot.data ?? [];

          if (incidents.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.assignment_outlined,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No incidents reported yet',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Start by reporting a new incident',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pushNamed('/report');
                    },
                    child: const Text('Report Incident'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _loadIncidents();
              });
              await _incidentsFuture;
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: incidents.length,
              itemBuilder: (context, index) {
                return _IncidentCard(incident: incidents[index]);
              },
            ),
          );
        },
      ),
    );
  }
}

class _IncidentCard extends StatelessWidget {
  final Incident incident;

  const _IncidentCard({required this.incident});

  Color _getStatusColor(String status) {
    switch (status) {
      case 'REPORTED':
        return Colors.orange;
      case 'ACKNOWLEDGED':
        return Colors.blue;
      case 'RESPONDING':
        return Colors.purple;
      case 'RESOLVED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getSeverityColor(String severity) {
    switch (severity) {
      case 'LOW':
        return Colors.blue;
      case 'MEDIUM':
        return Colors.orange;
      case 'HIGH':
        return Colors.red;
      case 'CRITICAL':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM dd, yyyy • hh:mm a');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with incident code and status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        incident.incidentCode,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        dateFormat.format(incident.createdAt),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
                Chip(
                  label: Text(incident.status,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      )),
                  backgroundColor: _getStatusColor(incident.status),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Incident type and severity
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: emergencyTypeColors[incident.incidentType] ??
                        Colors.grey,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    incident.incidentType.replaceAll('_', ' '),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getSeverityColor(incident.severity),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '${incident.severity} Severity',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Description
            Text(
              incident.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),

            // Location
            if (incident.location.isNotEmpty)
              Row(
                children: [
                  const Icon(Icons.location_on, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      incident.location,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 12),

            // View Details Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  _showIncidentDetails(context, incident);
                },
                child: const Text('View Details'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showIncidentDetails(BuildContext context, Incident incident) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Incident Details',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _DetailField('Code', incident.incidentCode),
              _DetailField('Type', incident.incidentType.replaceAll('_', ' ')),
              _DetailField('Status', incident.status),
              _DetailField('Severity', incident.severity),
              if (incident.location.isNotEmpty)
                _DetailField('Location', incident.location),
              _DetailField('Latitude', incident.latitude.toString()),
              _DetailField('Longitude', incident.longitude.toString()),
              _DetailField(
                'Reported',
                DateFormat('MMM dd, yyyy • hh:mm a').format(incident.createdAt),
              ),
              if (incident.reporterName != null)
                _DetailField('Reporter', incident.reporterName!),
              if (incident.reporterPhone != null)
                _DetailField('Contact', incident.reporterPhone!),
              const SizedBox(height: 8),
              Text(
                'Description',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                incident.description,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailField extends StatelessWidget {
  final String label;
  final String value;

  const _DetailField(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
