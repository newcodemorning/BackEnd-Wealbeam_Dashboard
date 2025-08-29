const SUPPORTED_LANGUAGES = ['en', 'ar'];
const DEFAULT_LANGUAGE = 'en';

const translateMiddleware = (req, res, next) => {
    let lang = req.params.lang || req.query.lang || req.headers['accept-language'];

    if (lang) {
        lang = lang.toLowerCase().split(',')[0]; 
    }

    req.lang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;

    next();
};

module.exports = translateMiddleware;
