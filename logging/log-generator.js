const Logger = require("./logger.js");
const logger = new Logger("./logs");

const fs = require("fs/promises");
const path = require("path");

let folderName = "logs-" + Date.now();
let logFolderPath = path.join(__dirname, "logs", folderName);
let currentFolderPath = null;

async function createFolder(folderPath) {
    try {
        await fs.mkdir(folderPath, { recursive: true });
        currentFolderPath = folderPath;
        console.log("Folder created: " + folderPath);
    } catch (err) {
        console.error("Error creating folder:", err);
    }
}

createFolder(logFolderPath);

setInterval(() => {
    folderName = "logs-" + Date.now();
    logFolderPath = path.join(__dirname, "logs", folderName);
    createFolder(logFolderPath);
}, 60000);

setInterval(() => {
    if (currentFolderPath) {
        const types = ["SUCCESS", "ERROR", "INFO"];
        const type = types[Math.floor(Math.random() * types.length)];
        const message =
            type === "SUCCESS" ? "Operation completed" :
            type === "ERROR" ? "Operation failed" :
            "Heartbeat";

        (async () => {
            try {
                await logger.log(type, message, currentFolderPath);
                console.log("Log written");
            } catch (err) {
                console.error("Failed to write log:", err);
            }
        })();
    } else {
        console.error("Folder not found");
    }
}, 10000);

