import express from "express";
import { classes, departments, enrollments, subjects } from "../db/schema/app.js";
import { user } from "../db/schema/auth.js";
import { db } from "../db/index.js";
import { and, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

const router = express.Router();

// Get all classes with optional search, filtering, and pagination
router.get("/", async (req, res) => {
  try {
    const { search, subject, teacher, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
    const limitPerPage = Math.min(
      Math.max(1, parseInt(String(limit), 10) || 10),
      100,
    );

    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    // If search exists, filter by class name
    if (search) {
      filterConditions.push(ilike(classes.name, `%${search}%`));
    }

    // If subject exists, filter by subject id
    if (subject) {
      const subjectId = parseInt(String(subject), 10);
      if (Number.isNaN(subjectId)) {
        return res.status(400).json({ error: "Invalid subject filter" });
      }
      filterConditions.push(eq(classes.subjectId, subjectId));
    }

    // If teacher exists, filter by teacher id
    if (teacher) {
      const teacherId = parseInt(String(teacher), 10);
      if (Number.isNaN(teacherId)) {
        return res.status(400).json({ error: "Invalid teacher filter" });
      }
      filterConditions.push(eq(classes.teacherId, String(teacher)));
    }

    // Combine the filters using AND if any exists
    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limitPerPage);

    const classList = await db
      .select({
        ...getTableColumns(classes),
        subject: { ...getTableColumns(subjects) },
        teacher: { ...getTableColumns(user) },
      })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(whereClause)
      .orderBy(desc(classes.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: classList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages,
      },
    });
  } catch (e) {
    console.error(`GET /classes error:, ${e}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  const classId = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(classId) || classId <= 0) {
    return res.status(400).json({ error: "Invalid class id" });
  }

  try {
    const [classDetails] = await db
      .select({
        ...getTableColumns(classes),
        subject: { ...getTableColumns(subjects) },
        department: { ...getTableColumns(departments) },
        teacher: { ...getTableColumns(user) },
      })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(eq(classes.id, classId));

    if (!classDetails) return res.status(404).json({ error: "No Class found" });

    res.status(200).json({
      data: classDetails,
    });
  } catch (e) {
    console.error(`GET /classes/${classId} error:, ${e}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      subjectId,
      teacherId,
      bannerUrl,
      capacity,
      status,
      bannerCldPubId,
      schedules: inputSchedules,
    } = req.body;

    const MAX_RETRIES = 3;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const [createdClass] = await db
          .insert(classes)
          .values({
            name,
            description,
            subjectId,
            teacherId,
            bannerUrl,
            capacity,
            status,
            bannerCldPubId,
            inviteCode: randomBytes(4).toString("hex"),
            schedules: inputSchedules ?? [],
          })
          .returning({ id: classes.id });

        if (!createdClass) {
          return res.status(400).json({
            success: false,
            error: "Failed to create class",
          });
        }

        return res.status(201).json({
          success: true,
          data: createdClass,
        });
      } catch (error) {
        if ((error as any).code === "23505") {
          if (i < MAX_RETRIES - 1) {
            continue; // retry
          }
          return res.status(500).json({
            success: false,
            error: "Invite code collision, please try again",
          });
        }
        throw error;
      }
    }
  } catch (e) {
    console.error(`POST /classes error:, ${e}`);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// List users in a class by role with pagination
router.get("/:id/users", async (req, res) => {
  try {
    const classId = Number(req.params.id);
    const { role, page = 1, limit = 10 } = req.query;

    if (!Number.isFinite(classId)) {
      return res.status(400).json({ error: "Invalid class id" });
    }

    if (role !== "teacher" && role !== "student") {
      return res.status(400).json({ error: "Invalid role" });
    }

    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);
    const offset = (currentPage - 1) * limitPerPage;

    const baseSelect = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      imageCldPubId: user.imageCldPubId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const groupByFields = [
      user.id,
      user.name,
      user.email,
      user.emailVerified,
      user.image,
      user.role,
      user.imageCldPubId,
      user.createdAt,
      user.updatedAt,
    ];

    const countResult =
      role === "teacher"
        ? await db
            .select({ count: sql<number>`count(distinct ${user.id})` })
            .from(user)
            .leftJoin(classes, eq(user.id, classes.teacherId))
            .where(and(eq(user.role, role), eq(classes.id, classId)))
        : await db
            .select({ count: sql<number>`count(distinct ${user.id})` })
            .from(user)
            .leftJoin(enrollments, eq(user.id, enrollments.studentId))
            .where(and(eq(user.role, role), eq(enrollments.classId, classId)));

    const totalCount = countResult[0]?.count ?? 0;

    const usersList =
      role === "teacher"
        ? await db
            .select(baseSelect)
            .from(user)
            .leftJoin(classes, eq(user.id, classes.teacherId))
            .where(and(eq(user.role, role), eq(classes.id, classId)))
            .groupBy(...groupByFields)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset)
        : await db
            .select(baseSelect)
            .from(user)
            .leftJoin(enrollments, eq(user.id, enrollments.studentId))
            .where(and(eq(user.role, role), eq(enrollments.classId, classId)))
            .groupBy(...groupByFields)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

    res.status(200).json({
      data: usersList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /classes/:id/users error:", error);
    res.status(500).json({ error: "Failed to fetch class users" });
  }
});

router.put("/:id", async (req, res) => {
  res.send(`Update class with ID: ${req.params.id}`);
});

router.delete("/:id", async (req, res) => {
  res.send(`Delete class with ID: ${req.params.id}`);
});

export default router;
