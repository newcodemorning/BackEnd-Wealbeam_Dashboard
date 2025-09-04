function translateFields(obj, lang) {
    if (Array.isArray(obj)) {
        return obj.map(item => translateFields(item, lang));
    } else if (obj && typeof obj === "object") {
        // لو object فيه {en, ar}
        if ("en" in obj && "ar" in obj && Object.keys(obj).length === 2) {
            return obj[lang] ?? obj.en; // fallback لو اللغة مش موجودة
        }

        // لو object عادي، نكرر لكل property
        const newObj = {};
        for (const key in obj) {
            newObj[key] = translateFields(obj[key], lang);
        }
        return newObj;
    }
    return obj; // primitive values (string, number, etc.)
}
module.exports = translateFields;