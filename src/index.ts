import express from "express";
import subjectsRouter from "./routes/subjects";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/subjects", subjectsRouter);
// app.use("/api", require("./routes/departments"));

app.get("/", (req, res) => {
  res.send("Hello, welcome to the Classroom API!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
