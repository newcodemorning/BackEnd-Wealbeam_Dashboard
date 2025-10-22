const i18n = require('i18n');
const path = require('path');

// Configure i18n
i18n.configure({
    locales: ['en', 'ar', 'fr'], // Add new language here
    directory: path.join(__dirname, '../locales'),
    defaultLocale: 'en',
    objectNotation: true,
    updateFiles: false,
    api: {
        __: 'translate',
        __n: 'translateN'
    }
});

module.exports = i18n;
