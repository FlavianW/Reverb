import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/google_auth_config.dart';
import '../core/session.dart';
import '../core/theme.dart';

/// `GoogleSignIn.instance.initialize` ne doit être appelé qu'une seule fois
/// par processus (comportement non défini sinon) — mis en cache ici plutôt
/// que dans `initState`, qui se réexécuterait à chaque remontage de l'écran
/// (ex. reconnexion après déconnexion).
Future<void>? _googleSignInInitFuture;

Future<void> _ensureGoogleSignInInitialized() {
  return _googleSignInInitFuture ??= GoogleSignIn.instance.initialize(
    serverClientId: kGoogleServerClientId,
  );
}

/// Miroir de `apps/web/src/lib/components/auth/LoginSignupForm.svelte`.
class ConnexionScreen extends StatefulWidget {
  const ConnexionScreen({super.key});

  @override
  State<ConnexionScreen> createState() => _ConnexionScreenState();
}

class _ConnexionScreenState extends State<ConnexionScreen> {
  bool isSignup = false;
  final _pseudoController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? error;
  bool submitting = false;
  bool googleSubmitting = false;

  @override
  void dispose() {
    _pseudoController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      submitting = true;
      error = null;
    });
    final session = context.read<SessionController>();
    try {
      if (isSignup) {
        await session.register(
          email: _emailController.text,
          password: _passwordController.text,
          pseudo: _pseudoController.text,
        );
      } else {
        await session.login(
          email: _emailController.text,
          password: _passwordController.text,
        );
      }
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } catch (_) {
      setState(() => error = 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  Future<void> _submitGoogle() async {
    setState(() {
      googleSubmitting = true;
      error = null;
    });
    final session = context.read<SessionController>();
    try {
      await _ensureGoogleSignInInitialized();
      final account = await GoogleSignIn.instance.authenticate();
      final idToken = account.authentication.idToken;
      if (idToken == null) {
        throw Exception('Google n’a renvoyé aucun ID token.');
      }
      await session.loginWithGoogle(idToken);
    } on GoogleSignInException catch (e) {
      // L'utilisateur a simplement annulé : pas d'erreur à afficher.
      if (e.code != GoogleSignInExceptionCode.canceled) {
        setState(() => error = 'La connexion Google a échoué.');
      }
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } catch (_) {
      setState(() => error = 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      if (mounted) setState(() => googleSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = isSignup ? 'Rejoindre Reverb' : 'Bon retour parmi nous';
    final subtitle = isSignup
        ? 'Créez votre compte pour garder le souvenir de chaque concert.'
        : 'Retrouvez vos concerts et vos discussions.';
    final busy = submitting || googleSubmitting;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 380),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: Theme.of(
                      context,
                    ).textTheme.headlineMedium?.copyWith(fontSize: 30),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: ReverbColors.inkSoft,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 32),
                  if (isSignup) ...[
                    TextField(
                      controller: _pseudoController,
                      decoration: const InputDecoration(labelText: 'Pseudo'),
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: 16),
                  ],
                  TextField(
                    controller: _emailController,
                    decoration: const InputDecoration(
                      labelText: 'Adresse e-mail',
                      hintText: 'vous@exemple.com',
                    ),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passwordController,
                    decoration: const InputDecoration(
                      labelText: 'Mot de passe',
                      hintText: '••••••••',
                    ),
                    obscureText: true,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => busy ? null : _submit(),
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      error!,
                      style: const TextStyle(
                        color: ReverbColors.accentDeep,
                        fontSize: 14,
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: busy ? null : _submit,
                      child: Text(
                        isSignup ? 'Créer mon compte' : 'Se connecter',
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: const [
                      Expanded(child: Divider(color: ReverbColors.line)),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'ou',
                          style: TextStyle(
                            color: ReverbColors.inkSoft,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      Expanded(child: Divider(color: ReverbColors.line)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: busy ? null : _submitGoogle,
                      child: Text(
                        googleSubmitting
                            ? 'Connexion…'
                            : 'Continuer avec Google',
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          isSignup
                              ? 'Déjà un compte ?'
                              : 'Pas encore de compte ?',
                          style: const TextStyle(
                            color: ReverbColors.inkSoft,
                            fontSize: 14,
                          ),
                        ),
                        TextButton(
                          onPressed: () => setState(() {
                            isSignup = !isSignup;
                            error = null;
                          }),
                          child: Text(
                            isSignup ? 'Se connecter' : 'Créer un compte',
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
