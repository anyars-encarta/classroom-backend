import express from "express";
import { db } from "../db/index.js";
import { classes } from "../db/schema/index.js";

const router = express.Router();

// Define your class routes here
router.get("/", async (req, res) => {
  res.send("Get all classes");
});

router.get("/:id", async (req, res) => {
  res.send(`Get class with ID: ${req.params.id}`);
});

router.post("/", async (req, res) => {
  try {
    const [createdClass] = await db
      .insert(classes)
      .values({...req.body, inviteCode: Math.random().toString(36).substring(2, 9), schedules: []})
      .returning({ id: classes.id});

      if(!createdClass) {
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
    console.error(`POST /classes error ${error}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.put("/:id", async (req, res) => {
  res.send(`Update class with ID: ${req.params.id}`);
});

router.delete("/:id", async (req, res) => {
  res.send(`Delete class with ID: ${req.params.id}`);
});

export default router;
