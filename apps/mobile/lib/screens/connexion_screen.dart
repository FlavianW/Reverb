import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
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
  /// Ouvre sur le formulaire d'inscription plutôt que de connexion : réservé
  /// au tout premier lancement de l'app (voir `main.dart`), où « Bon retour
  /// parmi nous » n'aurait pas de sens pour quelqu'un qui n'est jamais venu.
  final bool initialSignup;

  const ConnexionScreen({super.key, this.initialSignup = false});

  @override
  State<ConnexionScreen> createState() => _ConnexionScreenState();
}

/// Mirroir de `PASSWORD_REQUIREMENTS` (`packages/shared/src/requests/auth.ts`),
/// affiché comme prérequis pendant la saisie et appliqué côté API dans
/// `RegisterDto` - source de vérité pour la validation, jamais dupliquée ici.
const _passwordRequirements = <(String label, bool Function(String) test)>[
  ('Au moins 8 caractères', _hasMinLength),
  ('Une majuscule', _hasUppercase),
  ('Une minuscule', _hasLowercase),
  ('Un chiffre', _hasDigit),
  ('Un caractère spécial', _hasSpecialChar),
];

bool _hasMinLength(String value) => value.length >= 8;
bool _hasUppercase(String value) => value.contains(RegExp('[A-Z]'));
bool _hasLowercase(String value) => value.contains(RegExp('[a-z]'));
bool _hasDigit(String value) => value.contains(RegExp('[0-9]'));
bool _hasSpecialChar(String value) => value.contains(RegExp('[^a-zA-Z0-9]'));

class _ConnexionScreenState extends State<ConnexionScreen> {
  late bool isSignup = widget.initialSignup;
  final _pseudoController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? error;
  bool submitting = false;
  bool googleSubmitting = false;

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _pseudoController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  bool get _passwordMeetsRequirements => _passwordRequirements.every(
    (requirement) => requirement.$2(_passwordController.text),
  );

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
        debugPrint('GoogleSignInException: code=${e.code} description=${e.description} details=${e.details}');
        setState(() => error = 'La connexion Google a échoué (${e.code}).');
      }
    } on ApiException catch (e) {
      debugPrint('ApiException lors de la connexion Google : ${e.status} ${e.message}');
      setState(() => error = e.message);
    } catch (e) {
      debugPrint('Erreur inattendue lors de la connexion Google : $e');
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
                    style: TextStyle(
                      color: context.colors.inkSoft,
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
                  if (isSignup) ...[
                    const SizedBox(height: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        for (final requirement in _passwordRequirements)
                          _PasswordRequirementRow(
                            label: requirement.$1,
                            met: requirement.$2(_passwordController.text),
                          ),
                      ],
                    ),
                  ],
                  if (error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      error!,
                      style: TextStyle(
                        color: context.colors.accentDeep,
                        fontSize: 14,
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed:
                          busy || (isSignup && !_passwordMeetsRequirements)
                          ? null
                          : _submit,
                      child: Text(
                        isSignup ? 'Créer mon compte' : 'Se connecter',
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: Divider(color: context.colors.line)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'ou',
                          style: TextStyle(
                            color: context.colors.inkSoft,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      Expanded(child: Divider(color: context.colors.line)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: busy ? null : _submitGoogle,
                      icon: SvgPicture.asset(
                        'assets/google_logo.svg',
                        width: 18,
                        height: 18,
                      ),
                      label: Text(
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
                          style: TextStyle(
                            color: context.colors.inkSoft,
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

/// Ligne d'un prérequis de mot de passe : icône + libellé, jamais la couleur
/// seule pour porter l'état (accessibilité, miroir de `LoginSignupForm.svelte`).
class _PasswordRequirementRow extends StatelessWidget {
  final String label;
  final bool met;

  const _PasswordRequirementRow({required this.label, required this.met});

  @override
  Widget build(BuildContext context) {
    final color = met ? context.colors.ink : context.colors.inkSoft;
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            met ? Icons.check_circle : Icons.circle_outlined,
            size: 14,
            color: color,
          ),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 13, color: color)),
        ],
      ),
    );
  }
}
