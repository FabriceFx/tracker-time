/**
 * ============================================================
 *  CONFIGURATION GLOBALE
 * ============================================================
 */

/** @const {number} Nombre d'heures par défaut si aucune config jour */
const DEFAULT_BASE_HOURS = 8;

/** @const {Array<string>} Jours de la semaine (index 0=dim, 1=lun...) */
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/**
 * Retourne le nombre d'heures-base pour aujourd'hui,
 * en lisant l'onglet Paramètres (colonne Jour / Heures).
 * @return {number}
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
 * Retourne le nombre d'heures-base pour un jour donné (Date).
 * @param {Date} date
 * @return {number}
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
 * Retourne la date du jour au format dd/MM/yyyy (fuseau Spreadsheet).
 * @return {string}
 */
const getTodayString_ = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd/MM/yyyy');
};

/**
 * Formate une date en dd/MM/yyyy dans le fuseau du Spreadsheet.
 * @param {Date|string} date
 * @return {string}
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
 * S'assure que les onglets nécessaires existent, les crée sinon.
 * Appelé au onOpen et avant chaque opération critique.
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
 * Menu personnalisé à l'ouverture du fichier.
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
 * Affiche la barre latérale (Sidebar).
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
 * Point d'entrée Web App (accès mobile via URL).
 * Déployer via : Extensions > Apps Script > Déployer > Application Web
 * @return {HtmlOutput}
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
 * Retourne la locale de l'utilisateur ('fr' ou 'en').
 * Utilisé par le frontend pour l'internationalisation.
 * @return {string} 'fr' ou 'en'
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
 * Récupère les projets et tâches depuis l'onglet Config.
 * @return {Array<Array<string>>} [[projet, tâche], ...]
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
 * Récupère les saisies du jour + la base d'heures du jour pour la sidebar.
 * @return {{ entries: Array<{project: string, task: string, hours: number}>, totalHours: number, baseHours: number }}
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
 * Calcule le total d'heures pour un jour donné.
 * @param {string} dateStr
 * @param {Array<Array>=} existingData
 * @return {number}
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
 * Sauvegarde une entrée depuis la sidebar.
 * Utilise la base d'heures du jour (variable).
 * @param {{ project: string, task: string, duration: number }} entry
 * @return {string}
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
 * Sauvegarde une saisie manuelle (sans chrono).
 * @param {{ project: string, task: string, hours: number }} entry
 * @return {string}
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
 * Ajoute du temps à la ligne sélectionnée dans le Journal.
 * @param {number} [hoursToAdd=0.5]
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
 * Vérifie si le seuil quotidien est atteint et envoie le rapport.
 * L'email est envoyé UNE SEULE FOIS par jour, dès que le total >= baseHours.
 * @param {number} newTotal
 * @param {number} baseHours
 * @param {string} todayStr
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
 * Génère et envoie le rapport HTML quotidien par email.
 * @param {string} [reason="Point automatique"]
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
 * Génère un rapport hebdomadaire (lundi à dimanche en cours).
 * @param {string} [lang='fr'] - Locale 'fr' ou 'en' pour les noms de jours
 * @return {{ days: Object, weekTotal: number }}
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