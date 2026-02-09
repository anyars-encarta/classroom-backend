import express from "express";
import { user } from "../db/schema/auth.js";
import { db } from "../db/index.js";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";

const router = express.Router();

// Get all users with optional search, filtering, and pagination
router.get("/", async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
    const limitPerPage = Math.min(
      Math.max(1, parseInt(String(limit), 10) || 10),
      100,
    );

    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    // If search exists, filter by user name OR user email
    if (search) {
      filterConditions.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
        ),
      );
    }

    // If role exists, filter by exact role match
    if (role) {
      filterConditions.push(eq(user.role, role as "student" | "teacher" | "admin"));
    }

    // Combine the filters using AND if any exists
    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(user)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limitPerPage);

    const usersList = await db
      .select(getTableColumns(user))
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: usersList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages,
      },
    });
  } catch (e) {
    console.error(`GET /users error:, ${e}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;