import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const pasta = "uploads";
fs.mkdirSync(pasta, { recursive: true });

const storage = multer.diskStorage({
    destination: pasta,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, crypto.randomUUID() + ext);
    }
});

const tiposOk = ["image/jpeg", "image/png", "image/webp"];

export const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!tiposOk.includes(file.mimetype)) {
            return cb(new Error("Envie uma imagem JPG, PNG ou WEBP"));
        }
        cb(null, true);
    }
});