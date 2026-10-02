const express = require("express");
const pool = require("./db");

const professorRoutes = require("./routes/professorRoutes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running!");
});

app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database connection failed");
    }
});

app.use("/api/professors", professorRoutes);

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});