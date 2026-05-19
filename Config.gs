/**
 * ============================================================================
 *  TRAQUEUR DE TEMPS (Time Tracker)
 * ============================================================================
 *  Auteur      : Fabrice Faucheux (https://faucheux.bzh)
 *  Projet      : FF Labs - Traqueur de temps
 *  Rôle        : Configuration globale et journalisation du projet.
 *  Version     : 2.2.0
 * ============================================================================
 */

/**
 * Objet de configuration central du projet.
 */
const CONFIG = {
  PROJECT_NAME: "Suivi des temps",
  VERSION: "2.2.0",
  DEBUG_MODE: false,
  COLORS: {
    PRIMARY: "#0b57d0",
    SECONDARY: "#444746"
  }
};

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
 * Système de journalisation unifié pour tous les projets FF Labs.
 * En mode CONFIG.DEBUG_MODE actif, les logs INFO sont également affichés.
 *
 * @param {string} message - Message de log.
 * @param {string} [level="INFO"] - Niveau de sévérité : INFO, WARN ou ERROR.
 */
function logEvent(message, level = "INFO") {
  if (level === "INFO" && !CONFIG.DEBUG_MODE) {
    return;
  }
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${CONFIG.PROJECT_NAME} v${CONFIG.VERSION}] [${level}] ${message}`;

  console.log(logMessage);

  if (level === "ERROR") {
    // Enregistrement d'erreur additionnel si nécessaire
  }
}
