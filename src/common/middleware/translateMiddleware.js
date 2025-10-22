const i18n = require('../../config/i18n');

const SUPPORTED_LANGUAGES = ['en', 'ar', 'fr']; 
const DEFAULT_LANGUAGE = 'en';

const translateMiddleware = (req, res, next) => {
    let lang = req.params.lang;
    req.lang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
    i18n.setLocale(req.lang);
    req.translate = (key, options) => i18n.__(key, options);
    req.translateN = (key, count, options) => i18n.__n(key, count, options);
    next();
};

module.exports = translateMiddleware;