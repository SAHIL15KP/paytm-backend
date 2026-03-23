const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");

if (fs.existsSync(envPath)) {
    const rawEnv = fs.readFileSync(envPath, "utf8");

    rawEnv.split(/\r?\n/).forEach((line) => {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith("#") || !trimmedLine.includes("=")) {
            return;
        }

        const separatorIndex = trimmedLine.indexOf("=");
        const key = trimmedLine.slice(0, separatorIndex).trim();
        let value = trimmedLine.slice(separatorIndex + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (!process.env[key]) {
            process.env[key] = value;
        }
    });
}

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || "payflow-local-secret",
    MONGOOSE_URL: process.env.MONGOOSE_URL || "",
    PORT: Number(process.env.PORT || 3000)
};
