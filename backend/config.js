//backend/config.js
const dotenv = require("dotenv")
dotenv.config()
module.exports = {
	JWT_SECRET: process.env.JWT_SECRET,
	MONGOOSE_URL : process.env.MONGOOSE_URL
}
