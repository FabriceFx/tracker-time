# 📦 Tracker Time — Suivi du temps Google Sheets (v2.2.0)

[🇫🇷 Version Française](#-version-française) | [🇬🇧 English Version](#-english-version)

---

## 🇫🇷 Version Française

> Tracker Time est une solution complète, sécurisée et intégrée pour Google Sheets permettant de chronométrer vos tâches professionnelles en temps réel. Il automatise la ventilation des heures par projet, s'adapte à vos horaires et vous notifie par e-mail.

<a href="https://developers.google.com/apps-script"><img src="https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google-apps-script&logoColor=white" alt="Google Apps Script"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-indigo?style=for-the-badge" alt="License: MIT"></a>
<a href="README.md"><img src="https://img.shields.io/badge/Status-Production-emerald?style=for-the-badge" alt="Status: Production"></a>

---

### ✨ Fonctionnalités Clés

- ⏱️ **Chronomètre Interactif** : Lancez, mettez en pause et arrêtez le temps passé sur une tâche directement depuis le panneau latéral.
- 🔢 **Saisie Manuelle (Stepper)** : Formulaire intuitif avec boutons **+/−** pour ajuster la durée par paliers de 15 minutes.
- ➖ **Soustraction de Temps** : Entrez une valeur négative pour corriger ou retirer du temps déjà saisi (bloqué à zéro minimum).
- ⚙️ **Auto-Configuration** : Génère automatiquement les onglets requis (`Config`, `Journal`, `Paramètres`) lors du tout premier démarrage.
- 📅 **Horaires Cibles Dynamiques** : Fixez un objectif d'heures différent pour chaque jour de la semaine.
- 📧 **Rapports par E-mail** : Envoi automatique d'un bilan HTML soigné dès que votre quota d'heures quotidien est atteint, et bilan de synthèse le vendredi à 18h.
- 📊 **Jauge SVG Circulaire** : Visualisation claire et animée de votre avancement quotidien dans la sidebar.
- 🔒 **Sécurité XSS & Concurrence** : Échappement des caractères utilisateur dans le code et les e-mails, et gestion des accès simultanés via `LockService`.

---

### 🚀 Installation & Configuration

1. Ouvrez un fichier Google Sheets.
2. Accédez à **Extensions > Apps Script**.
3. Créez les fichiers de script (.gs) suivants et collez-y leur contenu respectif :
   * **[Code.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Code.gs)**
   * **[Config.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Config.gs)**
   * **[Utils.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Utils.gs)**
4. Créez les fichiers HTML suivants (Fichier > Nouveau > HTML) et collez-y leur contenu respectif :
   * **[Sidebar.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Sidebar.html)** (l'interface)
   * **[Stylesheet.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Stylesheet.html)** (les styles CSS)
   * **[JavaScript.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/JavaScript.html)** (la logique client JS)
5. Sauvegardez le projet et actualisez la page de votre feuille Google Sheets. Un nouveau menu **"⏱️ Minuteur"** apparaît dans votre feuille !

---

### 📖 Raccourcis Clavier & Menu

*   **Espace** : Lancer / Arrêter le chronomètre.
*   **P** : Mettre en pause le chronomètre.
*   **Menu Apps Script** :
    *   *Ouvrir le suivi* : Ouvre la barre latérale.
    *   *Ajouter 30min à la sélection* : Ajoute 0.5h à la ligne sélectionnée dans le journal.
    *   *Fusionner les doublons du jour* : Combine automatiquement les lignes identiques du jour.

---

### 🛠️ Architecture du Projet

Le projet a été modularisé sous forme de fichiers spécialisés conformément aux normes de développement moderne de FF Labs :

- **[Code.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Code.gs)** : Orchestration principale côté serveur (menu Sheets, routes GET et déclencheurs).
- **[Config.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Config.gs)** : Fichier de configuration centralisant les constantes structurelles et le logger unifié.
- **[Utils.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Utils.gs)** : Fonctions utilitaires serveurs (calculs de quotas, conversion de dates, include HTML).
- **[Sidebar.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Sidebar.html)** : Structure HTML de l'interface utilisateur sémantique intégrant les icônes SVG en ligne.
- **[Stylesheet.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Stylesheet.html)** : Styles CSS modernes, gérant les tokens de design MD3 et le thème sombre automatique.
- **[JavaScript.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/JavaScript.html)** : Logique Javascript applicative côté client (IIFE App, chronomètre, persistance locale, raccourcis).

---

### 👤 Auteur

- **[Fabrice Faucheux](https://faucheux.bzh)** (FF Labs) - [GitHub](https://github.com/FabriceFx)

---

### 📄 Licence

Ce projet est disponible sous licence **MIT**. Pour plus d'informations, veuillez consulter le fichier [LICENSE](LICENSE).

---

## 🇬🇧 English Version

> Tracker Time is a comprehensive, secure, and integrated solution for Google Sheets to track your professional tasks in real-time. It automates hour breakdown by project, adapts to your schedules, and alerts you by email.

<a href="https://developers.google.com/apps-script"><img src="https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google-apps-script&logoColor=white" alt="Google Apps Script"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-indigo?style=for-the-badge" alt="License: MIT"></a>

---

### ✨ Key Features

- ⏱️ **Interactive Timer**: Start, pause, and stop tracking time on any task directly from the sidebar.
- 🔢 **Manual Entry (Stepper)**: Intuitive form with **+/−** buttons to adjust logged hours in 15-minute increments.
- ➖ **Time Subtraction**: Support for negative values to correct or subtract previously logged hours (zero-minimum limit).
- ⚙️ **Auto-Setup**: Generates required sheets (`Config`, `Journal`, `Paramètres`) automatically on first launch.
- 📅 **Dynamic Hour Goals**: Define custom target goals individually for each day of the week.
- 📧 **Email Summaries**: Automatically dispatches a clean HTML recap email as soon as your daily target is met, plus a Friday 6 PM review.
- 📊 **SVG Progress Gauge**: Clear, animated circular tracking gauge displayed in real-time in the sidebar.
- 🔒 **XSS Shield & Concurrency**: Sanitizes all entries in HTML and email, and guarantees data integrity via Google's `LockService`.

---

### 🚀 Installation & Setup

1. Open any Google Spreadsheet.
2. Select **Extensions > Apps Script**.
3. Create the following script files (.gs) and paste their respective contents:
   * **[Code.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Code.gs)**
   * **[Config.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Config.gs)**
   * **[Utils.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Utils.gs)**
4. Create the following HTML files (File > New > HTML) and paste their respective contents:
   * **[Sidebar.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Sidebar.html)** (the layout structure)
   * **[Stylesheet.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Stylesheet.html)** (the CSS styling)
   * **[JavaScript.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/JavaScript.html)** (the client JS logic)
5. Save the project and refresh your Google Sheets tab. A new **"⏱️ Minuteur"** menu item will appear!

---

### 📖 Keyboard Shortcuts & Options

*   **Spacebar**: Start / Stop the running timer.
*   **P Key**: Pause the timer.
*   **Menu Reference**:
    *   *Open Tracker*: Displays the sidebar panel.
    *   *Add 30min to Selection*: Appends 0.5h directly on selected sheet rows.
    *   *Merge Duplicates*: Groups similar entries of the day into a single row.

---

### 🛠️ Project Structure

The project has been modularized into highly focused files following modern developer standards:

- **[Code.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Code.gs)**: Main server orchestrator (custom menu, web app entrypoint, triggers).
- **[Config.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Config.gs)**: Central configuration parameters, constant scopes, and unified logging.
- **[Utils.gs](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Utils.gs)**: Apps Script server helper library (date parsing, day index lookups, HTML imports).
- **[Sidebar.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Sidebar.html)**: Symmetrical interface layouts embedding pure inline SVGs assets.
- **[Stylesheet.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/Stylesheet.html)**: Clean, high-fidelity CSS declarations wrapping MD3 colors and dark mode assets.
- **[JavaScript.html](file:///Users/fabrice/Documents/Mes%20développements/Suivi%20des%20temps/JavaScript.html)**: Client-side JS implementation (timer state management, persistence, keyboard triggers).

---

### 👤 Author

- **[Fabrice Faucheux](https://faucheux.bzh)** (FF Labs) - [GitHub](https://github.com/FabriceFx)

---

### 📄 License

This project is licensed under the terms of the **MIT License**.

---
<p align="center"><a href="https://faucheux.bzh" target="_blank" style="color: inherit; text-decoration: none;">&lt;&gt; par Fabrice Faucheux</a></p>
