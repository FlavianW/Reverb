import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/session.dart';
import '../core/theme.dart';

/// Miroir de `apps/web/src/lib/components/auth/LoginSignupForm.svelte`.
/// La connexion Google OAuth du web (redirection navigateur vers
/// `/auth/google`) n'a pas d'équivalent direct côté mobile sans backend
/// dédié (retour par deep link) — hors périmètre de cette première ossature,
/// seule l'authentification email/mot de passe est proposée ici.
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

  @override
  Widget build(BuildContext context) {
    final title = isSignup ? 'Rejoindre Reverb' : 'Bon retour parmi nous';
    final subtitle = isSignup
        ? 'Créez votre compte pour garder le souvenir de chaque concert.'
        : 'Retrouvez vos concerts et vos discussions.';

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
                  Text(title, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 30)),
                  const SizedBox(height: 8),
                  Text(subtitle, style: const TextStyle(color: ReverbColors.inkSoft, fontSize: 15)),
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
                    decoration: const InputDecoration(labelText: 'Adresse e-mail', hintText: 'vous@exemple.com'),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passwordController,
                    decoration: const InputDecoration(labelText: 'Mot de passe', hintText: '••••••••'),
                    obscureText: true,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => submitting ? null : _submit(),
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 12),
                    Text(error!, style: const TextStyle(color: ReverbColors.accentDeep, fontSize: 14)),
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: submitting ? null : _submit,
                      child: Text(isSignup ? 'Créer mon compte' : 'Se connecter'),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?', style: const TextStyle(color: ReverbColors.inkSoft, fontSize: 14)),
                        TextButton(
                          onPressed: () => setState(() {
                            isSignup = !isSignup;
                            error = null;
                          }),
                          child: Text(isSignup ? 'Se connecter' : 'Créer un compte'),
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
