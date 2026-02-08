import express from "express";
import { departments } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { asc, getTableColumns } from "drizzle-orm";

const router = express.Router();

// Get all subjects with optional search, filtering, and pagination
router.get("/", async (req, res) => {
  try {
    const departmentsList = await db
      .select({
        ...getTableColumns(departments),
      })
      .from(departments)
      .orderBy(asc(departments.name))

    res.status(200).json({
      data: departmentsList,
    });
  } catch (e) {
    console.error(`GET /departments error:, ${e}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
