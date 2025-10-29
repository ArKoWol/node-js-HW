const fs = require("fs/promises");
const path = require("path");

class Logger {
    constructor(pathToFolder) {
        this.path = pathToFolder;
    }

    async log(type, message, folderPath = this.path) {
        try {
            const timestamp = new Date().toISOString();
            const normalizedType = String(type || "INFO").toUpperCase();
            const logMessage = `${normalizedType} ${message}\n`;
            const logFileName = `log-${timestamp}.txt`;

            await fs.mkdir(folderPath, { recursive: true });
            await fs.appendFile(
                path.join(folderPath, logFileName),
                logMessage,
                "utf8"
            );
        } catch (err) {
            console.error("Error writing log:", err);
        }
    }

    async analyze(folderPath = this.path, filterType = null) {
        try {
            const dirents = await fs.readdir(folderPath, {
                withFileTypes: true,
            });
            const counts = { SUCCESS: 0, ERROR: 0, INFO: 0 };

            const parseTypeFromLine = (line) => {
                if (!line) return null;
                const firstSpace = line.indexOf(" ");
                const token = (
                    firstSpace === -1 ? line : line.slice(0, firstSpace)
                )
                    .trim()
                    .toUpperCase();
                return token === "SUCCESS" ||
                    token === "ERROR" ||
                    token === "INFO"
                    ? token
                    : null;
            };

            for (const dirent of dirents) {
                if (!dirent.isDirectory()) continue;
                const folderFullPath = path.join(folderPath, dirent.name);

                let files;
                try {
                    files = await fs.readdir(folderFullPath);
                } catch (err) {
                    console.error(
                        "Error reading subfolder:",
                        folderFullPath,
                        err
                    );
                    continue;
                }

                for (const fileName of files) {
                    const filePath = path.join(folderFullPath, fileName);
                    let content;
                    try {
                        content = await fs.readFile(filePath, "utf8");
                    } catch (err) {
                        console.error("Error reading log file:", filePath, err);
                        continue;
                    }

                    const lines = content.split("\n");
                    for (const rawLine of lines) {
                        const line = rawLine.trim();
                        if (!line) continue;
                        const type = parseTypeFromLine(line);
                        if (!type) continue;
                        if (type === "SUCCESS") counts.SUCCESS++;
                        else if (type === "ERROR") counts.ERROR++;
                        else if (type === "INFO") counts.INFO++;
                    }
                }
            }

            if (filterType) {
                const key = String(filterType).toUpperCase();
                console.log({ [key]: counts[key] || 0 });
            } else {
                console.log(counts);
            }
        } catch (err) {
            console.error("Error analyzing folder:", err);
        }
    }
}

module.exports = Logger;
