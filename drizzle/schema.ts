import { pgTable, serial, text, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const downloads = pgTable('downloads', {
  id: serial('id').primaryKey(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  url: text('url').notNull(), // URL from Vercel Blob
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  userName: varchar('user_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 50 }).default('open').notNull(), // 'open', 'answered', 'closed'
  response: text('response'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});