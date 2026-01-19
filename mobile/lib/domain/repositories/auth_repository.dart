abstract class AuthRepository {
  Future<void> login(String email, String password);
  Future<void> register(String email, String password, String displayName);
  Future<void> logout();
  String? get accessToken;
  // Future<User> getCurrentUser(); // For later
}
