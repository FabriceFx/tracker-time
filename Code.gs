/**
 * ============================================================
 *  TRAQUEUR DE TEMPS — Google Apps Script
 * ============================================================
 *  Auteur      : Fabrice Faucheux
 *  Description : Sidebar et Web App de suivi du temps de travail
 *                intégrée à Google Sheets. Permet de chronomé-
 *                trer des tâches par projet, de les enregistrer
 *                dans un Journal, et de recevoir un rapport par
 *                e-mail dès que l'objectif quotidien est atteint.
 *  Onglets     : Config (projets/tâches), Journal (saisies),
 *                Paramètres (heures/jour configurables)
 *  Version     : 2.0
 * ============================================================
 */

/**
 * ============================================================
 *  CONFIGURATION GLOBALE
 * ============================================================
 */

/** @const {number} Nombre d'heures journalières par défaut (fallback si aucune config dans Paramètres) */
const DEFAULT_BASE_HOURS = 8;

/** @const {Array<string>} Noms des jours en français, indexés comme Date.getDay() (0=Dimanche) */
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/**
 * Retourne le nombre d'heures-base configuré pour le jour en cours.
 *
 * Lit l'onglet « Paramètres » (colonnes Jour / Heures) et cherche
 * la ligne correspondant au jour de la semaine actuel (ex: Lundi → 8).
 * Si l'onglet est absent ou vide, renvoie DEFAULT_BASE_HOURS.
 *
 * @return {number} Nombre d'heures cibles pour aujourd'hui
 * @private
 */
const getBaseHoursToday_ = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Paramètres');
  if (!sheet || sheet.getLastRow() < 2) return DEFAULT_BASE_HOURS;

  const now = new Date();
  const tz = ss.getSpreadsheetTimeZone();
  const dayIndex = parseInt(Utilities.formatDate(now, tz, 'u')); // 1=lun...7=dim (ISO)
  const dayName = DAYS_FR[dayIndex === 7 ? 0 : dayIndex]; // convertir en index DAYS_FR

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  for (const [jour, heures] of data) {
    if (String(jour).trim().toLowerCase() === dayName.toLowerCase()) {
      const h = parseFloat(heures);
      return (isNaN(h) || h <= 0) ? DEFAULT_BASE_HOURS : h;
    }
  }
  return DEFAULT_BASE_HOURS;
};

/**
 * Retourne le nombre d'heures-base configuré pour une date donnée.
 *
 * Identique à getBaseHoursToday_() mais accepte n'importe quelle Date.
 * Utilisé par le rapport hebdomadaire pour afficher la cible de chaque jour.
 *
 * @param {Date} date - La date pour laquelle récupérer la base horaire
 * @return {number} Nombre d'heures cibles pour ce jour
 * @private
 */
const getBaseHoursForDate_ = (date) => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Paramètres');
  if (!sheet || sheet.getLastRow() < 2) return DEFAULT_BASE_HOURS;

  const tz = ss.getSpreadsheetTimeZone();
  const dayIndex = parseInt(Utilities.formatDate(date, tz, 'u'));
  const dayName = DAYS_FR[dayIndex === 7 ? 0 : dayIndex];

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  for (const [jour, heures] of data) {
    if (String(jour).trim().toLowerCase() === dayName.toLowerCase()) {
      const h = parseFloat(heures);
      return (isNaN(h) || h <= 0) ? DEFAULT_BASE_HOURS : h;
    }
  }
  return DEFAULT_BASE_HOURS;
};

/**
 * Retourne la date du jour au format dd/MM/yyyy.
 *
 * Utilise le fuseau horaire du Spreadsheet (pas celui du serveur Apps Script)
 * pour garantir la cohérence avec les dates stockées dans le Journal.
 *
 * @return {string} Date du jour, ex : "29/04/2026"
 * @private
 */
const getTodayString_ = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd/MM/yyyy');
};

/**
 * Formate une cellule Date en chaîne dd/MM/yyyy.
 *
 * Google Sheets peut stocker les dates sous forme d'objet Date ou de string.
 * Cette fonction normalise les deux cas dans le fuseau du Spreadsheet.
 *
 * @param {Date|string} date - Valeur brute lue depuis getValues()
 * @return {string} Date formatée, ex : "29/04/2026"
 * @private
 */
const formatDateCell_ = (date) => {
  if (date instanceof Date) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return Utilities.formatDate(date, ss.getSpreadsheetTimeZone(), 'dd/MM/yyyy');
  }
  return String(date);
};


/**
 * ============================================================
 *  CRÉATION AUTOMATIQUE DES ONGLETS
 * ============================================================
 */

/**
 * Vérifie et crée automatiquement les onglets nécessaires au fonctionnement.
 *
 * Crée les 3 onglets s'ils sont absents, avec en-têtes formatés,
 * largeurs de colonnes et première ligne figée :
 *   - « Config »     : liste des couples Projet / Tâche disponibles
 *   - « Journal »    : historique de toutes les saisies de temps
 *   - « Paramètres » : nombre d'heures cibles par jour de la semaine
 *
 * Appelé systématiquement à l'ouverture (onOpen) et avant chaque
 * lecture/écriture pour garantir l'intégrité de la structure.
 *
 * @private
 */
const ensureSheets_ = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Onglet Config ---
  if (!ss.getSheetByName('Config')) {
    const s = ss.insertSheet('Config');
    s.getRange('A1:B1').setValues([['Projet', 'Tâche']]);
    s.getRange('A1:B1').setFontWeight('bold').setBackground('#E8DEF8');
    s.setColumnWidth(1, 200);
    s.setColumnWidth(2, 250);
    s.setFrozenRows(1);
  }

  // --- Onglet Journal ---
  if (!ss.getSheetByName('Journal')) {
    const s = ss.insertSheet('Journal');
    s.getRange('A1:E1').setValues([['Date', 'Projet', 'Tâche', 'Heures', 'Jours']]);
    s.getRange('A1:E1').setFontWeight('bold').setBackground('#E8DEF8');
    s.setColumnWidth(1, 110);
    s.setColumnWidth(2, 180);
    s.setColumnWidth(3, 220);
    s.setColumnWidth(4, 80);
    s.setColumnWidth(5, 80);
    s.setFrozenRows(1);
  }

  // --- Onglet Paramètres ---
  if (!ss.getSheetByName('Paramètres')) {
    const s = ss.insertSheet('Paramètres');
    s.getRange('A1:B1').setValues([['Jour', 'Heures']]);
    s.getRange('A1:B1').setFontWeight('bold').setBackground('#E8DEF8');
    const jours = [['Lundi', 8], ['Mardi', 8], ['Mercredi', 8], ['Jeudi', 8], ['Vendredi', 8], ['Samedi', 0], ['Dimanche', 0]];
    s.getRange(2, 1, 7, 2).setValues(jours);
    s.setColumnWidth(1, 120);
    s.setColumnWidth(2, 80);
    s.setFrozenRows(1);
  }
};


/**
 * ============================================================
 *  MENU, SIDEBAR & WEB APP
 * ============================================================
 */

/**
 * Crée le menu « ⏱️ Minuteur » dans la barre de menus Google Sheets.
 *
 * Déclenché automatiquement à l'ouverture du fichier (trigger onOpen).
 * Initialise aussi les onglets via ensureSheets_() si nécessaire.
 *
 * Entrées du menu :
 *   - « Ouvrir le suivi »            → showSidebar()
 *   - « Ajouter 30min à la sélection » → addTimeToSelection()
 */
const onOpen = () => {
  ensureSheets_();
  SpreadsheetApp.getUi()
    .createMenu('⏱️ Minuteur')
    .addItem('Ouvrir le suivi', 'showSidebar')
    .addSeparator()
    .addItem('➕ Ajouter 30min à la sélection', 'addTimeToSelection')
    .addToUi();
};

/**
 * Affiche la sidebar « Traqueur de temps » dans Google Sheets.
 *
 * Le titre de la sidebar est localisé (FR/EN) selon la locale du compte.
 * La largeur est fixée à 320px pour un affichage optimal.
 */
const showSidebar = () => {
  ensureSheets_();
  const locale = getUserLocale();
  const title = locale === 'fr' ? 'Traqueur de temps' : 'Time Tracker';
  const html = HtmlService.createHtmlOutputFromFile('index')
    .setTitle(title)
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
};

/**
 * Point d'entrée Web App — permet l'accès depuis un navigateur mobile.
 *
 * Pour déployer :
 *   Extensions → Apps Script → Déployer → Nouvelle application web
 *   Exécuter en tant que : Moi | Accès : Toute personne avec le lien
 *
 * Ajoute automatiquement la balise viewport pour le responsive mobile
 * et autorise l'intégration dans une iframe (ALLOWALL).
 *
 * @param {Object} e - Événement GET (non utilisé)
 * @return {HtmlOutput} Page HTML servie au navigateur
 */
const doGet = () => {
  ensureSheets_();
  const locale = getUserLocale();
  const title = locale === 'fr' ? 'Traqueur de temps' : 'Time Tracker';
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
};

/**
 * Détecte la langue de l'utilisateur à partir de la locale du Spreadsheet.
 *
 * Lit SpreadsheetApp.getSpreadsheetLocale() (ex: "fr_FR", "en_US") et
 * retourne 'fr' ou 'en'. Utilisé par le frontend (index.html) pour
 * appliquer les traductions via le dictionnaire I18N.
 * En cas d'erreur (compte non connecté, script autonome), retourne 'fr'.
 *
 * @return {string} Code langue : 'fr' ou 'en'
 */
const getUserLocale = () => {
  try {
    const locale = Session.getActiveUser().getEmail() ? 
      SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetLocale() : 'fr_FR';
    return locale.startsWith('fr') ? 'fr' : 'en';
  } catch (e) {
    return 'fr';
  }
};


/**
 * ============================================================
 *  LECTURE DONNÉES (Config & Journal)
 * ============================================================
 */

/**
 * Lit la liste des projets et tâches depuis l'onglet « Config ».
 *
 * Appelé au démarrage de la sidebar pour alimenter les listes déroulantes.
 * Les lignes vides (colonne Projet = "") sont filtrées automatiquement.
 *
 * @return {Array<Array<string>>} Tableau de paires [[projet, tâche], ...]
 */
const getProjectsAndTasks = () => {
  ensureSheets_();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 2)
    .getValues()
    .filter(([project]) => project !== '');
};

/**
 * Retourne les saisies du jour courant pour l'historique de la sidebar.
 *
 * Filtre le Journal sur la date d'aujourd'hui et cumule les heures.
 * Retourne aussi baseHours (objectif du jour) pour mettre à jour la jauge.
 *
 * @return {{ entries: Array<{project: string, task: string, hours: number}>,
 *            totalHours: number,
 *            baseHours: number }}
 */
const getTodayEntries = () => {
  ensureSheets_();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Journal');
  if (sheet.getLastRow() < 2) return { entries: [], totalHours: 0, baseHours: getBaseHoursToday_() };

  const data = sheet.getDataRange().getValues();
  const todayStr = getTodayString_();
  const entries = [];
  let totalHours = 0;

  data.slice(1).forEach(row => {
    if (formatDateCell_(row[0]) === todayStr) {
      const hours = parseFloat(row[3]) || 0;
      entries.push({ project: row[1], task: row[2], hours });
      totalHours += hours;
    }
  });

  return { entries, totalHours, baseHours: getBaseHoursToday_() };
};

/**
 * Calcule le cumul d'heures enregistrées dans le Journal pour une date donnée.
 *
 * Accepte un tableau de données déjà lu (existingData) pour éviter
 * une double lecture du Journal dans saveTimeEntry() — optimisation importante
 * sur les gros fichiers.
 *
 * @param {string} dateStr     - Date au format dd/MM/yyyy
 * @param {Array<Array>=} existingData - Données brutes du Journal (optionnel)
 * @return {number} Total d'heures enregistrées pour ce jour
 * @private
 */
const getTotalHoursForDay_ = (dateStr, existingData) => {
  const data = existingData || SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Journal').getDataRange().getValues();
  return data.slice(1).reduce((total, row) => {
    return (formatDateCell_(row[0]) === dateStr) ? total + (parseFloat(row[3]) || 0) : total;
  }, 0);
};

const getTotalHoursForDay = (dateStr) => getTotalHoursForDay_(dateStr);


/**
 * ============================================================
 *  ÉCRITURE JOURNAL (avec Lock Service)
 * ============================================================
 */

/**
 * Enregistre une saisie de temps dans le Journal.
 *
 * Logique principale :
 *  1. Verrou LockService pour éviter les doublons en cas de double-clic
 *  2. Calcul de la durée disponible (baseHours - total du jour)
 *  3. Si même Projet+Tâche existent aujourd'hui → cumul sur la ligne existante
 *     Sinon → création d'une nouvelle ligne via appendRow()
 *  4. Déclenchement de l'email si le seuil quotidien est atteint
 *
 * @param {{ project: string, task: string, duration: number }} entry
 *   - project  : nom du projet sélectionné
 *   - task     : nom de la tâche sélectionnée
 *   - duration : durée en heures (peut être décimal, ex: 1.5)
 * @return {string} Message de confirmation (✅) ou d'avertissement (⚠️/⛔)
 */
const saveTimeEntry = (entry) => {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (e) {
    return '❌ Système occupé, veuillez réessayer.';
  }

  try {
    ensureSheets_();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Journal');
    const baseHours = getBaseHoursToday_();

    const dureeDemandee = parseFloat(entry.duration);
    if (isNaN(dureeDemandee) || dureeDemandee <= 0) return '❌ Durée invalide.';

    const todayStr = getTodayString_();
    const data = sheet.getDataRange().getValues();
    const totalActuel = getTotalHoursForDay_(todayStr, data);
    const disponible = baseHours - totalActuel;

    if (disponible <= 0) return `⛔ Limite de ${baseHours}h atteinte. Enregistrement impossible.`;

    const dureeReelle = Math.min(dureeDemandee, disponible);
    let foundRowIndex = -1;

    // Normaliser les valeurs d'entrée pour comparaison robuste
    const entryProject = String(entry.project).trim();
    const entryTask = String(entry.task).trim();

    data.forEach((row, index) => {
      if (index === 0) return;
      const rowDate = formatDateCell_(row[0]);
      const rowProject = String(row[1]).trim();
      const rowTask = String(row[2]).trim();
      if (rowDate === todayStr && rowProject === entryProject && rowTask === entryTask) {
        foundRowIndex = index + 1;
      }
    });

    if (foundRowIndex !== -1) {
      const currentHours = parseFloat(sheet.getRange(foundRowIndex, 4).getValue()) || 0;
      const newTotal = currentHours + dureeReelle;
      sheet.getRange(foundRowIndex, 4).setValue(newTotal);
      sheet.getRange(foundRowIndex, 5).setValue(newTotal / baseHours);
    } else {
      sheet.appendRow([new Date(), entry.project, entry.task, dureeReelle, dureeReelle / baseHours]);
    }

    // Vérification seuil atteint → email
    const newTotal = totalActuel + dureeReelle;
    checkAndSendMail_(newTotal, baseHours, todayStr);

    return (dureeReelle < dureeDemandee)
      ? `⚠️ Limite ${baseHours}h : seulement ${dureeReelle.toFixed(2)}h ajoutées sur ${dureeDemandee.toFixed(2)}h.`
      : `✅ ${dureeReelle.toFixed(2)}h enregistrées avec succès !`;
  } finally {
    lock.releaseLock();
  }
};

/**
 * Enregistre une saisie manuelle (onglet « Saisie » de la sidebar, sans chrono).
 *
 * Valide les paramètres (projet, tâche, heures dans la plage autorisée)
 * puis délègue à saveTimeEntry() pour la logique de cumul et d'email.
 *
 * @param {{ project: string, task: string, hours: number }} entry
 *   - project : nom du projet
 *   - task    : nom de la tâche
 *   - hours   : durée saisie manuellement (entre 0.01 et baseHours)
 * @return {string} Message de résultat
 */
const saveManualEntry = (entry) => {
  if (!entry.project || !entry.task) return '❌ Projet et tâche requis.';
  const hours = parseFloat(entry.hours);
  const baseHours = getBaseHoursToday_();
  if (isNaN(hours) || hours <= 0 || hours > baseHours) {
    return `❌ Heures invalides (entre 0.01 et ${baseHours}).`;
  }
  return saveTimeEntry({ project: entry.project, task: entry.task, duration: hours });
};


/**
 * ============================================================
 *  AJOUT MANUEL (menu Sheets)
 * ============================================================
 */

/**
 * Ajoute un incrément de temps à la ligne active dans l'onglet Journal.
 *
 * Accessible via le menu « ⏱️ Minuteur → Ajouter 30min à la sélection ».
 * Vérifie que l'onglet actif est bien « Journal » et que la ligne
 * correspond à la date d'aujourd'hui (interdit de modifier le passé).
 * Respecte le quota quotidien et déclenche l'email si le seuil est atteint.
 *
 * @param {number} [hoursToAdd=0.5] - Heures à ajouter (défaut : 0.5 = 30min)
 */
const addTimeToSelection = (hoursToAdd = 0.5) => {
  ensureSheets_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = ss.getActiveSheet();
  const ui = SpreadsheetApp.getUi();

  if (activeSheet.getName() !== 'Journal') {
    return ui.alert('⚠️ Veuillez d\'abord sélectionner l\'onglet "Journal".');
  }

  const rowIndex = activeSheet.getActiveCell().getRow();
  if (rowIndex < 2) return ui.alert('Sélectionnez une ligne de données (pas l\'en-tête).');

  const [dateCell, project, task, currentHours] = activeSheet.getRange(rowIndex, 1, 1, 4).getValues()[0];
  const todayStr = getTodayString_();
  const rowDate = formatDateCell_(dateCell);

  if (rowDate !== todayStr) return ui.alert('⛔ Modification impossible sur une date passée.');

  const baseHours = getBaseHoursToday_();
  const totalActuel = getTotalHoursForDay_(todayStr);
  const disponible = baseHours - totalActuel;

  if (disponible <= 0) return ui.alert(`⛔ Quota de ${baseHours}h déjà atteint pour aujourd'hui.`);

  const finalAdd = Math.min(hoursToAdd, disponible);
  const newTotalRow = currentHours + finalAdd;

  activeSheet.getRange(rowIndex, 4).setValue(newTotalRow);
  activeSheet.getRange(rowIndex, 5).setValue(newTotalRow / baseHours);

  checkAndSendMail_(totalActuel + finalAdd, baseHours, todayStr);

  if (finalAdd < hoursToAdd) {
    ui.alert(`⚠️ Ajout limité à ${finalAdd.toFixed(2)}h pour ne pas dépasser ${baseHours}h.`);
  }
};


/**
 * ============================================================
 *  EMAIL — Envoi uniquement quand le seuil du jour est atteint
 * ============================================================
 */

/**
 * Vérifie si le total du jour atteint l'objectif et envoie le rapport e-mail.
 *
 * La clé « sent_seuil_dd/MM/yyyy » est stockée dans UserProperties pour
 * garantir qu'un seul email est envoyé par jour, même si plusieurs saisies
 * franchissent le seuil consécutivement.
 *
 * @param {number} newTotal   - Total d'heures après la dernière saisie
 * @param {number} baseHours  - Objectif quotidien en heures
 * @param {string} todayStr   - Date du jour au format dd/MM/yyyy
 * @private
 */
const checkAndSendMail_ = (newTotal, baseHours, todayStr) => {
  const userProps = PropertiesService.getUserProperties();
  const key = `sent_seuil_${todayStr}`;
  if (newTotal >= baseHours && !userProps.getProperty(key)) {
    sendDailyReport(`Objectif du jour atteint (${baseHours}h)`);
    userProps.setProperty(key, 'true');
  }
};

/**
 * Génère et envoie le rapport de ventilation journalière par e-mail.
 *
 * Lit toutes les lignes du Journal correspondant à aujourd'hui,
 * agrège les heures par couple Projet-Tâche, calcule le total en jours
 * (sur la base du jour en cours) et envoie un e-mail HTML formaté
 * à l'adresse du compte Google actif.
 *
 * @param {string} [reason='Point automatique']
 *   Motif affiché dans le badge de statut de l'e-mail
 */
const sendDailyReport = (reason = 'Point automatique') => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Journal');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const now = new Date();
  const tz = ss.getSpreadsheetTimeZone();
  const todayStr = Utilities.formatDate(now, tz, 'dd/MM/yyyy');
  const baseHours = getBaseHoursToday_();

  const { summary, totalHours } = data.slice(1).reduce((acc, row) => {
    const [date, project, task, hours] = row;
    if (formatDateCell_(date) === todayStr) {
      const key = `${project} - ${task}`;
      acc.summary[key] = (acc.summary[key] || 0) + (parseFloat(hours) || 0);
      acc.totalHours += (parseFloat(hours) || 0);
    }
    return acc;
  }, { summary: {}, totalHours: 0 });

  if (totalHours === 0) return;

  const totalInDays = (totalHours / baseHours).toFixed(2);
  const rowsHtml = Object.entries(summary).map(([key, val]) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee;color:#555">${key}</td>
      <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500;color:#1a73e8">${(val / baseHours).toFixed(2)} j</td>
    </tr>`).join('');

  const emailHtml = `
    <div style="background:#f8f9fa;padding:20px;font-family:'Roboto',Arial,sans-serif;color:#3c4043">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,.1);border:1px solid #dadce0">
        <div style="background:#1a73e8;padding:24px;color:#fff">
          <h2 style="margin:0;font-size:20px;font-weight:400">Ventilation Planview</h2>
          <p style="margin:4px 0 0;opacity:.9;font-size:14px">${todayStr}</p>
        </div>
        <div style="padding:24px">
          <div style="margin-bottom:24px">
            <span style="font-size:12px;color:#70757a;text-transform:uppercase;letter-spacing:.8px;font-weight:700">Statut</span><br>
            <span style="display:inline-block;margin-top:4px;font-size:13px;font-weight:500;color:#1e8e3e;background:#e6f4ea;padding:4px 12px;border-radius:16px">${reason}</span>
          </div>
          <div style="margin-bottom:32px;background:#f8f9fa;padding:16px;border-radius:8px;border-left:4px solid #1a73e8">
            <p style="margin:0;font-size:14px;color:#70757a">Total à saisir</p>
            <h1 style="margin:0;font-size:48px;color:#1a73e8;font-weight:300">${totalInDays} <span style="font-size:20px">jour</span></h1>
            <p style="margin:0;font-size:11px;color:#9aa0a6">DSI ODOC — ${totalHours.toFixed(2)}h (base ${baseHours}h/j)</p>
          </div>
          <h3 style="font-size:13px;color:#3c4043;font-weight:700;text-transform:uppercase;margin-bottom:12px">Détails</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">${rowsHtml}</table>
        </div>
        <div style="background:#f1f3f4;padding:16px;text-align:center;font-size:11px;color:#70757a">
          Généré automatiquement pour faciliter votre saisie Planview.
        </div>
      </div>
    </div>`;

  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: `📊 Ventilation Planview — ${Utilities.formatDate(now, tz, 'dd/MM/yyyy')}`,
    htmlBody: emailHtml
  });
};


/**
 * ============================================================
 *  RAPPORT HEBDOMADAIRE
 * ============================================================
 */

/**
 * Génère les données du rapport hebdomadaire (lundi au dimanche en cours).
 *
 * Retourne un objet indexé par clé « Lun 28/04 » (ou « Mon 28/04 » en EN)
 * contenant pour chaque jour : les saisies détaillées, le total d'heures
 * et la base horaire configurée (issue de l'onglet Paramètres).
 *
 * Les noms de jours sont localisés via le paramètre lang car
 * Utilities.formatDate('EEE') renvoie systématiquement l'anglais.
 *
 * @param {string} [lang='fr'] - Locale transmise par le client ('fr' ou 'en')
 * @return {{ days: Object<string, {entries: Array, total: number, baseHours: number}>,
 *            weekTotal: number }}
 */
const getWeeklyReport = (lang) => {
  ensureSheets_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Journal');
  if (sheet.getLastRow() < 2) return { days: {}, weekTotal: 0 };

  const tz = ss.getSpreadsheetTimeZone();
  const now = new Date();
  const dow = now.getDay();
  const mondayOff = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now); monday.setDate(now.getDate() + mondayOff); monday.setHours(0,0,0,0);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23,59,59,999);

  // Noms de jours localisés (lun→dim) — Utilities.formatDate('EEE') renvoie l'anglais par défaut
  const DAY_NAMES = {
    fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  };
  const dayNames = DAY_NAMES[lang] || DAY_NAMES.fr;

  /**
   * Construit la clé lisible d'un jour : "Lun 28/04"
   * @param {Date} d
   * @return {string}
   */
  const buildKey = (d) => {
    const dayName = dayNames[d.getDay()];
    const dateStr = Utilities.formatDate(d, tz, 'dd/MM');
    return `${dayName} ${dateStr}`;
  };

  const data = sheet.getDataRange().getValues();
  const days = {};
  let weekTotal = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const bh = getBaseHoursForDate_(d);
    days[buildKey(d)] = { entries: [], total: 0, baseHours: bh };
  }

  data.slice(1).forEach(row => {
    const cd = row[0];
    if (!(cd instanceof Date) || cd < monday || cd > sunday) return;
    const dk = buildKey(cd);
    const h = parseFloat(row[3]) || 0;
    if (days[dk]) {
      days[dk].entries.push({ project: row[1], task: row[2], hours: h });
      days[dk].total += h;
      weekTotal += h;
    }
  });

  return { days, weekTotal };
};