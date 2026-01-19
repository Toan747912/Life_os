import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/auth/auth_bloc.dart';
import '../bloc/auth/auth_event.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.notifications),
            title: const Text('Notifications'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () {
              // Handle logout
              // Dispatch Logout Event
              context.read<AuthBloc>().add(LogoutRequested());
              // Optional: Navigation handled by AuthBloc listener in ancestor?
              // Usually the root router or Main app listens to AuthState.
              // If not, we might need a listener here or in MainScreen.
              // Assuming RouterRedirector handles it or we manually go to login.
              // Let's assume global listener for now, if not we'll add one.
            },
          ),
        ],
      ),
    );
  }
}
