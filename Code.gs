/**
 * ============================================================================
 *  TRAQUEUR DE TEMPS (Time Tracker)
 * ============================================================================
 *  Auteur      : Fabrice Faucheux (https://faucheux.bzh)
 *  Projet      : FF Labs - Traqueur de temps
 *  Rôle        : Logique métier principale, routes et déclencheurs Google Sheets.
 *  Version     : 2.2.0
 * ============================================================================
 */

/**
 * Dictionnaire de traduction pour les e-mails.
 */
const EMAIL_I18N = {
  fr: {
    dailyGoalReached: 'Objectif du jour atteint',
    dailySubject: '📊 Ventilation du suivi des temps',
    dailyTitle: 'Ventilation de votre temps',
    dailyStatus: 'Statut',
    dailyTotal: 'Total à saisir',
    dailyDay: 'jour',
    dailyBase: 'base',
    dailyDetails: 'Détails',
    dailyFooter: 'Généré automatiquement par Apps Script.',
    weeklySubject: '📊 Bilan hebdomadaire Tracker Time',
    weeklyTitle: 'Bilan hebdomadaire Tracker Time',
    weeklyWeek: 'Semaine',
    weeklyTotal: 'Total de la semaine',
    weeklyEquivalent: 'Soit environ',
    weeklyDays: 'jours',
    weeklyGoal: 'Objectif de la semaine',
    weeklyDetails: 'Détails par jour',
    weeklyFooter: 'Tracker Time - rapport généré automatiquement en fin de semaine.'
  },
  en: {
    dailyGoalReached: 'Daily goal reached',
    dailySubject: '📊 Time Tracking Breakdown',
    dailyTitle: 'Your Time Breakdown',
    dailyStatus: 'Status',
    dailyTotal: 'Total to log',
    dailyDay: 'day',
    dailyBase: 'base',
    dailyDetails: 'Details',
    dailyFooter: 'Automatically generated via Apps Script.',
    weeklySubject: '📊 Tracker Time Weekly Report',
    weeklyTitle: 'Tracker Time Weekly Report',
    weeklyWeek: 'Week',
    weeklyTotal: 'Weekly Total',
    weeklyEquivalent: 'approximately',
    weeklyDays: 'days',
    weeklyGoal: 'Weekly Goal',
    weeklyDetails: 'Daily Details',
    weeklyFooter: 'Tracker Time - Automatically generated weekly report.'
  }
};

/**
 * Déclencheur à l'ouverture du tableur.
 * Initialise le menu et effectue les purges nécessaires.
 */
function onOpen() {
  assurerPresenceOnglets_();
  purgerAnciennesProprietes_();

  SpreadsheetApp.getUi()
    .createMenu('⏱️ Minuteur')
    .addItem('Ouvrir le suivi', 'afficherBarreLaterale')
    .addSeparator()
    .addItem('➕ Ajouter 30min à la sélection', 'ajouterTempsALaSelection')
    .addSeparator()
    .addItem('🧹 Optimiser le Journal DateKey', 'backfillJournalDateKeys')
    .addItem('🧩 Fusionner les doublons du jour', 'dedoublonnerJournalDuJour')
    .addSeparator()
    .addItem('📅 Activer le bilan par e-mail Ven. 18h', 'configurerDeclencheurHebdo')
    .addItem('📧 Tester l\'envoi du bilan journalier', 'forcerEnvoiBilanJournalier')
    .addSeparator()
    .addItem('ℹ️ À Propos', 'afficherAPropos')
    .addToUi();
}

/**
 * Assure que tous les onglets structurels nécessaires sont présents avec leurs en-têtes.
 */
function assurerPresenceOnglets_() {
  const tableur = obtenirTableur_();

  assurerOngletConfig_(tableur);
  assurerOngletJournal_(tableur);
  assurerOngletParametres_(tableur);
}

function assurerOngletConfig_(tableur) {
  let onglet = tableur.getSheetByName(NOMS_ONGLETS.CONFIG);

  if (!onglet) {
    onglet = tableur.insertSheet(NOMS_ONGLETS.CONFIG);
    onglet.getRange(1, 1, 1, ENTETES_CONFIG.length).setValues([ENTETES_CONFIG]);
    onglet.getRange('A1:B1').setFontWeight('bold').setBackground('#c2e7ff');
    onglet.setColumnWidth(1, 200);
    onglet.setColumnWidth(2, 250);
    onglet.setFrozenRows(1);
    return;
  }

  assurerEntete_(onglet, ENTETES_CONFIG);
}

function assurerOngletJournal_(tableur) {
  let onglet = tableur.getSheetByName(NOMS_ONGLETS.JOURNAL);

  if (!onglet) {
    onglet = tableur.insertSheet(NOMS_ONGLETS.JOURNAL);
    onglet.getRange(1, 1, 1, ENTETES_JOURNAL.length).setValues([ENTETES_JOURNAL]);
    onglet.getRange(1, 1, 1, ENTETES_JOURNAL.length).setFontWeight('bold').setBackground('#c2e7ff');
    onglet.setColumnWidth(1, 110);
    onglet.setColumnWidth(2, 180);
    onglet.setColumnWidth(3, 220);
    onglet.setColumnWidth(4, 80);
    onglet.setColumnWidth(5, 80);
    onglet.setColumnWidth(6, 100);
    onglet.hideColumns(6);
    onglet.setFrozenRows(1);
    return;
  }

  assurerEntete_(onglet, ENTETES_JOURNAL);

  try {
    onglet.hideColumns(6);
  } catch (e) {
    // Colonne déjà masquée ou non disponible.
  }
}

function assurerOngletParametres_(tableur) {
  let onglet = tableur.getSheetByName(NOMS_ONGLETS.PARAMETRES);

  if (!onglet) {
    onglet = tableur.insertSheet(NOMS_ONGLETS.PARAMETRES);
    onglet.getRange(1, 1, 1, ENTETES_PARAMETRES.length).setValues([ENTETES_PARAMETRES]);
    onglet.getRange('A1:B1').setFontWeight('bold').setBackground('#c2e7ff');

    const jours = [
      ['Lundi', 8],
      ['Mardi', 8],
      ['Mercredi', 8],
      ['Jeudi', 8],
      ['Vendredi', 8],
      ['Samedi', 0],
      ['Dimanche', 0]
    ];

    onglet.getRange(2, 1, jours.length, jours[0].length).setValues(jours);
    onglet.setColumnWidth(1, 120);
    onglet.setColumnWidth(2, 80);
    onglet.setFrozenRows(1);
    return;
  }

  assurerEntete_(onglet, ENTETES_PARAMETRES);
}

function assurerEntete_(onglet, entetes) {
  const current = onglet.getRange(1, 1, 1, entetes.length).getValues()[0];
  const mustUpdate = entetes.some((header, index) => normaliserTexte_(current[index]) !== header);

  if (!mustUpdate) return;

  onglet.getRange(1, 1, 1, entetes.length).setValues([entetes]);
  onglet.getRange(1, 1, 1, entetes.length).setFontWeight('bold').setBackground('#c2e7ff');

  if (onglet.getFrozenRows() < 1) {
    onglet.setFrozenRows(1);
  }
}

/**
 * Remplit la colonne technique DateKey pour les anciennes lignes du Journal.
 */
function backfillJournalDateKeys() {
  assurerPresenceOnglets_();

  const interfaceUtilisateur = SpreadsheetApp.getUi();
  const tableur = obtenirTableur_();
  const fuseau = tableur.getSpreadsheetTimeZone();
  const onglet = tableur.getSheetByName(NOMS_ONGLETS.JOURNAL);
  const lastRow = onglet.getLastRow();

  if (lastRow < 2) {
    interfaceUtilisateur.alert('ℹ️ Le Journal ne contient aucune ligne à optimiser.');
    return;
  }

  const values = onglet.getRange(2, 1, lastRow - 1, ENTETES_JOURNAL.length).getValues();
  let updatedCount = 0;

  const dateKeys = values.map(ligne => {
    const existingKey = normaliserTexte_(ligne[5]);
    if (existingKey) return [existingKey];

    const dateKey = obtenirCleDateDepuisCellule_(ligne[0], fuseau);
    if (dateKey) updatedCount += 1;
    return [dateKey];
  });

  if (updatedCount > 0) {
    onglet.getRange(2, 6, dateKeys.length, 1).setValues(dateKeys);
  }

  try {
    onglet.hideColumns(6);
  } catch (e) { }

  interfaceUtilisateur.alert(`✅ Optimisation terminée. ${updatedCount} ligne(s) mise(s) à jour.`);
}

/**
 * Affiche la barre latérale du suivi de temps.
 */
function afficherBarreLaterale() {
  assurerPresenceOnglets_();

  const locale = obtenirLangueUtilisateur();
  const title = locale === 'fr' ? 'Traqueur de temps' : 'Time Tracker';
  
  const template = HtmlService.createTemplateFromFile('Sidebar');
  template.locale = locale;

  const html = template.evaluate()
    .setTitle(title)
    .setWidth(320);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Affiche la boîte modale "À propos".
 */
function afficherAPropos() {
  const lang = obtenirLangueUtilisateur();
  const title = lang === 'fr' ? 'À propos de ce script' : 'About this script';
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: 'Open Sans', Arial, sans-serif; padding: 20px; color: #1f1f1f; text-align: center;">
      <h2 style="color: #0b57d0; font-weight: 600;">${lang === 'fr' ? 'Traqueur de temps' : 'Time Tracker'}</h2>
      <p style="font-size: 13px; color: #444746;">${lang === 'fr' ? 'Version 2.2.0 - Suivi du temps de travail autonome et automatisé.' : 'Version 2.2.0 - Autonomous and automated work time tracker.'}</p>
      <hr style="border: 0; height: 1px; background: #e3e3e3; margin: 20px 0;">
      <p style="font-size: 12px; color: #444746;">${lang === 'fr' ? 'Développé par' : 'Developed by'}</p>
      <h3 style="margin: 5px 0; font-weight: 600;">Fabrice Faucheux</h3>
      <a href="https://faucheux.bzh" target="_blank" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #0b57d0; color: white; text-decoration: none; border-radius: 20px; font-size: 13px; font-weight: 500;">
        ${lang === 'fr' ? 'Visiter faucheux.bzh' : 'Visit faucheux.bzh'}
      </a>
    </div>
  `).setWidth(350).setHeight(280);
  SpreadsheetApp.getUi().showModalDialog(html, title);
}

/**
 * Route GET pour l'affichage en tant que Web App.
 */
function doGet() {
  assurerPresenceOnglets_();

  const locale = obtenirLangueUtilisateur();
  const title = locale === 'fr' ? 'Traqueur de temps' : 'Time Tracker';

  const template = HtmlService.createTemplateFromFile('Sidebar');
  template.locale = locale;

  return template.evaluate()
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Détermine la langue à utiliser (fr ou en) basée sur les paramètres régionaux du tableur.
 *
 * @return {string} "fr" ou "en".
 */
function obtenirLangueUtilisateur() {
  try {
    const locale = obtenirTableur_().getSpreadsheetLocale() || 'fr_FR';
    return String(locale).toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch (e) {
    return 'fr';
  }
}

/**
 * Récupère les données initiales requises pour le chargement de la barre latérale en un seul appel.
 *
 * @return {Object} L'état de configuration et d'historique initial.
 */
function obtenirDonneesInitialesBarreLaterale() {
  assurerPresenceOnglets_();

  return {
    locale: obtenirLangueUtilisateur(),
    projectsAndTasks: obtenirProjetsEtTaches_(),
    aujourdhui: obtenirSaisiesAujourdhui_()
  };
}

/**
 * Récupère la liste des projets et tâches (public pour `google.script.run`).
 *
 * @return {Array.<Array.<string>>} Liste de paires [projet, tâche].
 */
function obtenirProjetsEtTaches() {
  assurerPresenceOnglets_();
  return obtenirProjetsEtTaches_();
}

/**
 * Fonction interne de récupération de la liste des projets et tâches.
 *
 * @return {Array.<Array.<string>>} Liste de paires [projet, tâche].
 */
function obtenirProjetsEtTaches_() {
  const onglet = obtenirTableur_().getSheetByName(NOMS_ONGLETS.CONFIG);
  const lastRow = onglet.getLastRow();

  if (lastRow < 2) return [];

  return onglet
    .getRange(2, 1, lastRow - 1, 2)
    .getValues()
    .map(([projet, tache]) => [normaliserTexte_(projet), normaliserTexte_(tache)])
    .filter(([projet]) => projet !== '');
}

/**
 * Récupère les saisies enregistrées pour aujourd'hui (public pour `google.script.run`).
 *
 * @return {Object} Contient la liste des saisies, le total des heures et le quota de base.
 */
function obtenirSaisiesAujourdhui() {
  assurerPresenceOnglets_();
  return obtenirSaisiesAujourdhui_();
}

/**
 * Fonction interne de récupération des saisies enregistrées pour aujourd'hui.
 *
 * @return {Object} Contient la liste des saisies, le total des heures et le quota de base.
 */
function obtenirSaisiesAujourdhui_() {
  const tableur = obtenirTableur_();
  const fuseau = tableur.getSpreadsheetTimeZone();
  const onglet = tableur.getSheetByName(NOMS_ONGLETS.JOURNAL);
  const heuresDeBase = obtenirHeuresDeBaseAujourdhui_();

  if (onglet.getLastRow() < 2) {
    return { saisies: [], totalHeures: 0, heuresDeBase };
  }

  const rows = obtenirLignesJournalPourDate_(onglet, new Date(), fuseau);
  const saisies = [];
  let totalHeures = 0;

  rows.forEach(({ values }) => {
    const heures = parseFloat(values[3]) || 0;

    saisies.push({
      projet: values[1],
      tache: values[2],
      heures
    });

    totalHeures += heures;
  });

  return { saisies, totalHeures, heuresDeBase };
}

/**
 * Récupère le total des heures enregistrées pour un jour donné.
 *
 * @param {string} chaineDate - Date au format dd/MM/yyyy.
 * @return {number} Le total d'heures.
 */
function obtenirTotalHeuresPourJour(chaineDate) {
  assurerPresenceOnglets_();

  const date = analyserChaineDateFrancaise_(chaineDate);
  if (!date) return 0;

  const tableur = obtenirTableur_();
  const fuseau = tableur.getSpreadsheetTimeZone();
  const onglet = tableur.getSheetByName(NOMS_ONGLETS.JOURNAL);
  const rows = obtenirLignesJournalPourDate_(onglet, date, fuseau);

  return rows.reduce((total, { values }) => total + (parseFloat(values[3]) || 0), 0);
}

/**
 * Lit de façon ultra performante (en-mémoire) les lignes du Journal pour une date cible.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} onglet - Onglet Journal.
 * @param {Date} dateCible - Date ciblée.
 * @param {string} fuseau - Fuseau horaire.
 * @return {Array.<Object>} Liste d'objets contenant {rowIndex, values}.
 */
function obtenirLignesJournalPourDate_(onglet, dateCible, fuseau) {
  const lastRow = onglet.getLastRow();
  if (lastRow < 2) return [];

  const targetKey = obtenirCleDatePourDate_(dateCible, fuseau);
  const values = onglet.getRange(2, 1, lastRow - 1, ENTETES_JOURNAL.length).getValues();
  const rows = [];

  values.forEach((ligne, index) => {
    const rowIndex = index + 2;
    const rowKey = obtenirCleDateDepuisCellule_(ligne[5], fuseau) || obtenirCleDateDepuisCellule_(ligne[0], fuseau);
    if (rowKey === targetKey) {
      rows.push({ rowIndex, values: ligne });
    }
  });

  return rows;
}

/**
 * Lit de façon ultra performante (en-mémoire) les lignes du Journal comprises entre deux dates.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} onglet - Onglet Journal.
 * @param {Date} dateDebut - Date de début.
 * @param {Date} dateFin - Date de fin.
 * @param {string} fuseau - Fuseau horaire.
 * @return {Array.<Object>} Liste d'objets contenant {rowIndex, values, dateKey}.
 */
function obtenirLignesJournalEntreDates_(onglet, dateDebut, dateFin, fuseau) {
  const lastRow = onglet.getLastRow();
  if (lastRow < 2) return [];

  const startKey = obtenirCleDatePourDate_(dateDebut, fuseau);
  const endKey = obtenirCleDatePourDate_(dateFin, fuseau);
  const values = onglet.getRange(2, 1, lastRow - 1, ENTETES_JOURNAL.length).getValues();
  const rows = [];

  values.forEach((ligne, index) => {
    const rowIndex = index + 2;
    const rowKey = obtenirCleDateDepuisCellule_(ligne[5], fuseau) || obtenirCleDateDepuisCellule_(ligne[0], fuseau);
    if (rowKey >= startKey && rowKey <= endKey) {
      rows.push({ rowIndex, values: ligne, dateKey: rowKey });
    }
  });

  return rows;
}

/**
 * Enregistre une saisie de temps en direct (Chronomètre).
 * Utilise LockService pour éviter les collisions ou accès concurrents.
 *
 * @param {Object} saisie - Contient {projet, tache, duree}.
 * @return {string} Message de statut ou d'erreur.
 */
function enregistrerSaisieTemps(saisie) {
  const verrou = LockService.getScriptLock();

  try {
    verrou.waitLock(10000);
  } catch (e) {
    return '❌ Système occupé, veuillez réessayer.';
  }

  let message = '';
  let emailReason = null;

  try {
    assurerPresenceOnglets_();

    const tableur = obtenirTableur_();
    const fuseau = tableur.getSpreadsheetTimeZone();
    const onglet = tableur.getSheetByName(NOMS_ONGLETS.JOURNAL);
    const maintenant = new Date();
    const dateDuJourStr = obtenirChaineDatePourDate_(maintenant, fuseau);
    const todayKey = obtenirCleDatePourDate_(maintenant, fuseau);
    const heuresDeBase = obtenirHeuresDeBaseAujourdhui_();

    const projet = normaliserTexte_(saisie && saisie.projet);
    const tache = normaliserTexte_(saisie && saisie.tache);
    const requestedDuration = parseFloat(saisie && saisie.duree);

    if (!projet || !tache) {
      return '❌ Projet et tâche requis.';
    }

    if (isNaN(requestedDuration) || requestedDuration === 0) {
      return '❌ Durée invalide (non nulle).';
    }

    if (heuresDeBase <= 0) {
      return '⛔ Aucune heure attendue pour aujourd\'hui dans l\'onglet Paramètres.';
    }

    const todayRows = obtenirLignesJournalPourDate_(onglet, maintenant, fuseau);
    const totalBefore = todayRows.reduce((total, ligne) => total + (parseFloat(ligne.values[3]) || 0), 0);
    const available = heuresDeBase - totalBefore;

    if (available <= 0 && requestedDuration > 0) {
      return `⛔ Limite de ${heuresDeBase}h atteinte. Enregistrement impossible.`;
    }

    let actualDuration = requestedDuration;
    if (requestedDuration > 0) {
      actualDuration = Math.min(requestedDuration, available);
    }
    let existingRow = null;

    for (let i = todayRows.length - 1; i >= 0; i--) {
      const ligne = todayRows[i];
      const rowProject = normaliserTexte_(ligne.values[1]);
      const rowTask = normaliserTexte_(ligne.values[2]);

      if (rowProject === projet && rowTask === tache) {
        existingRow = ligne;
        break;
      }
    }

    if (existingRow) {
      const heuresActuelles = parseFloat(existingRow.values[3]) || 0;
      if (actualDuration < 0) {
        actualDuration = Math.max(actualDuration, -heuresActuelles);
      }
      const newRowHours = heuresActuelles + actualDuration;

      if (newRowHours <= 0) {
        onglet
          .getRange(existingRow.rowIndex, 4, 1, 3)
          .setValues([[0, 0, todayKey]]);
      } else {
        onglet
          .getRange(existingRow.rowIndex, 4, 1, 3)
          .setValues([[newRowHours, ratioSecurise_(newRowHours, heuresDeBase), todayKey]]);
      }
    } else {
      if (actualDuration < 0) {
        return '❌ Impossible de retirer du temps : aucune saisie existante.';
      }
      onglet.appendRow([
        maintenant,
        projet,
        tache,
        actualDuration,
        ratioSecurise_(actualDuration, heuresDeBase),
        todayKey
      ]);
    }

    const totalAfter = totalBefore + actualDuration;
    emailReason = reserverEmailQuotidienSiBesoin_(totalAfter, heuresDeBase, dateDuJourStr);

    message = actualDuration < requestedDuration
      ? `⚠️ Limite ${heuresDeBase}h : seulement ${actualDuration.toFixed(2)}h ajoutées sur ${requestedDuration.toFixed(2)}h.`
      : `✅ ${actualDuration.toFixed(2)}h enregistrées avec succès !`;
  } finally {
    verrou.releaseLock();
  }

  if (emailReason) {
    envoyerRapportQuotidien(emailReason);
  }

  return message;
}

/**
 * Enregistre une saisie manuelle d'heures.
 *
 * @param {Object} saisie - Contient {projet, tache, heures}.
 * @return {string} Message de statut ou d'erreur.
 */
function enregistrerSaisieManuelle(saisie) {
  if (!saisie || !saisie.projet || !saisie.tache) {
    return '❌ Projet et tâche requis.';
  }

  const heures = parseFloat(saisie.heures);
  const heuresDeBase = obtenirHeuresDeBaseAujourdhui_();

  if (heuresDeBase <= 0) {
    return '⛔ Aucune heure attendue pour aujourd\'hui dans l\'onglet Paramètres.';
  }

  if (isNaN(heures) || heures === 0 || Math.abs(heures) > heuresDeBase) {
    return `❌ Heures invalides (entre -${heuresDeBase} et ${heuresDeBase}).`;
  }

  return enregistrerSaisieTemps({
    projet: saisie.projet,
    tache: saisie.tache,
    duree: heures
  });
}

/**
 * Vérifie et réserve l'envoi unique du bilan quotidien par e-mail si l'objectif d'heures est atteint.
 *
 * @param {number} nouveauTotal - Nouveau total d'heures de la journée.
 * @param {number} heuresDeBase - Quota d'heures attendu pour aujourd'hui.
 * @param {string} dateDuJourStr - La chaîne de date du jour.
 * @return {string|null} Motif de l'alerte d'e-mail, ou null si déjà envoyé ou non requis.
 */
function reserverEmailQuotidienSiBesoin_(nouveauTotal, heuresDeBase, dateDuJourStr) {
  if (nouveauTotal < heuresDeBase) return null;

  const userProps = PropertiesService.getUserProperties();
  const key = `sent_seuil_${dateDuJourStr}`;

  if (userProps.getProperty(key)) return null;

  const lang = obtenirLangueUtilisateur();
  const t = EMAIL_I18N[lang] || EMAIL_I18N.fr;
  const motif = `${t.dailyGoalReached} (${heuresDeBase}h)`;

  userProps.setProperty(key, 'true');
  return motif;
}

/**
 * Ajoute une durée fixe (0.5h par défaut) à la ligne sélectionnée dans le journal.
 * Accessible via le menu Sheets.
 *
 * @param {number} [hoursToAdd=0.5] - Heures à ajouter.
 */
function ajouterTempsALaSelection(hoursToAdd) {
  const increment = typeof hoursToAdd === 'number' ? hoursToAdd : 0.5;
  const interfaceUtilisateur = SpreadsheetApp.getUi();
  const verrou = LockService.getScriptLock();

  try {
    verrou.waitLock(10000);
  } catch (e) {
    interfaceUtilisateur.alert('❌ Système occupé, veuillez réessayer.');
    return;
  }

  let alertAfterLock = null;
  let emailReason = null;

  try {
    assurerPresenceOnglets_();

    const tableur = obtenirTableur_();
    const fuseau = tableur.getSpreadsheetTimeZone();
    const activeSheet = tableur.getActiveSheet();

    if (activeSheet.getName() !== NOMS_ONGLETS.JOURNAL) {
      interfaceUtilisateur.alert('⚠️ Veuillez d\'abord sélectionner l\'onglet Journal.');
      return;
    }

    const rowIndex = activeSheet.getActiveCell().getRow();

    if (rowIndex < 2) {
      interfaceUtilisateur.alert('Sélectionnez une ligne de données, pas l\'en-tête.');
      return;
    }

    const ligne = activeSheet.getRange(rowIndex, 1, 1, ENTETES_JOURNAL.length).getValues()[0];
    const dateDuJourStr = obtenirDateDuJourStr_();
    const todayKey = obtenirCleAujourdhui_();
    const dateLigne = formaterCelluleDate_(ligne[0], fuseau);

    if (dateLigne !== dateDuJourStr) {
      interfaceUtilisateur.alert('⛔ Modification impossible sur une date passée.');
      return;
    }

    const heuresDeBase = obtenirHeuresDeBaseAujourdhui_();

    if (heuresDeBase <= 0) {
      interfaceUtilisateur.alert('⛔ Aucune heure attendue pour aujourd\'hui dans l\'onglet Paramètres.');
      return;
    }

    const rows = obtenirLignesJournalPourDate_(activeSheet, new Date(), fuseau);
    const totalBefore = rows.reduce((total, item) => total + (parseFloat(item.values[3]) || 0), 0);
    const available = heuresDeBase - totalBefore;

    if (available <= 0) {
      interfaceUtilisateur.alert(`⛔ Quota de ${heuresDeBase}h déjà atteint pour aujourd'hui.`);
      return;
    }

    const heuresActuelles = parseFloat(ligne[3]) || 0;
    const ajoutFinal = Math.min(increment, available);
    const newRowHours = heuresActuelles + ajoutFinal;

    activeSheet
      .getRange(rowIndex, 4, 1, 3)
      .setValues([[newRowHours, ratioSecurise_(newRowHours, heuresDeBase), todayKey]]);

    emailReason = reserverEmailQuotidienSiBesoin_(totalBefore + ajoutFinal, heuresDeBase, dateDuJourStr);

    if (ajoutFinal < increment) {
      alertAfterLock = `⚠️ Ajout limité à ${ajoutFinal.toFixed(2)}h pour ne pas dépasser ${heuresDeBase}h.`;
    }
  } finally {
    verrou.releaseLock();
  }

  if (emailReason) {
    envoyerRapportQuotidien(emailReason);
  }

  if (alertAfterLock) {
    interfaceUtilisateur.alert(alertAfterLock);
  }
}

/**
 * Envoie le bilan quotidien par e-mail avec un récapitulatif graphique soigné de la ventilation horaire.
 *
 * @param {string} [motif] - Le motif de déclenchement (ex: objectif quotidien atteint).
 */
function envoyerRapportQuotidien(motif) {
  const tableur = obtenirTableur_();
  const onglet = tableur.getSheetByName(NOMS_ONGLETS.JOURNAL);

  if (!onglet || onglet.getLastRow() < 2) return;

  const fuseau = tableur.getSpreadsheetTimeZone();
  const maintenant = new Date();
  const dateDuJourStr = obtenirChaineDatePourDate_(maintenant, fuseau);
  const heuresDeBase = obtenirHeuresDeBaseAujourdhui_();

  if (heuresDeBase <= 0) return;

  const lang = obtenirLangueUtilisateur();
  const t = EMAIL_I18N[lang] || EMAIL_I18N.fr;
  const safeReason = motif || t.dailyGoalReached;
  const rows = obtenirLignesJournalPourDate_(onglet, maintenant, fuseau);

  const resume = {};
  let totalHeures = 0;

  rows.forEach(({ values }) => {
    const projet = values[1];
    const tache = values[2];
    const heures = parseFloat(values[3]) || 0;
    const key = `${projet} - ${tache}`;

    resume[key] = (resume[key] || 0) + heures;
    totalHeures += heures;
  });

  if (totalHeures === 0) return;

  const totalInDays = (totalHeures / heuresDeBase).toFixed(2);
  const lignesHtml = Object.entries(resume).map(([key, valeur]) => `
    <tr style="border-bottom: 1px solid #f1f3f4;">
      <td style="padding: 12px 10px; color: #1f1f1f; font-weight: 500;">${escHtml_(key)}</td>
      <td style="padding: 12px 10px; text-align: right; font-weight: 600; color: #0b57d0; white-space: nowrap;">${(valeur / heuresDeBase).toFixed(2)} ${t.dailyDay}</td>
    </tr>`).join('');

  const htmlEmail = `
    <meta charset="UTF-8">
    <div style="background-color: #f3f6fc; padding: 24px; font-family: 'Open Sans', 'Inter', system-ui, -apple-system, sans-serif; color: #1f1f1f; max-width: 600px; margin: 0 auto; border-radius: 16px;">
      <!-- Branding Header -->
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 700; color: #0b57d0; letter-spacing: -0.3px;">⏱️ Tracker Time</span>
      </div>
      
      <!-- Card Blanche -->
      <div style="background-color: #ffffff; border: 1px solid #e3e3e3; border-radius: 16px; padding: 24px; box-shadow: none;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1f1f1f; margin-top: 0; margin-bottom: 6px;">${t.dailyTitle}</h2>
        <p style="font-size: 13px; color: #444746; margin-top: 0; margin-bottom: 20px;">${dateDuJourStr}</p>
        
        <div style="margin-bottom: 20px;">
          <span style="font-size: 11px; color: #444746; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">${t.dailyStatus}</span><br>
          <span style="display: inline-block; margin-top: 4px; font-size: 12px; font-weight: 600; color: #146c2e; background-color: #e6f4ea; padding: 4px 12px; border-radius: 100px;">${safeReason}</span>
        </div>
        
        <!-- KPI Card -->
        <div style="margin-bottom: 24px; background-color: #f8f9fa; border: 1px solid #e3e3e3; padding: 16px; border-radius: 8px; border-left: 4px solid #0b57d0;">
          <p style="margin: 0; font-size: 13px; color: #444746;">${t.dailyTotal}</p>
          <h1 style="margin: 6px 0; font-size: 40px; color: #0b57d0; font-weight: 300; line-height: 1;">${totalInDays} <span style="font-size: 16px;">${t.dailyDay}</span></h1>
          <p style="margin: 0; font-size: 11px; color: #444746;">${totalHeures.toFixed(2)}h (${t.dailyBase} ${heuresDeBase}h/j)</p>
        </div>
        
        <h3 style="font-size: 12px; color: #1f1f1f; font-weight: 600; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">${t.dailyDetails}</h3>
        
        <div style="overflow-x: auto; border: 1px solid #e3e3e3; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background-color: #ffffff;">
            <tbody>
              ${lignesHtml}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #444746; line-height: 1.4;">
        <p style="margin: 0 0 10px 0;">${t.dailyFooter}</p>
        <div style="margin-top: 14px; display: flex; justify-content: center; gap: 16px; font-size: 10px;">
          <span style="font-weight: bold; color: #444746;">⚡ FF Labs</span>
          <a href="https://faucheux.bzh" target="_blank" style="color: #0b57d0; text-decoration: none; font-weight: 600;">&lt;&gt; par Fabrice Faucheux</a>
        </div>
      </div>
    </div>`;

  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: `${t.dailySubject} - ${dateDuJourStr}`,
    htmlBody: htmlEmail
  });
}

/**
 * Force l'envoi immédiat du bilan quotidien par e-mail en ignorant le verrou de session quotidienne.
 * Conçu pour des tests rapides via le menu Sheets.
 */
function forcerEnvoiBilanJournalier() {
  const tableur = obtenirTableur_();
  const fuseau = tableur.getSpreadsheetTimeZone();
  const dateDuJourStr = obtenirChaineDatePourDate_(new Date(), fuseau);
  
  PropertiesService.getUserProperties().deleteProperty(`sent_seuil_${dateDuJourStr}`);
  
  const lang = obtenirLangueUtilisateur();
  const t = EMAIL_I18N[lang] || EMAIL_I18N.fr;
  envoyerRapportQuotidien(`[TEST MANUEL] ${t.dailyGoalReached}`);
  
  SpreadsheetApp.getUi().alert('E-mail généré ! Vérifiez votre boîte de réception.');
}

/**
 * Calcule et compile les données du rapport hebdomadaire courant de l'utilisateur (du lundi au dimanche).
 *
 * @param {string} lang - La langue cible ('fr' ou 'en').
 * @return {Object} Données de bilan compilées pour affichage ou e-mail.
 */
function obtenirRapportHebdomadaire(lang) {
  assurerPresenceOnglets_();

  const tableur = obtenirTableur_();
  const fuseau = tableur.getSpreadsheetTimeZone();
  const onglet = tableur.getSheetByName(NOMS_ONGLETS.JOURNAL);

  if (onglet.getLastRow() < 2) return { jours: [], totalSemaine: 0 };

  const maintenant = new Date();
  const jourSemaine = maintenant.getDay();
  const mondayOffset = jourSemaine === 0 ? -6 : 1 - jourSemaine;
  const lundi = new Date(maintenant);
  lundi.setDate(maintenant.getDate() + mondayOffset);
  lundi.setHours(0, 0, 0, 0);

  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);
  dimanche.setHours(23, 59, 59, 999);

  const DAY_NAMES = {
    fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  };

  const dayNames = DAY_NAMES[lang] || DAY_NAMES.fr;
  const carteHeuresBase = obtenirCarteHeuresDeBase_();
  const joursInternes = {};
  const joursResultat = [];
  let totalSemaine = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(lundi);
    d.setDate(lundi.getDate() + i);

    const key = Utilities.formatDate(d, fuseau, 'yyyy-MM-dd');
    const nomJour = dayNames[d.getDay()];
    const chaineDate = Utilities.formatDate(d, fuseau, 'dd/MM');
    
    const dayData = {
      dayLabel: `${nomJour} ${chaineDate}`,
      saisies: [],
      total: 0,
      heuresDeBase: obtenirHeuresDeBasePourDateDepuisCarte_(d, carteHeuresBase, fuseau)
    };

    joursInternes[key] = dayData;
    joursResultat.push(dayData);
  }

  const rows = obtenirLignesJournalEntreDates_(onglet, lundi, dimanche, fuseau);

  rows.forEach(({ values, dateKey }) => {
    const key = dateKey || obtenirCleDateDepuisCellule_(values[0], fuseau);
    
    if (!key || !joursInternes[key]) return;

    const heures = parseFloat(values[3]) || 0;

    joursInternes[key].saisies.push({
      projet: values[1],
      tache: values[2],
      heures
    });

    joursInternes[key].total += heures;
    totalSemaine += heures;
  });

  return { jours: joursResultat, totalSemaine };
}

/**
 * Configure le déclencheur temporel pour envoyer le rapport hebdomadaire tous les vendredis à 18h.
 */
function configurerDeclencheurHebdo() {
  const interfaceUtilisateur = SpreadsheetApp.getUi();
  const triggers = ScriptApp.getProjectTriggers();
  
  let existantTrouve = false;
  triggers.forEach(declencheur => {
    const nomGestionnaire = declencheur.getHandlerFunction();
    if (nomGestionnaire === 'envoyerEmailHebdo' || nomGestionnaire === 'sendWeeklyEmail') {
      if (nomGestionnaire === 'envoyerEmailHebdo') {
        existantTrouve = true;
      } else {
        ScriptApp.deleteTrigger(declencheur);
      }
    }
  });

  if (existantTrouve) {
    interfaceUtilisateur.alert('ℹ️ Le rapport hebdomadaire automatique est déjà activé vendredi à 18h.');
    return;
  }

  try {
    ScriptApp.newTrigger('envoyerEmailHebdo')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.FRIDAY)
      .atHour(18)
      .create();

    interfaceUtilisateur.alert('✅ Rapport hebdomadaire activé. Vous recevrez un bilan détaillé par e-mail tous les vendredis vers 18h00.');
  } catch (e) {
    interfaceUtilisateur.alert('❌ Erreur lors de l\'activation. Veuillez vérifier les autorisations Google. Détail : ' + e.message);
  }
}

/**
 * Envoie le bilan hebdomadaire complet par e-mail.
 */
function envoyerEmailHebdo() {
  const lang = obtenirLangueUtilisateur();
  const t = EMAIL_I18N[lang] || EMAIL_I18N.fr;
  const report = obtenirRapportHebdomadaire(lang);

  if (report.totalSemaine === 0) return;

  const tableur = obtenirTableur_();
  const fuseau = tableur.getSpreadsheetTimeZone();
  const maintenant = new Date();
  const numeroSemaine = Utilities.formatDate(maintenant, fuseau, 'w');

  let totalBase = 0;
  let lignesHtml = '';

  report.jours.forEach(donnees => {
    const nomJour = donnees.dayLabel;
    totalBase += donnees.heuresDeBase;

    const isOff = donnees.heuresDeBase === 0;
    const pct = isOff ? 0 : Math.round((donnees.total / donnees.heuresDeBase) * 100);
    const color = pct >= 100 ? '#146c2e' : (pct >= 75 ? '#b06000' : '#444746');
    const bgColor = pct >= 100 ? '#e6f4ea' : (pct >= 75 ? '#fef7e0' : '#f1f3f4');

    lignesHtml += `
      <tr style="background-color: #f8f9fa; border-top: 1px solid #e3e3e3;">
        <td style="padding: 12px 10px; color: #1f1f1f; font-weight: 600;">
          ${escHtml_(nomJour)} <span style="font-size: 11px; color: #444746; font-weight: normal;">(${donnees.heuresDeBase}h)</span>
        </td>
        <td style="padding: 12px 10px; text-align: right; font-weight: 700; color: ${color}; white-space: nowrap;">
          <span style="background-color: ${bgColor}; padding: 2px 8px; border-radius: 100px; font-size: 11px; display: inline-block;">${donnees.total.toFixed(2)}h</span>
        </td>
      </tr>`;

    donnees.saisies.forEach(saisie => {
      lignesHtml += `
        <tr style="border-bottom: 1px solid #f1f3f4;">
          <td style="padding: 8px 10px 8px 24px; font-size: 12px; color: #444746;">
            <span style="color: #0b57d0; margin-right: 4px;">•</span> ${escHtml_(saisie.projet)} - ${escHtml_(saisie.tache)}
          </td>
          <td style="padding: 8px 10px; text-align: right; font-size: 12px; color: #1f1f1f; font-weight: 500; white-space: nowrap;">
            ${saisie.heures.toFixed(2)}h
          </td>
        </tr>`;
    });
  });

  const avgBase = totalBase > 0 ? totalBase : 40;
  const equivalentJours = (report.totalSemaine / (avgBase / 5)).toFixed(2);

  const htmlEmail = `
    <meta charset="UTF-8">
    <div style="background-color: #f3f6fc; padding: 24px; font-family: 'Open Sans', 'Inter', system-ui, -apple-system, sans-serif; color: #1f1f1f; max-width: 600px; margin: 0 auto; border-radius: 16px;">
      <!-- Branding Header -->
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 700; color: #0b57d0; letter-spacing: -0.3px;">⏱️ Tracker Time</span>
      </div>
      
      <!-- Card Blanche -->
      <div style="background-color: #ffffff; border: 1px solid #e3e3e3; border-radius: 16px; padding: 24px; box-shadow: none;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1f1f1f; margin-top: 0; margin-bottom: 6px;">${t.weeklyTitle}</h2>
        <p style="font-size: 13px; color: #444746; margin-top: 0; margin-bottom: 20px;">${t.weeklyWeek} ${numeroSemaine}</p>
        
        <!-- KPI Card -->
        <div style="margin-bottom: 24px; background-color: #f8f9fa; border: 1px solid #e3e3e3; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #0b57d0;">
          <p style="margin: 0; font-size: 13px; color: #444746; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${t.weeklyTotal}</p>
          <h1 style="margin: 10px 0; font-size: 42px; color: #1f1f1f; font-weight: 300; line-height: 1;">${report.totalSemaine.toFixed(2)}h</h1>
          <p style="margin: 0; font-size: 13px; color: #444746;">${t.weeklyEquivalent} <strong>${equivalentJours} ${t.weeklyDays}</strong> (${t.weeklyGoal} : ${totalBase}h)</p>
        </div>
        
        <h3 style="font-size: 12px; color: #1f1f1f; font-weight: 600; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">${t.weeklyDetails}</h3>
        
        <div style="overflow-x: auto; border: 1px solid #e3e3e3; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background-color: #ffffff;">
            <tbody>
              ${lignesHtml}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #444746; line-height: 1.4;">
        <p style="margin: 0 0 10px 0;">${t.weeklyFooter}</p>
        <div style="margin-top: 14px; display: flex; justify-content: center; gap: 16px; font-size: 10px;">
          <span style="font-weight: bold; color: #444746;">⚡ FF Labs</span>
          <a href="https://faucheux.bzh" target="_blank" style="color: #0b57d0; text-decoration: none; font-weight: 600;">&lt;&gt; par Fabrice Faucheux</a>
        </div>
      </div>
    </div>`;

  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: `${t.weeklySubject} S${numeroSemaine} - ${report.totalSemaine.toFixed(2)}h`,
    htmlBody: htmlEmail
  });
}

/**
 * Fusionne les doublons (même projet et même tâche) enregistrés aujourd'hui dans le Journal.
 */
function dedoublonnerJournalDuJour() {
  assurerPresenceOnglets_();

  const tableur = obtenirTableur_();
  const fuseau = tableur.getSpreadsheetTimeZone();
  const onglet = tableur.getSheetByName(NOMS_ONGLETS.JOURNAL);
  const maintenant = new Date();
  const todayKey = obtenirCleDatePourDate_(maintenant, fuseau);
  const heuresDeBase = obtenirHeuresDeBaseAujourdhui_();

  if (onglet.getLastRow() < 2) return;

  const todayRows = obtenirLignesJournalPourDate_(onglet, maintenant, fuseau);
  const groups = {};

  todayRows.forEach(ligne => {
    const projet = normaliserTexte_(ligne.values[1]);
    const tache = normaliserTexte_(ligne.values[2]);

    const key = [
      normaliserTexteComparaison_(projet),
      normaliserTexteComparaison_(tache)
    ].join('||');

    if (!groups[key]) {
      groups[key] = {
        projet,
        tache,
        rows: [],
        totalHeures: 0
      };
    }

    groups[key].rows.push(ligne);
    groups[key].totalHeures += parseFloat(ligne.values[3]) || 0;
  });

  Object.values(groups).forEach(group => {
    if (group.rows.length <= 1) return;

    const rowsSorted = group.rows.sort((a, b) => a.rowIndex - b.rowIndex);
    const rowToKeep = rowsSorted[0];
    const rowsToDelete = rowsSorted.slice(1);

    onglet
      .getRange(rowToKeep.rowIndex, 2, 1, 5)
      .setValues([[
        group.projet,
        group.tache,
        group.totalHeures,
        ratioSecurise_(group.totalHeures, heuresDeBase),
        todayKey
      ]]);

    rowsToDelete
      .map(ligne => ligne.rowIndex)
      .sort((a, b) => b - a)
      .forEach(rowIndex => onglet.deleteRow(rowIndex));
  });

  SpreadsheetApp.getUi().alert('✅ Doublons du jour fusionnés.');
}