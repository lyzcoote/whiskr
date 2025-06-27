import { sql } from 'drizzle-orm';
import { mysqlTable, varchar, datetime, timestamp, text, boolean, json, int } from 'drizzle-orm/mysql-core';

export const tenants = mysqlTable('tenants', {
	id: varchar('id', { length: 255 }).primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
	isActive: boolean('is_active').default(true),
});

export const user = mysqlTable('user', {
	id: varchar('id', { length: 255 }).primaryKey(),
	username: varchar('username', { length: 32 }).notNull().unique(),
	name: varchar('name', { length: 255 }).notNull(),
	surname: varchar('surname', { length: 255 }).notNull(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	tenantId: varchar('tenant_id', { length: 255 }).notNull().references(() => tenants.id),
	isActive: boolean('is_active').default(true),
	isEmailVerified: boolean('is_email_verified').default(false),
	isAdmin: boolean('is_admin').default(false),
	createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
	passwordHash: varchar('password_hash', { length: 255 }).notNull()
});

export const notes = mysqlTable('notes', {
	id: varchar('id', { length: 255 }).primaryKey(),
	ownerId: varchar('owner_id', { length: 255 }).notNull().references(() => user.id),
	title: text('title').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
	isPublic: boolean('is_public').default(false),
	isArchived: boolean('is_archived').default(false),
	tags: json('tags').$type<{ [key: string]: string }>()
});

export const noteStory = mysqlTable('note_story', {
	id: varchar('id', { length: 255 }).primaryKey(),
	noteId: varchar('note_id', { length: 255 }).notNull().references(() => notes.id),
	version: int('version').notNull(),
	ownerId: varchar('owner_id', { length: 255 }).notNull().references(() => user.id),
	title: text('title').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
	isPublic: boolean('is_public').default(false),
	isArchived: boolean('is_archived').default(false),
	tags: json('tags').$type<{ [key: string]: string }>()
});

export const noteCollaborators = mysqlTable('note_collaborators', {
	id: varchar('id', { length: 255 }).primaryKey(),
	noteId: varchar('note_id', { length: 255 }).notNull().references(() => notes.id),
	userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
	createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const session = mysqlTable('session', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
	createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Notes = typeof notes.$inferSelect;
export type NoteStory = typeof noteStory.$inferSelect;
export type NoteCollaborators = typeof noteCollaborators.$inferSelect;
export type Tenants = typeof tenants.$inferSelect;
