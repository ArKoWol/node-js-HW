const Logger = require("./logger.js");
const logger = new Logger("./logs");

const fs = require("fs/promises");
const path = require("path");

(async () => {
    const args = process.argv.slice(2);

    if (args.includes("--help")) {
        console.log("Usage: node log-analyzer.js [--type success|error|info]");
        process.exit(0);
    }

    const typeIndex = args.indexOf("--type");
    let filterType = null;
    if (typeIndex !== -1) {
        const value = args[typeIndex + 1];
        const allowed = ["SUCCESS", "ERROR", "INFO"];

        if (!value || !allowed.includes(value.toUpperCase())) {
            console.error("Invalid --type. Allowed: success, error, info");
            process.exit(1);
        }
        filterType = value.toUpperCase();
    }

    await logger.analyze("./logs", filterType);
})();
