import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:reporter_app/providers/auth_provider.dart';
import 'package:reporter_app/providers/socket_provider.dart';
import 'package:reporter_app/screens/auth/login_screen.dart';
import 'package:reporter_app/screens/auth/register_screen.dart';
import 'package:reporter_app/screens/reporter/reporter_home_screen.dart';
import 'package:reporter_app/screens/reporter/incident_report_form_screen.dart';
import 'package:reporter_app/screens/reporter/my_reports_screen.dart';
import 'package:reporter_app/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    debugPrint('Warning: Could not load .env file: $e');
  }
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => SocketProvider()),
      ],
      child: MaterialApp(
        title: 'GAOIRS Reporter',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const _HomeRouter(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/home': (context) => const ReporterHomeScreen(),
          '/report': (context) => const IncidentReportFormScreen(),
          '/my-reports': (context) => const MyReportsScreen(),
        },
      ),
    );
  }
}

class _HomeRouter extends StatelessWidget {
  const _HomeRouter({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        if (authProvider.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (authProvider.isAuthenticated) {
          return const ReporterHomeScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}
