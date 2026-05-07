/**
 * ============================================================================
 *  TRAQUEUR DE TEMPS (Time Tracker) - Google Apps Script
 * ============================================================================
 *  Auteur      : Fabrice Faucheux (https://faucheux.bzh)
 *  Version     : 2.1
 *  
 *  Description :
 *  Application complète et autonome de suivi du temps de travail, conçue pour 
 *  fonctionner nativement comme module complémentaire dans Google Sheets.
 *
 *  Fonctionnalités principales :
 *  - Interface (Sidebar) fluide offrant un chronomètre en direct ou une saisie manuelle.
 *  - Gestion dynamique et bilingue (Français / Anglais) de l'interface et des rapports.
 *  - Calcul intelligent des quotas journaliers de travail (paramétrables par jour).
 *  - Rapports e-mail automatisés : alertes d'objectif quotidien et bilans hebdomadaires.
 *  - Traitement sécurisé (LockService) pour éviter les doublons lors des saisies simultanées.
 * ============================================================================
 */


/**
 * ============================================================
 *  CONFIGURATION GLOBALE
 * ============================================================
 */

const HEURES_BASE_DEFAUT = 8;
const TAILLE_LOT_JOURNAL = 500;

const NOMS_ONGLETS = {
    CONFIG: 'Config',
    JOURNAL: 'Journal',
    PARAMETRES: 'Paramètres'
};

const ENTETES_CONFIG = ['Projet', 'Tâche'];
const ENTETES_JOURNAL = ['Date', 'Projet', 'Tâche', 'Heures', 'Jours', 'DateKey'];
const ENTETES_PARAMETRES = ['Jour', 'Heures'];

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];


/**
 * ============================================================
 *  UTILITAIRES GÉNÉRAUX
 * ============================================================
 */

function obtenirTableur_() {
    return SpreadsheetApp.getActiveSpreadsheet();
}

function obtenirFuseauHoraire_() {
    return obtenirTableur_().getSpreadsheetTimeZone();
}

function normaliserTexte_(valeur) {
    return String(valeur || '').trim();
}

function normaliserCle_(valeur) {
    return normaliserTexte_(valeur).toLowerCase();
}

function normaliserTexteComparaison_(valeur) {
    return String(valeur || '')
        .normalize('NFKC')
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function obtenirChaineDatePourDate_(date, fuseau) {
    return Utilities.formatDate(date, fuseau || obtenirFuseauHoraire_(), 'dd/MM/yyyy');
}

function obtenirCleDatePourDate_(date, fuseau) {
    return Utilities.formatDate(date, fuseau || obtenirFuseauHoraire_(), 'yyyy-MM-dd');
}

function obtenirDateDuJourStr_() {
    return obtenirChaineDatePourDate_(new Date(), obtenirFuseauHoraire_());
}

function obtenirCleAujourdhui_() {
    return obtenirCleDatePourDate_(new Date(), obtenirFuseauHoraire_());
}

function analyserChaineDateFrancaise_(chaineDate) {
    const parts = String(chaineDate || '').split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month, day);
}

function formaterCelluleDate_(valeur, fuseau) {
    if (valeur instanceof Date) {
        return obtenirChaineDatePourDate_(valeur, fuseau || obtenirFuseauHoraire_());
    }

    const raw = normaliserTexte_(valeur);
    if (!raw) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [year, month, day] = raw.split('-');
        return `${day}/${month}/${year}`;
    }

    return raw;
}

function obtenirCleDateDepuisCellule_(valeur, fuseau) {
    if (valeur instanceof Date) {
        return obtenirCleDatePourDate_(valeur, fuseau || obtenirFuseauHoraire_());
    }

    const raw = normaliserTexte_(valeur);
    if (!raw) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return raw;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [day, month, year] = raw.split('/');
        return `${year}-${month}-${day}`;
    }

    return '';
}

function obtenirNomJourFrancais_(date, fuseau) {
    const dayIndex = parseInt(Utilities.formatDate(date, fuseau || obtenirFuseauHoraire_(), 'u'), 10);
    return JOURS_FR[dayIndex === 7 ? 0 : dayIndex];
}

function obtenirCarteHeuresDeBase_() {
    const tableur = obtenirTableur_();
    const onglet = tableur.getSheetByName(NOMS_ONGLETS.PARAMETRES);
    const map = {};

    if (!onglet || onglet.getLastRow() < 2) return map;

    const values = onglet.getRange(2, 1, onglet.getLastRow() - 1, 2).getValues();

    values.forEach(([jour, heures]) => {
        const key = normaliserCle_(jour);
        if (!key) return;

        const parsedHours = parseFloat(heures);
        map[key] = isNaN(parsedHours) || parsedHours < 0 ? HEURES_BASE_DEFAUT : parsedHours;
    });

    return map;
}

function obtenirHeuresDeBasePourDateDepuisCarte_(date, carteHeuresBase, fuseau) {
    const nomJour = obtenirNomJourFrancais_(date, fuseau || obtenirFuseauHoraire_());
    const key = normaliserCle_(nomJour);

    if (Object.prototype.hasOwnProperty.call(carteHeuresBase, key)) {
        return carteHeuresBase[key];
    }

    return HEURES_BASE_DEFAUT;
}

function obtenirHeuresDeBasePourDate_(date) {
    return obtenirHeuresDeBasePourDateDepuisCarte_(date, obtenirCarteHeuresDeBase_(), obtenirFuseauHoraire_());
}

function obtenirHeuresDeBaseAujourdhui_() {
    return obtenirHeuresDeBasePourDate_(new Date());
}

function ratioSecurise_(heures, heuresDeBase) {
    return heuresDeBase > 0 ? heures / heuresDeBase : 0;
}


/**
 * ============================================================
 *  CRÉATION ET CONTRÔLE DES ONGLETS
 * ============================================================
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
        onglet.getRange('A1:B1').setFontWeight('bold').setBackground('#E8DEF8');
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
        onglet.getRange(1, 1, 1, ENTETES_JOURNAL.length).setFontWeight('bold').setBackground('#E8DEF8');
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
        // Colonne déjà masquée ou non disponible. Rien de bloquant.
    }
}

function assurerOngletParametres_(tableur) {
    let onglet = tableur.getSheetByName(NOMS_ONGLETS.PARAMETRES);

    if (!onglet) {
        onglet = tableur.insertSheet(NOMS_ONGLETS.PARAMETRES);
        onglet.getRange(1, 1, 1, ENTETES_PARAMETRES.length).setValues([ENTETES_PARAMETRES]);
        onglet.getRange('A1:B1').setFontWeight('bold').setBackground('#E8DEF8');

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
    onglet.getRange(1, 1, 1, entetes.length).setFontWeight('bold').setBackground('#E8DEF8');

    if (onglet.getFrozenRows() < 1) {
        onglet.setFrozenRows(1);
    }
}


/**
 * Remplit la colonne technique DateKey pour les anciennes lignes du Journal.
 * À lancer une fois depuis le menu si le Journal contient déjà beaucoup d'historique.
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
 * ============================================================
 *  MENU, SIDEBAR ET WEB APP
 * ============================================================
 */

function onOpen() {
    assurerPresenceOnglets_();

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
        .addSeparator()
        .addItem('ℹ️ À Propos', 'afficherAPropos')
        .addToUi();
}

function afficherBarreLaterale() {
    assurerPresenceOnglets_();

    const title = obtenirLangueUtilisateur() === 'fr' ? 'Traqueur de temps' : 'Time Tracker';
    const html = HtmlService.createHtmlOutputFromFile('index')
        .setTitle(title)
        .setWidth(320);

    SpreadsheetApp.getUi().showSidebar(html);
}

function afficherAPropos() {
    const ui = SpreadsheetApp.getUi();
    const html = HtmlService.createHtmlOutput(`
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; text-align: center;">
            <h2 style="color: #6750A4;">Traqueur de temps</h2>
            <p>Version 2.1 - Suivi du temps de travail autonome et automatisé.</p>
            <hr style="border: 0; height: 1px; background: #eee; margin: 20px 0;">
            <p style="font-size: 14px; color: #555;">Développé par</p>
            <h3 style="margin: 5px 0;">Fabrice Faucheux</h3>
            <a href="https://faucheux.bzh" target="_blank" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #6750A4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Visiter faucheux.bzh
            </a>
        </div>
    `).setWidth(350).setHeight(280);
    ui.showModalDialog(html, 'À Propos de ce script');
}

function doGet() {
    assurerPresenceOnglets_();

    const title = obtenirLangueUtilisateur() === 'fr' ? 'Traqueur de temps' : 'Time Tracker';

    return HtmlService.createHtmlOutputFromFile('index')
        .setTitle(title)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function obtenirLangueUtilisateur() {
    try {
        const locale = obtenirTableur_().getSpreadsheetLocale() || 'fr_FR';
        return String(locale).toLowerCase().startsWith('fr') ? 'fr' : 'en';
    } catch (e) {
        return 'fr';
    }
}


/**
 * ============================================================
 *  CHARGEMENT SIDEBAR
 * ============================================================
 */

/**
 * Appel optimisé pour une future version de index.html.
 * Il regroupe locale, projets, tâches et historique du jour en un seul aller-retour serveur.
 */
function obtenirDonneesInitialesBarreLaterale() {
    assurerPresenceOnglets_();

    return {
        locale: obtenirLangueUtilisateur(),
        projectsAndTasks: obtenirProjetsEtTaches_(),
        aujourdhui: obtenirSaisiesAujourdhui_()
    };
}

function obtenirProjetsEtTaches() {
    assurerPresenceOnglets_();
    return obtenirProjetsEtTaches_();
}

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

function obtenirSaisiesAujourdhui() {
    assurerPresenceOnglets_();
    return obtenirSaisiesAujourdhui_();
}

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
 * Lecture rapide des lignes d'une date donnée.
 * Le Journal est supposé alimenté chronologiquement par appendRow.
 * On lit par paquets depuis le bas pour éviter de parcourir tout l'historique.
 */
function obtenirLignesJournalPourDate_(onglet, dateCible, fuseau) {
    const lastRow = onglet.getLastRow();
    if (lastRow < 2) return [];

    const targetKey = obtenirCleDatePourDate_(dateCible, fuseau);
    const rowsByIndex = {};

    // 1. Recherche rapide via la colonne technique DateKey.
    // C'est le chemin normal pour les nouvelles lignes.
    try {
        const dateKeyRange = onglet.getRange(2, 6, lastRow - 1, 1);
        const matches = dateKeyRange
            .createTextFinder(targetKey)
            .matchEntireCell(true)
            .findAll();

        matches.forEach(cell => {
            const rowIndex = cell.getRow();
            const values = onglet
                .getRange(rowIndex, 1, 1, ENTETES_JOURNAL.length)
                .getValues()[0];

            rowsByIndex[rowIndex] = { rowIndex, values };
        });
    } catch (e) {
        // Si TextFinder échoue, le balayage de secours prend le relais.
    }

    // 2. Balayage de secours.
    // Important : on ne s'arrête plus dès qu'on croise une date plus ancienne.
    // Cela évite de rater une ligne si le Journal a été trié ou modifié manuellement.
    for (let endRow = lastRow; endRow >= 2; endRow -= TAILLE_LOT_JOURNAL) {
        const startRow = Math.max(2, endRow - TAILLE_LOT_JOURNAL + 1);
        const height = endRow - startRow + 1;

        const values = onglet
            .getRange(startRow, 1, height, ENTETES_JOURNAL.length)
            .getValues();

        values.forEach((ligne, index) => {
            const rowIndex = startRow + index;
            const rowKey = normaliserTexte_(ligne[5]) || obtenirCleDateDepuisCellule_(ligne[0], fuseau);

            if (rowKey === targetKey) {
                rowsByIndex[rowIndex] = { rowIndex, values: ligne };
            }
        });
    }

    return Object.keys(rowsByIndex)
        .map(Number)
        .sort((a, b) => a - b)
        .map(rowIndex => rowsByIndex[rowIndex]);
}

function obtenirLignesJournalEntreDates_(onglet, dateDebut, dateFin, fuseau) {
    const lastRow = onglet.getLastRow();
    if (lastRow < 2) return [];

    const startKey = obtenirCleDatePourDate_(dateDebut, fuseau);
    const endKey = obtenirCleDatePourDate_(dateFin, fuseau);
    const rows = [];

    let shouldContinue = true;

    for (let endRow = lastRow; endRow >= 2 && shouldContinue; endRow -= TAILLE_LOT_JOURNAL) {
        const startRow = Math.max(2, endRow - TAILLE_LOT_JOURNAL + 1);
        const height = endRow - startRow + 1;
        const values = onglet.getRange(startRow, 1, height, ENTETES_JOURNAL.length).getValues();

        for (let i = values.length - 1; i >= 0; i--) {
            const ligne = values[i];
            const rowKey = normaliserTexte_(ligne[5]) || obtenirCleDateDepuisCellule_(ligne[0], fuseau);

            if (rowKey >= startKey && rowKey <= endKey) {
                rows.unshift({ rowIndex: startRow + i, values: ligne, dateKey: rowKey });
                continue;
            }

            if (rowKey && rowKey < startKey) {
                shouldContinue = false;
                break;
            }
        }
    }

    return rows;
}


/**
 * ============================================================
 *  ÉCRITURE JOURNAL
 * ============================================================
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
            // Ne pas retirer plus d'heures qu'il n'y en a déjà sur la ligne
            if (actualDuration < 0) {
                actualDuration = Math.max(actualDuration, -heuresActuelles);
            }
            const newRowHours = heuresActuelles + actualDuration;

            if (newRowHours <= 0) {
                // S'il n'y a plus d'heures, on met à 0
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
 * ============================================================
 *  AJOUT MANUEL DEPUIS LE MENU SHEETS
 * ============================================================
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
 * ============================================================
 *  DICTIONNAIRE E-MAILS I18N
 * ============================================================
 */

const EMAIL_I18N = {
    fr: {
        dailyGoalReached: 'Objectif du jour atteint',
        dailySubject: '📊 Ventilation suivi des temps',
        dailyTitle: 'Ventilation de votre temps',
        dailyStatus: 'Statut',
        dailyTotal: 'Total à saisir',
        dailyDay: 'jour',
        dailyBase: 'base',
        dailyDetails: 'Détails',
        dailyFooter: 'Généré automatiquement via Apps Script.',
        weeklySubject: '📊 Bilan Hebdo Tracker Time',
        weeklyTitle: 'Bilan Hebdomadaire Tracker Time',
        weeklyWeek: 'Semaine',
        weeklyTotal: 'Total de la semaine',
        weeklyEquivalent: 'soit environ',
        weeklyDays: 'jours',
        weeklyGoal: 'Objectif de la semaine',
        weeklyDetails: 'Détails par jour',
        weeklyFooter: 'Tracker Time - Rapport généré automatiquement en fin de semaine.'
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
        weeklyDays: 'jours',
        weeklyGoal: 'Weekly Goal',
        weeklyDetails: 'Daily Details',
        weeklyFooter: 'Tracker Time - Automatically generated weekly report.'
    }
};


/**
 * ============================================================
 *  E-MAIL QUOTIDIEN
 * ============================================================
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
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee;color:#555">${key}</td>
      <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500;color:#1a73e8">${(valeur / heuresDeBase).toFixed(2)} ${t.dailyDay}</td>
    </tr>`).join('');

    const htmlEmail = `
    <div style="background:#f8f9fa;padding:20px;font-family:'Roboto',Arial,sans-serif;color:#3c4043">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,.1);border:1px solid #dadce0">
        <div style="background:#1a73e8;padding:24px;color:#fff">
          <h2 style="margin:0;font-size:20px;font-weight:400">${t.dailyTitle}</h2>
          <p style="margin:4px 0 0;opacity:.9;font-size:14px">${dateDuJourStr}</p>
        </div>
        <div style="padding:24px">
          <div style="margin-bottom:24px">
            <span style="font-size:12px;color:#70757a;text-transform:uppercase;letter-spacing:.8px;font-weight:700">${t.dailyStatus}</span><br>
            <span style="display:inline-block;margin-top:4px;font-size:13px;font-weight:500;color:#1e8e3e;background:#e6f4ea;padding:4px 12px;border-radius:16px">${safeReason}</span>
          </div>
          <div style="margin-bottom:32px;background:#f8f9fa;padding:16px;border-radius:8px;border-left:4px solid #1a73e8">
            <p style="margin:0;font-size:14px;color:#70757a">${t.dailyTotal}</p>
            <h1 style="margin:0;font-size:48px;color:#1a73e8;font-weight:300">${totalInDays} <span style="font-size:20px">${t.dailyDay}</span></h1>
            <p style="margin:0;font-size:11px;color:#9aa0a6">${totalHeures.toFixed(2)}h (${t.dailyBase} ${heuresDeBase}h/j)</p>
          </div>
          <h3 style="font-size:13px;color:#3c4043;font-weight:700;text-transform:uppercase;margin-bottom:12px">${t.dailyDetails}</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">${lignesHtml}</table>
        </div>
        <div style="background:#f1f3f4;padding:16px;text-align:center;font-size:11px;color:#70757a">
          ${t.dailyFooter}
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
 * ============================================================
 *  RAPPORT HEBDOMADAIRE
 * ============================================================
 */

function obtenirRapportHebdomadaire(lang) {
    assurerPresenceOnglets_();

    const tableur = obtenirTableur_();
    const fuseau = tableur.getSpreadsheetTimeZone();
    const onglet = tableur.getSheetByName(NOMS_ONGLETS.JOURNAL);

    if (onglet.getLastRow() < 2) return { jours: {}, totalSemaine: 0 };

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
    const joursResultat = {};
    let totalSemaine = 0;

    for (let i = 0; i < 7; i++) {
        const d = new Date(lundi);
        d.setDate(lundi.getDate() + i);

        const key = Utilities.formatDate(d, fuseau, 'yyyy-MM-dd');
        const nomJour = dayNames[d.getDay()];
        const chaineDate = Utilities.formatDate(d, fuseau, 'dd/MM');
        const displayKey = `${nomJour} ${chaineDate}`;

        joursInternes[key] = {
            saisies: [],
            total: 0,
            heuresDeBase: obtenirHeuresDeBasePourDateDepuisCarte_(d, carteHeuresBase, fuseau)
        };
        // Conserver l'ordre exact d'affichage (du lundi au dimanche)
        joursResultat[displayKey] = joursInternes[key];
    }

    const rows = obtenirLignesJournalEntreDates_(onglet, lundi, dimanche, fuseau);

    rows.forEach(({ values, dateKey }) => {
        // Utilisation robuste de DateKey (yyyy-MM-dd) pour s'affranchir des problèmes de fuseau horaire
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

function configurerDeclencheurHebdo() {
    const interfaceUtilisateur = SpreadsheetApp.getUi();
    const triggers = ScriptApp.getProjectTriggers();
    
    // Purger les anciens déclencheurs pour éviter les doublons ou appels morts
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

    Object.entries(report.jours).forEach(([nomJour, donnees]) => {
        totalBase += donnees.heuresDeBase;

        const isOff = donnees.heuresDeBase === 0;
        const pct = isOff ? 0 : Math.round((donnees.total / donnees.heuresDeBase) * 100);
        const color = pct >= 100 ? '#1e8e3e' : (pct >= 75 ? '#e8a317' : '#70757a');

        lignesHtml += `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;color:#3c4043;font-weight:500;">
          ${nomJour} <span style="font-size:11px;color:#9aa0a6;font-weight:normal">(${donnees.heuresDeBase}h)</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:${color}">
          ${donnees.total.toFixed(2)}h
        </td>
      </tr>`;

        donnees.saisies.forEach(saisie => {
            lignesHtml += `
        <tr>
          <td colspan="2" style="padding:4px 0 4px 16px;border-bottom:1px solid #f8f9fa;font-size:12px;color:#555;">
            <span style="color:#6750A4">▪</span> ${saisie.projet} - ${saisie.tache} <span style="float:right;color:#70757a">${saisie.heures.toFixed(2)}h</span>
          </td>
        </tr>`;
        });
    });

    const avgBase = totalBase > 0 ? totalBase : 40;
    const equivalentJours = (report.totalSemaine / (avgBase / 5)).toFixed(2);

    const htmlEmail = `
    <div style="background:#f8f9fa;padding:20px;font-family:'Inter','Roboto',Arial,sans-serif;color:#3c4043">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,.05);border:1px solid #dadce0">
        <div style="background:#6750A4;padding:24px;color:#fff;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:500">${t.weeklyTitle}</h2>
          <p style="margin:4px 0 0;opacity:.9;font-size:14px">${t.weeklyWeek} ${numeroSemaine}</p>
        </div>
        <div style="padding:24px">
          <div style="margin-bottom:32px;background:#f5f0fa;padding:20px;border-radius:8px;text-align:center;border:1px solid #eaddff">
            <p style="margin:0;font-size:14px;color:#6750A4;font-weight:600;text-transform:uppercase;letter-spacing:1px">${t.weeklyTotal}</p>
            <h1 style="margin:10px 0;font-size:42px;color:#1C1B1F;font-weight:300">${report.totalSemaine.toFixed(2)}h</h1>
            <p style="margin:0;font-size:13px;color:#79747E">${t.weeklyEquivalent} <strong>${equivalentJours} ${t.weeklyDays}</strong> (${t.weeklyGoal} : ${totalBase}h)</p>
          </div>

          <h3 style="font-size:13px;color:#3c4043;font-weight:700;text-transform:uppercase;margin-bottom:12px">${t.weeklyDetails}</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">${lignesHtml}</table>
        </div>
        <div style="background:#f1f3f4;padding:16px;text-align:center;font-size:11px;color:#70757a">
          ${t.weeklyFooter}
        </div>
      </div>
    </div>`;

    MailApp.sendEmail({
        to: Session.getActiveUser().getEmail(),
        subject: `${t.weeklySubject} S${numeroSemaine} - ${report.totalSemaine.toFixed(2)}h`,
        htmlBody: htmlEmail
    });
}

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