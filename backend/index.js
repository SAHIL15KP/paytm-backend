const express = require("express");
const cors = require("cors");
const rootRouter = require("./routes");
const { PORT } = require("./config");

const app = express();

app.use(
    cors({
        origin: true,
        credentials: true
    })
);
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({
        status: "ok"
    });
});

app.use("/api/v1", rootRouter);

app.listen(PORT, () => {
    console.log(`PayFlow backend listening on port ${PORT}`);
});
