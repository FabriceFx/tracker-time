/**
 * ============================================================================
 *  TRAQUEUR DE TEMPS (Time Tracker)
 * ============================================================================
 *  Auteur      : Fabrice Faucheux (https://faucheux.bzh)
 *  Projet      : FF Labs - Traqueur de temps
 *  Rôle        : Utilitaires de traitement de dates, de textes et d'inclusion HTML.
 *  Version     : 2.2.0
 * ============================================================================
 */

/**
 * Inclut le contenu d'un fichier HTML (CSS ou JS) directement dans un template.
 * Utile pour modulariser les fichiers Stylesheet.html et JavaScript.html.
 *
 * @param {string} filename - Le nom du fichier à inclure (sans extension .html).
 * @return {string} Le contenu textuel brut du fichier.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Récupère le tableur actif.
 *
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet} Le Spreadsheet actif.
 */
function obtenirTableur_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Récupère le fuseau horaire défini pour le tableur.
 *
 * @return {string} Le fuseau horaire.
 */
function obtenirFuseauHoraire_() {
  return obtenirTableur_().getSpreadsheetTimeZone();
}

/**
 * Normalise et nettoie une chaîne de texte (trim).
 *
 * @param {*} valeur - La valeur à normaliser.
 * @return {string} Le texte normalisé et nettoyé.
 */
function normaliserTexte_(valeur) {
  return String(valeur || '').trim();
}

/**
 * Normalise une chaîne en minuscules et trimée.
 *
 * @param {*} valeur - La valeur à normaliser.
 * @return {string} Le texte normalisé.
 */
function normaliserCle_(valeur) {
  return normaliserTexte_(valeur).toLowerCase();
}

/**
 * Normalise le texte pour des comparaisons robustes de doublons.
 *
 * @param {*} valeur - La valeur à normaliser.
 * @return {string} Le texte normalisé en minuscules, normalisé NFKC.
 */
function normaliserTexteComparaison_(valeur) {
  return String(valeur || '')
    .normalize('NFKC')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Formate une date en chaîne française (dd/MM/yyyy).
 *
 * @param {Date} date - La date à formater.
 * @param {string} [fuseau] - Le fuseau horaire.
 * @return {string} La date formatée.
 */
function obtenirChaineDatePourDate_(date, fuseau) {
  return Utilities.formatDate(date, fuseau || obtenirFuseauHoraire_(), 'dd/MM/yyyy');
}

/**
 * Formate une date en clé standardisée (yyyy-MM-dd).
 *
 * @param {Date} date - La date à formater.
 * @param {string} [fuseau] - Le fuseau horaire.
 * @return {string} La date formatée.
 */
function obtenirCleDatePourDate_(date, fuseau) {
  return Utilities.formatDate(date, fuseau || obtenirFuseauHoraire_(), 'yyyy-MM-dd');
}

/**
 * Récupère la chaîne de date du jour au format dd/MM/yyyy.
 *
 * @return {string} La date du jour formatée.
 */
function obtenirDateDuJourStr_() {
  return obtenirChaineDatePourDate_(new Date(), obtenirFuseauHoraire_());
}

/**
 * Récupère la clé de date du jour (yyyy-MM-dd).
 *
 * @return {string} La clé d'aujourd'hui.
 */
function obtenirCleAujourdhui_() {
  return obtenirCleDatePourDate_(new Date(), obtenirFuseauHoraire_());
}

/**
 * Analyse une chaîne de date au format français (dd/MM/yyyy) et retourne un objet Date.
 *
 * @param {string} chaineDate - La chaîne de date à analyser.
 * @return {Date|null} L'objet Date ou null si invalide.
 */
function analyserChaineDateFrancaise_(chaineDate) {
  const parts = String(chaineDate || '').split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

/**
 * Formate la date lue d'une cellule Sheets en chaîne française.
 *
 * @param {*} valeur - La valeur de la cellule.
 * @param {string} [fuseau] - Le fuseau horaire.
 * @return {string} La date formatée.
 */
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

/**
 * Extrait une clé de date (yyyy-MM-dd) robuste d'une cellule.
 *
 * @param {*} valeur - La valeur de la cellule.
 * @param {string} [fuseau] - Le fuseau horaire.
 * @return {string} La clé de date (yyyy-MM-dd) ou chaîne vide.
 */
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

/**
 * Retourne le nom du jour en français (Dimanche, Lundi, etc.) pour une date.
 *
 * @param {Date} date - La date.
 * @param {string} [fuseau] - Le fuseau.
 * @return {string} Le nom du jour.
 */
function obtenirNomJourFrancais_(date, fuseau) {
  const dayIndex = parseInt(Utilities.formatDate(date, fuseau || obtenirFuseauHoraire_(), 'u'), 10);
  return JOURS_FR[dayIndex === 7 ? 0 : dayIndex];
}

/**
 * Récupère sous forme de carte les quotas d'heures par jour configurés.
 *
 * @return {Object.<string, number>} Dictionnaire (jour minuscules => quota heures).
 */
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

/**
 * Récupère le quota d'heures pour une date donnée depuis la carte des quotas.
 *
 * @param {Date} date - La date cible.
 * @param {Object.<string, number>} carteHeuresBase - La carte pré-chargée.
 * @param {string} [fuseau] - Le fuseau horaire.
 * @return {number} Le quota d'heures.
 */
function obtenirHeuresDeBasePourDateDepuisCarte_(date, carteHeuresBase, fuseau) {
  const nomJour = obtenirNomJourFrancais_(date, fuseau || obtenirFuseauHoraire_());
  const key = normaliserCle_(nomJour);

  if (Object.prototype.hasOwnProperty.call(carteHeuresBase, key)) {
    return carteHeuresBase[key];
  }

  return HEURES_BASE_DEFAUT;
}

/**
 * Récupère le quota d'heures pour une date donnée (effectue un appel Sheets).
 *
 * @param {Date} date - La date.
 * @return {number} Le quota d'heures.
 */
function obtenirHeuresDeBasePourDate_(date) {
  return obtenirHeuresDeBasePourDateDepuisCarte_(date, obtenirCarteHeuresDeBase_(), obtenirFuseauHoraire_());
}

/**
 * Récupère le quota d'heures pour aujourd'hui.
 *
 * @return {number} Le quota d'heures.
 */
function obtenirHeuresDeBaseAujourdhui_() {
  return obtenirHeuresDeBasePourDate_(new Date());
}

/**
 * Calcule de façon sécurisée le ratio d'heures par rapport au quota sans division par zéro.
 *
 * @param {number} heures - Les heures saisies.
 * @param {number} heuresDeBase - Les heures attendues.
 * @return {number} Le ratio.
 */
function ratioSecurise_(heures, heuresDeBase) {
  return heuresDeBase > 0 ? heures / heuresDeBase : 0;
}

/**
 * Échappe le texte HTML pour éviter les injections XSS.
 *
 * @param {string} texte - Le texte à échapper.
 * @return {string} Le texte échappé.
 */
function escHtml_(texte) {
  return String(texte || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Purge les anciennes propriétés de session utilisateur (sent_seuil_*) obsolètes.
 */
function purgerAnciennesProprietes_() {
  try {
    const props = PropertiesService.getUserProperties();
    const all = props.getProperties();
    const aujourdhui = obtenirDateDuJourStr_();
    const cleAujourdhui = `sent_seuil_${aujourdhui}`;
    Object.keys(all).forEach(key => {
      if (key.startsWith('sent_seuil_') && key !== cleAujourdhui) {
        props.deleteProperty(key);
      }
    });
  } catch (e) {
    logEvent("Erreur de purge des propriétés utilisateur : " + e.message, "WARN");
  }
}
