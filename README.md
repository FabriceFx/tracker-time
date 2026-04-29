# ⏱️ Tracker Time — Suivi du temps Google Sheets

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google-apps-script&logoColor=white)](https://developers.google.com/apps-script)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0-blue.svg?style=for-the-badge)](https://github.com/fabricefx/tracker-time)

**Tracker Time** est une solution légère et intégrée pour Google Sheets permettant de chronométrer vos tâches professionnelles en temps réel. Conçu pour simplifier la saisie des feuilles de temps (type Planview), il automatise la ventilation des heures par projet et l'envoi de rapports quotidiens.

## ✨ Fonctionnalités

* **Chronomètre Intégré** : Sidebar interactive pour lancer/arrêter le suivi d'une tâche.
* **Saisie Manuelle** : Formulaire rapide pour ajouter des heures a posteriori.
* **Gestion des Quotas** : Calcul automatique des heures restantes selon un objectif journalier configurable.
* **Rapports Automatiques** : Envoi d'un e-mail récapitulatif HTML dès que l'objectif quotidien est atteint.
* **Vue Hebdomadaire** : Visualisation de la progression de la semaine directement dans l'interface.
* **Multi-plateforme** : Interface Web App responsive adaptée aux navigateurs mobiles.
* **Raccourcis Clavier** : `Espace` pour Start/Stop et `P` pour Pause.

## 🚀 Installation & Configuration

### 1. Préparation du Google Sheet
1. Créez une nouvelle feuille Google Sheets.
2. Accédez à **Extensions** > **Apps Script**.

### 2. Copie du Code
1. Créez un fichier `Code.gs` et collez-y le contenu du script.
2. Créez un fichier `index.html` et collez-y le code de l'interface.
3. Enregistrez le projet.

### 3. Initialisation
1. Actualisez votre feuille de calcul. Un menu **⏱️ Minuteur** apparaît.
2. Cliquez sur **Minuteur** > **Ouvrir le suivi**. Les onglets `Config`, `Journal` et `Paramètres` seront créés automatiquement.

### 4. Configuration des Projets
* Dans l'onglet **Config**, listez vos couples `Projet` / `Tâche`.
* Dans l'onglet **Paramètres**, définissez vos heures cibles par jour (ex: Lundi = 8).

## 🛠 Technologies utilisées

* **Backend** : Google Apps Script (V8 Engine).
* **Frontend** : HTML5, CSS3 (variables, Flexbox, Animations), JavaScript (ES6).
* **Design** : Material Icons Round & Police Google Fonts "Inter".
* **Services Google** : SpreadsheetApp, MailApp, PropertiesService, LockService.

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

# ⏱️ Tracker Time — Google Sheets Time Tracker

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google-apps-script&logoColor=white)](https://developers.google.com/apps-script)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0-blue.svg?style=for-the-badge)](https://github.com/fabricefx/tracker-time)

**Tracker Time** is a lightweight, integrated solution for Google Sheets to track professional tasks in real-time. Designed to simplify timesheet entries (like Planview), it automates hour breakdown by project and sends daily email reports.

## ✨ Features

* **Integrated Timer**: Interactive sidebar to start/stop tracking a task.
* **Manual Entry**: Quick form to add hours retrospectively.
* **Quota Management**: Automatic calculation of remaining hours based on a configurable daily goal.
* **Automatic Reports**: Sends an HTML summary email once the daily goal is reached.
* **Weekly View**: Visualize the week's progress directly within the interface.
* **Multi-platform**: Responsive Web App interface suitable for mobile browsers.
* **Keyboard Shortcuts**: `Space` for Start/Stop and `P` for Pause.

## 🚀 Installation & Setup

### 1. Google Sheet Preparation
1. Create a new Google Sheet.
2. Go to **Extensions** > **Apps Script**.

### 2. Code Copy
1. Create a `Code.gs` file and paste the script content.
2. Create an `index.html` file and paste the interface code.
3. Save the project.

### 3. Initialization
1. Refresh your spreadsheet. A **⏱️ Minuteur** (Timer) menu will appear.
2. Click **Minuteur** > **Ouvrir le suivi**. The `Config`, `Journal`, and `Paramètres` tabs will be created automatically.

### 4. Project Configuration
* In the **Config** tab, list your `Project` / `Task` pairs.
* In the **Paramètres** (Settings) tab, set your target hours per day (e.g., Monday = 8).

## 🛠 Tech Stack

* **Backend**: Google Apps Script (V8 Engine).
* **Frontend**: HTML5, CSS3 (Variables, Flexbox, Animations), JavaScript (ES6).
* **Design**: Material Icons Round & Google Fonts "Inter".
* **Google Services**: SpreadsheetApp, MailApp, PropertiesService, LockService.

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
