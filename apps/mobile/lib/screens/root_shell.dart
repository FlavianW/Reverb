import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/session.dart';
import 'accueil_screen.dart';
import 'amis_screen.dart';
import 'carte_screen.dart';
import 'fil_screen.dart';
import 'profil_screen.dart';
import 'recherche_screen.dart';

/// Navigation principale une fois connecté : miroir de `AppShell.svelte`
/// (nav du web), adapté en barre de navigation basse pour mobile.
class RootShell extends StatefulWidget {
  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pseudo = context.watch<SessionController>().user!.pseudo;

    final screens = [
      const AccueilScreen(),
      const FilScreen(),
      const RechercheScreen(),
      const CarteScreen(),
      const AmisScreen(),
      ProfilScreen(pseudo: pseudo),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: screens),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _index,
        onTap: (index) => setState(() => _index = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Accueil',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.dynamic_feed_outlined),
            activeIcon: Icon(Icons.dynamic_feed),
            label: 'Fil',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Recherche'),
          BottomNavigationBarItem(
            icon: Icon(Icons.map_outlined),
            activeIcon: Icon(Icons.map),
            label: 'Carte',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Amis',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
