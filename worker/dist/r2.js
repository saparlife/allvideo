"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.r2Client = void 0;
exports.downloadFile = downloadFile;
exports.uploadFile = uploadFile;
exports.uploadDirectory = uploadDirectory;
exports.fileExists = fileExists;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("./config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const promises_1 = require("stream/promises");
exports.r2Client = new client_s3_1.S3Client({
    region: "auto",
    endpoint: `https://${config_1.config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: config_1.config.r2.accessKeyId,
        secretAccessKey: config_1.config.r2.secretAccessKey,
    },
});
async function downloadFile(key, localPath) {
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const command = new client_s3_1.GetObjectCommand({
        Bucket: config_1.config.r2.bucket,
        Key: key,
    });
    const response = await exports.r2Client.send(command);
    if (!response.Body) {
        throw new Error("Empty response body");
    }
    const writeStream = fs.createWriteStream(localPath);
    await (0, promises_1.pipeline)(response.Body, writeStream);
}
async function uploadFile(localPath, key, contentType) {
    const fileContent = fs.readFileSync(localPath);
    const command = new client_s3_1.PutObjectCommand({
        Bucket: config_1.config.r2.bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
    });
    await exports.r2Client.send(command);
}
async function uploadDirectory(localDir, r2Prefix) {
    const files = getAllFiles(localDir);
    for (const file of files) {
        const relativePath = path.relative(localDir, file);
        const r2Key = `${r2Prefix}/${relativePath}`;
        let contentType = "application/octet-stream";
        if (file.endsWith(".m3u8")) {
            contentType = "application/vnd.apple.mpegurl";
        }
        else if (file.endsWith(".ts")) {
            contentType = "video/MP2T";
        }
        else if (file.endsWith(".jpg") || file.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        }
        else if (file.endsWith(".png")) {
            contentType = "image/png";
        }
        await uploadFile(file, r2Key, contentType);
    }
}
function getAllFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllFiles(fullPath));
        }
        else {
            files.push(fullPath);
        }
    }
    return files;
}
async function fileExists(key) {
    try {
        await exports.r2Client.send(new client_s3_1.HeadObjectCommand({
            Bucket: config_1.config.r2.bucket,
            Key: key,
        }));
        return true;
    }
    catch {
        return false;
    }
}
