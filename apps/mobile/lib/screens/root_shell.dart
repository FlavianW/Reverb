import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/session.dart';
import 'accueil_screen.dart';
import 'amis_screen.dart';
import 'carte_screen.dart';
import 'fil_screen.dart';
import 'messages_screen.dart';
import 'profil_screen.dart';
import 'recherche_screen.dart';

const _messagesTabIndex = 4;

/// Navigation principale une fois connecté : miroir de `AppShell.svelte`
/// (nav du web), adapté en barre de navigation basse pour mobile.
class RootShell extends StatefulWidget {
  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int _index = 0;
  int _unreadCount = 0;
  final _messagesKey = GlobalKey<MessagesScreenState>();

  @override
  void initState() {
    super.initState();
    _refreshUnreadCount();
  }

  Future<void> _refreshUnreadCount() async {
    final count = await context.read<ApiClient>().getUnreadCount();
    if (!mounted) return;
    setState(() => _unreadCount = count);
  }

  void _onTap(int index) {
    setState(() => _index = index);
    if (index == _messagesTabIndex) {
      _messagesKey.currentState?.reload();
      _refreshUnreadCount();
    }
  }

  @override
  Widget build(BuildContext context) {
    final pseudo = context.watch<SessionController>().user!.pseudo;

    final screens = [
      AccueilScreen(
        onOpenFil: () => setState(() => _index = 1),
        onOpenCarte: () => setState(() => _index = 3),
      ),
      const FilScreen(),
      const RechercheScreen(),
      const CarteScreen(),
      MessagesScreen(key: _messagesKey, onConversationRead: _refreshUnreadCount),
      const AmisScreen(),
      ProfilScreen(pseudo: pseudo),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: screens),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _index,
        onTap: _onTap,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Accueil',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.dynamic_feed_outlined),
            activeIcon: Icon(Icons.dynamic_feed),
            label: 'Fil',
          ),
          const BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Recherche'),
          const BottomNavigationBarItem(
            icon: Icon(Icons.map_outlined),
            activeIcon: Icon(Icons.map),
            label: 'Carte',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              isLabelVisible: _unreadCount > 0,
              label: Text('$_unreadCount'),
              child: const Icon(Icons.mail_outline),
            ),
            activeIcon: Badge(
              isLabelVisible: _unreadCount > 0,
              label: Text('$_unreadCount'),
              child: const Icon(Icons.mail),
            ),
            label: 'Messages',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Amis',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
