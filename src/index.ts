import express from "express";
import subjectsRouter from "./routes/subjects";
import cors from "cors";
import departmentsRouter from "./routes/departments";

const app = express();
const PORT = process.env.PORT || 8000;

if (!process.env.FRONTEND_URL) throw new Error("FRONTEND_URL is not set in the .env file");

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/subjects", subjectsRouter);
app.use("/api/departments", departmentsRouter);

app.get("/", (req, res) => {
  res.send("Hello, welcome to the Classroom API!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
