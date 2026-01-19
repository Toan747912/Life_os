import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../domain/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository}) : super(AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
    on<RegisterRequested>(_onRegisterRequested);
    on<LogoutRequested>(_onLogoutRequested);
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await authRepository.login(event.email, event.password);
      emit(const Authenticated());
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }

  Future<void> _onRegisterRequested(
    RegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await authRepository.register(
        event.email,
        event.password,
        event.displayName,
      );
      // Automatically login after register or just notify success
      // For now, let's treat it as authenticated or ask to login.
      // Plan said "Verify success (navigate to Home)".
      // Since repo.register optionally auto-logins or we can just emit Authenticated if we trust it.
      // But typically we should login to get the token.

      // Let's attempt login immediately for smooth UX
      await authRepository.login(event.email, event.password);
      emit(const Authenticated());
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }

  void _onLogoutRequested(LogoutRequested event, Emitter<AuthState> emit) {
    authRepository.logout();
    emit(Unauthenticated());
  }
}
