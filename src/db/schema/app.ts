import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const classStatusEnum = pgEnum("class_status", ["active", "inactive", "archived"]);

const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const departments = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  ...timestamps,
});

export const subjects = pgTable("subjects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  departmentId: integer("department_id")
    .references(() => departments.id, { onDelete: "restrict" })
    .notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  ...timestamps,
});

export const classes = pgTable(
  "classes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    subjectId: integer("subject_id")
      .references(() => subjects.id, { onDelete: "cascade" })
      .notNull(),
    teacherId: text("teacher_id")
      .references(() => user.id, { onDelete: "restrict" })
      .notNull(),
    inviteCode: varchar("invite_code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    bannerCldPubId: text("banner_cld_pub_id"),
    bannerUrl: text("banner_url"),
    description: text("description"),
    capacity: integer("capacity").default(50).notNull(),
    status: classStatusEnum("status").default("active").notNull(),
    schedules: jsonb("schedules").$type<any[]>(), // typed as array (JSONB)
    ...timestamps,
  },
  (table) => ({
    subjectIdIdx: index("classes_subject_id_idx").on(table.subjectId),
    teacherIdIdx: index("classes_teacher_id_idx").on(table.teacherId),
  })
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    studentId: text("student_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    classId: integer("class_id")
      .references(() => classes.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps,
  },
  (table) => ({
    studentIdx: index("enrollments_student_id_idx").on(table.studentId),
    classIdx: index("enrollments_class_id_idx").on(table.classId),
    studentClassUnique: unique("enrollments_student_class_unique").on(table.studentId, table.classId),
  })
);

export const classesRelations = relations(classes, ({ one, many }) => ({
  subject: one(subjects, { fields: [classes.subjectId], references: [subjects.id] }),
  teacher: one(user, { fields: [classes.teacherId], references: [user.id] }),
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(user, { fields: [enrollments.studentId], references: [user.id] }),
  class: one(classes, { fields: [enrollments.classId], references: [classes.id] }),
}));

export const departmentRelations = relations(departments, ({ many }) => ({ subjects: many(subjects) }));

export const subjectsRelation = relations(subjects, ({ one, many }) => ({ department: one(departments, { fields: [subjects.departmentId], references: [departments.id] }) }));

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
