# ⏱️ Tracker Time — Suivi du temps Google Sheets (v2.0)

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google-apps-script&logoColor=white)](https://developers.google.com/apps-script)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0-blue.svg?style=for-the-badge)](https://github.com/fabricefx/tracker-time)
[![Website](https://img.shields.io/badge/Website-faucheux.bzh-0052cc?style=for-the-badge)](https://faucheux.bzh)

**Tracker Time** est une solution complète, sécurisée et intégrée pour Google Sheets permettant de chronométrer vos tâches professionnelles en temps réel. Conçu pour simplifier la saisie des feuilles de temps (type Planview), il automatise la ventilation des heures par projet, s'adapte à vos horaires quotidiens, et vous notifie automatiquement lorsque votre journée de travail est terminée.

Développé par **Fabrice Faucheux** — [https://faucheux.bzh](https://faucheux.bzh)

---

## ✨ Fonctionnalités clés

### 🎯 Suivi et saisie
* **Chronomètre Interactif** : Lancez, mettez en pause et arrêtez le temps passé sur une tâche directement depuis la barre latérale.
* **Saisie manuelle** : Ajoutez des heures a posteriori via un formulaire simple.
* **Ajout rapide** : Menu personnalisé pour ajouter facilement 30 minutes à une ligne existante dans le journal.
* **Cumul intelligent** : Les saisies pour le même projet et la même tâche le même jour sont automatiquement fusionnées sur une seule ligne.

### ⚙️ Automatisation & personnalisation
* **Auto-configuration** : Les onglets nécessaires (`Config`, `Journal`, `Paramètres`) sont créés automatiquement s'ils n'existent pas lors du premier lancement.
* **Horaires dynamiques** : Définissez un nombre d'heures cible différent pour chaque jour de la semaine (ex: 8h du Lundi au Jeudi, 7h le Vendredi).
* **Rapports automatisés** : Un e-mail récapitulatif HTML détaillé est envoyé *une seule fois* de façon automatique dès que votre quota d'heures du jour est atteint.

### 🖥️ Expérience utilisateur (UX)
* **Jauge de progression** : Visualisation claire et en temps réel de votre avancement quotidien via une jauge circulaire SVG dynamique.
* **Rapport hebdomadaire** : Consultez le total de vos heures et la répartition sur la semaine en cours directement depuis la sidebar.
* **Mode sombre** : L'interface s'adapte automatiquement au thème clair/sombre de votre système (Dark Mode).
* **Raccourcis clavier** : Appuyez sur `Espace` pour Lancer/Arrêter, et sur `P` pour mettre en Pause.
* **Bilingue (i18n)** : L'interface s'affiche automatiquement en Français ou en Anglais selon les paramètres régionaux de votre compte Google.

### 🔒 Robustesse & sécurité
* **Protection XSS** : Toutes les entrées et listes déroulantes sont assainies pour prévenir les failles de sécurité.
* **Persistance (LocalStorage)** : Votre chronomètre continue de tourner en arrière-plan et survit aux rafraîchissements de la page.
* **Gestion de la concurrence** : Utilisation du `LockService` de Google pour garantir l'intégrité des données si plusieurs requêtes sont lancées simultanément.

---

## 🚀 Installation & déploiement

### 1. Préparation du Google Sheet
1. Créez un nouveau fichier Google Sheets.
2. Allez dans **Extensions** > **Apps Script**.

### 2. Copie du code
1. Dans l'éditeur, collez le contenu du fichier `Code.gs`.
2. Créez un fichier HTML nommé `index.html` et collez-y le code de l'interface.
3. Enregistrez le projet.

### 3. Initialisation
1. Retournez sur votre feuille de calcul et rafraîchissez la page (`F5`).
2. Un menu **⏱️ Minuteur** apparaîtra dans la barre de menu.
3. Cliquez sur **Minuteur** > **Ouvrir le suivi**.
4. Les onglets `Config`, `Journal` et `Paramètres` seront créés automatiquement avec les bonnes en-têtes.

### 4. Configuration (Optionnel)
* Dans l'onglet **Config**, ajoutez vos couples `Projet` / `Tâche`.
* Dans l'onglet **Paramètres**, ajustez vos objectifs d'heures pour chaque jour de la semaine.

### 5. Utilisation sur mobile (Web App)
Pour utiliser le traqueur depuis votre smartphone :
1. Dans Apps Script, cliquez sur **Déployer** > **Nouvelle application web**.
2. Exécuter en tant que : *Moi*.
3. Accès : *Toute personne ayant le lien* (ou juste vous).
4. Déployez et copiez l'URL fournie pour y accéder depuis le navigateur de votre téléphone.

---

## 🛠 Technologies & architecture

* **Backend** : Google Apps Script (V8).
* **Frontend** : HTML5, CSS3 (Variables, Flexbox, UI Material 3 adaptative), Vanilla JS (ES6).
* **Design** : Material Icons Round, Police Google "Inter", SVG pour la data-visualisation.
* **API Google** : `SpreadsheetApp`, `MailApp`, `PropertiesService` (pour éviter les e-mails en double), `LockService`.

---

## 📄 Licence
Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

<br><br>

---
---

# ⏱️ Tracker Time — Google Sheets Time Tracker (v2.0)

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google-apps-script&logoColor=white)](https://developers.google.com/apps-script)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0-blue.svg?style=for-the-badge)](https://github.com/fabricefx/tracker-time)
[![Website](https://img.shields.io/badge/Website-faucheux.bzh-0052cc?style=for-the-badge)](https://faucheux.bzh)

**Tracker Time** is a comprehensive, secure, and integrated solution for Google Sheets to track your professional tasks in real-time. Designed to simplify timesheet entries, it automates hour breakdown by project, adapts to your daily schedules, and automatically notifies you when your workday goal is met.

Developed by **Fabrice Faucheux** — [https://faucheux.bzh](https://faucheux.bzh)

---

## ✨ Key Features

### 🎯 Tracking & Entry
* **Interactive Timer**: Start, pause, and stop tracking time on a task directly from the sidebar.
* **Manual Entry**: Add hours retrospectively using a quick form.
* **Quick Add**: Custom menu option to easily add 30 minutes to an existing log entry.
* **Smart Accumulation**: Entries for the same project and task on the same day are automatically merged into a single row.

### ⚙️ Automation & Customization
* **Auto-setup**: Required tabs (`Config`, `Journal`, `Paramètres`) are automatically created if they don't exist on first launch.
* **Dynamic Schedules**: Define a different target hour goal for each day of the week (e.g., 8h Mon-Thu, 7h on Friday).
* **Automated Reports**: A detailed HTML summary email is sent *only once* automatically as soon as your daily hour quota is reached.

### 🖥️ User Experience (UX)
* **Progress Gauge**: Clear, real-time visualization of your daily progress via a dynamic SVG circular gauge.
* **Weekly Report**: View your total hours and breakdown for the current week directly in the sidebar.
* **Dark Mode**: The interface automatically adapts to your system's light/dark theme preference.
* **Keyboard Shortcuts**: Press `Space` to Start/Stop, and `P` to Pause.
* **Bilingual (i18n)**: The interface automatically displays in French or English based on your Google account's locale settings.

### 🔒 Robustness & Security
* **XSS Protection**: All inputs and dropdowns are sanitized to prevent security vulnerabilities.
* **Persistence (LocalStorage)**: Your timer keeps running in the background and survives page refreshes.
* **Concurrency Management**: Uses Google's `LockService` to ensure data integrity if multiple requests are made simultaneously.

---

## 🚀 Installation & Deployment

### 1. Google Sheet Preparation
1. Create a new Google Sheets file.
2. Go to **Extensions** > **Apps Script**.

### 2. Code Copy
1. In the editor, paste the contents of the `Code.gs` file.
2. Create an HTML file named `index.html` and paste the interface code.
3. Save the project.

### 3. Initialization
1. Return to your spreadsheet and refresh the page (`F5`).
2. A **⏱️ Timer** menu will appear in the menu bar.
3. Click **Timer** > **Open Tracker**.
4. The `Config`, `Journal`, and `Paramètres` tabs will be created automatically with the correct headers.

### 4. Configuration (Optional)
* In the **Config** tab, add your `Project` / `Task` pairs.
* In the **Paramètres** (Settings) tab, adjust your target hours for each day of the week.

### 5. Mobile Use (Web App)
To use the tracker from your smartphone:
1. In Apps Script, click **Deploy** > **New deployment**.
2. Execute as: *Me*.
3. Who has access: *Anyone with the link* (or just you).
4. Deploy and copy the provided URL to access it from your phone's browser.

---

## 🛠 Tech Stack & Architecture

* **Backend**: Google Apps Script (V8).
* **Frontend**: HTML5, CSS3 (Variables, Flexbox, Adaptive Material 3 UI), Vanilla JS (ES6).
* **Design**: Material Icons Round, Google "Inter" font, SVG for data visualization.
* **Google APIs**: `SpreadsheetApp`, `MailApp`, `PropertiesService` (to prevent duplicate emails), `LockService`.

---

## 📄 License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
