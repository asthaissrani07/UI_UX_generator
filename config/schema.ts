import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const projectTable = pgTable("project", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id", { length: 255 }).notNull().unique(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userInput: text("user_input").notNull(),
  device: varchar("device", { length: 50 }).notNull(),
  projectName: varchar("project_name", { length: 255 }),
  theme: varchar("theme", { length: 100 }),
  projectVisualDescription: text("project_visual_description"),
  screenshot: text("screenshot"),
  createdOn: timestamp("created_on").defaultNow().notNull(),
});

export const screenConfigTable = pgTable("screen_config", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id", { length: 255 })
    .notNull()
    .references(() => projectTable.projectId),
  screenId: varchar("screen_id", { length: 100 }).notNull(),
  screenName: varchar("screen_name", { length: 255 }),
  purpose: varchar("purpose", { length: 500 }),
  screenDescription: text("screen_description"),
  code: text("code"),
});
