const i18n = require('../config/i18n');

const SUPPORTED_LANGUAGES = ['en', 'ar'];
const DEFAULT_LANGUAGE = 'en';

const translateMiddleware = (req, res, next) => {
    let lang = req.params.lang;
    req.lang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;

    // Set locale for i18n
    i18n.setLocale(req.lang);

    // Add translation function to request
    req.translate = (key, options) => i18n.__(key, options);
    req.translateN = (key, count, options) => i18n.__n(key, count, options);

    next();
};

module.exports = translateMiddleware;