import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final http.Client client;
  final String _baseUrl = Platform.isAndroid
      ? 'http://10.0.2.2:8080'
      : 'http://localhost:8080';

  // Simple in-memory token storage for this session
  String? _accessToken;

  @override
  String? get accessToken => _accessToken;

  AuthRepositoryImpl({http.Client? client}) : client = client ?? http.Client();

  @override
  Future<void> login(String email, String password) async {
    try {
      final response = await client.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final body = jsonDecode(response.body);
        _accessToken = body['access_token'];
        debugPrint('Login successful. Token: $_accessToken');
      } else {
        throw Exception('Login failed: ${response.body}');
      }
    } catch (e) {
      debugPrint('Login error: $e');
      rethrow;
    }
  }

  @override
  Future<void> register(
    String email,
    String password,
    String displayName,
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$_baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'displayName': displayName,
        }),
      );

      if (response.statusCode == 201) {
        debugPrint('Registration successful');
        // Optionally auto-login here
      } else {
        throw Exception('Registration failed: ${response.body}');
      }
    } catch (e) {
      debugPrint('Registration error: $e');
      rethrow;
    }
  }

  @override
  Future<void> logout() async {
    _accessToken = null;
  }
}
