const multer = require("multer");
const path = require("path");
const fs = require("fs");

let uploadDir = path.resolve("uploads");
console.log(`[FILE UPLOAD] Development mode: using upload directory at ${uploadDir}`);
console.log(`Current Environment: ${process.env.ENVIRONMENT}`);

if (process.env.ENVIRONMENT === "production") {
    uploadDir = "/var/www/files";
    console.log(`[FILE UPLOAD] Production mode: using fixed upload directory at ${uploadDir}`);
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_FILE_COUNT = 10; // Maximum 10 files

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedExtensions = [
    ".jpg", ".jpeg", ".png", ".gif", ".bmp",
    ".webp", ".tiff", ".tif", ".svg", ".ico",
    ".heic", ".heif",
    ".pdf", ".doc", ".docx", ".txt",
    ".xls", ".xlsx", ".csv",
    ".ppt", ".pptx",
    ".zip", ".rar"
];

const allowedMimeTypes = [
    "image/jpeg", "image/png", "image/gif", "image/bmp",
    "image/webp", "image/tiff", "image/svg+xml",
    "image/x-icon", "image/vnd.microsoft.icon",
    "image/heic", "image/heif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-rar-compressed"
];


function getFileTypeFolder(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const imageExtensions = [
        ".jpg", ".jpeg", ".png", ".gif", ".bmp",
        ".webp", ".tiff", ".tif", ".svg", ".ico",
        ".heic", ".heif"
    ];
    const documentExtensions = [
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"
    ];
    if (imageExtensions.includes(ext)) {
        return "images";
    } else if (documentExtensions.includes(ext)) {
        return "documents";
    } else {
        return "others";
    }
}



const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isExtensionValid = allowedExtensions.includes(ext);
    const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);

    if (isExtensionValid && isMimeTypeValid) {
        cb(null, true);
    } else {
        const errorMessage = `Invalid file type. Only allowed extensions: ${allowedExtensions.join(", ")}`;
        cb(new Error(errorMessage));
    }
};

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const typeFolder = getFileTypeFolder(file.originalname);
            const sub_root_dir = req.meta && req.meta.type ? req.meta.type : "general";
            const subDir = path.join(uploadDir, sub_root_dir, year.toString(), month, day, typeFolder);
            if (!fs.existsSync(subDir)) {
                fs.mkdirSync(subDir, { recursive: true });
            }
            cb(null, subDir);
        },
        filename: (req, file, cb) => {
            const now = new Date();
            const ext = path.extname(file.originalname).toLowerCase();
            const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9-_]/g, "");
            const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
            const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const prefix = "FILE";
            const finalName = `${prefix}_${baseName}_${dateStr}_${uniqueSuffix}${ext}`;

            // Store relative path on file object
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const typeFolder = getFileTypeFolder(file.originalname);
            const sub_root_dir = req.meta && req.meta.type ? req.meta.type : "general";
            file.relativePath = `${sub_root_dir}/${year}/${month}/${day}/${typeFolder}/${finalName}`;

            cb(null, finalName);
        }
    }),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILE_COUNT
    },
    fileFilter
});

// Enhanced middleware for single file upload
const uploadSingle = (fieldName) => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({
                            status: "error",
                            message: "File size too large. Maximum size is 15MB."
                        });
                    }
                }

                return res.status(400).json({
                    status: "error",
                    message: err.message
                });
            }

            if (req.file) {
                req.uploadedFileName = req.file.filename;
                req.uploadedFilePath = req.file.path.replace(uploadDir + path.sep, '').replace(/\\/g, '/');
            }

            next();
        });
    };
};

const uploadMultiple = (fieldName, maxCount = 10) => {
    return (req, res, next) => {
        upload.array(fieldName, maxCount)(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({
                            status: "error",
                            message: "File size too large. Maximum size is 15MB per file."
                        });
                    }
                    if (err.code === 'LIMIT_FILE_COUNT') {
                        return res.status(400).json({
                            status: "error",
                            message: `Too many files. Maximum ${maxCount} files allowed.`
                        });
                    }
                }

                return res.status(400).json({
                    status: "error",
                    message: err.message
                });
            }

            if (req.files && req.files.length > 0) {
                req.uploadedFileNames = req.files.map(file => file.filename);
                req.uploadedFilePaths = req.files.map(file =>
                    file.path.replace(uploadDir + path.sep, '').replace(/\\/g, '/')
                );
            }

            next();
        });
    };
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    uploader: upload
};


/**\
 * #documentation 
 * 
 * File Upload Middleware using Multer
 *
 * Features:
 * - Supports both single and multiple file uploads.
 * - Saves files in structured directories by date and type (images, documents, others).
 * - Allows only specific extensions and MIME types for security.
 * - Adds unique filenames with prefix, sanitized original name, date, and random suffix.
 * - Restricts max file size (15MB) and max file count (10).
 * - Provides error handling for common Multer errors (size, count, invalid type).
 * - Returns both filename and full relative path for uploaded files.
 *
 * Usage Examples:
 * 
 * 1) Uploading multiple fields:
 * router.post("/add", upload.fields([
 *     { name: "nationalIdImage", maxCount: 1 },
 *     { name: "highSchoolCertificate", maxCount: 1 }
 * ]), createApplicant);
 *
 * const nationalIdImage = req.files?.nationalIdImage?.[0]?.filename || null;
 * const nationalIdImagePath = req.files?.nationalIdImage?.[0]?.path.replace(uploadDir + path.sep, '').replace(/\\/g, '/') || null;
 * const highSchoolCertificate = req.files?.highSchoolCertificate?.[0]?.filename || null;
 * const otherDocuments = req.files?.otherDocuments?.map(file => file.path.replace(uploadDir + path.sep, '').replace(/\\/g, '/')) || [];
 *
 * 2) Uploading single file with middleware:
 * router.post("/upload-single", uploadSingle("singleFile"), (req, res) => {
 *   if (!req.file) return res.status(400).json({ status: "error", message: "No file uploaded" });
 *   res.json({ 
 *     status: "success", 
 *     filename: req.uploadedFileName,
 *     filepath: req.uploadedFilePath 
 *   });
 * });
 *
 * 3️) Uploading multiple files with middleware:
 * router.post("/upload-multiple", uploadMultiple("multiFiles", 5), (req, res) => {
 *   res.json({ 
 *     status: "success", 
 *     filenames: req.uploadedFileNames,
 *     filepaths: req.uploadedFilePaths 
 *   });
 * });
 *
 * Notes:
 * - Default upload directory is "./uploads/blogs" (changes to "/var/www/files" in production).
 * - Subdirectories are automatically created: /year/month/day/{images|documents|others}.
 * - Only allowed file types/extensions will be stored.
 * - Full relative paths are available via req.uploadedFilePath (single) or req.uploadedFilePaths (multiple).
 * - Paths are normalized with forward slashes for cross-platform compatibility.
 */