import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { notes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        // Verifica che l'utente sia autenticato
        if (!locals.user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { noteId, title, content, allowGuestEdit } = await request.json();

        if (!noteId || !title || !content) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Genera un token di condivisione unico
        const shareToken = crypto.randomUUID();

        // Verifica se la nota esiste già nel database
        const existingNote = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1);

        if (existingNote.length > 0) {
            // Aggiorna la nota esistente
            await db
                .update(notes)
                .set({
                    title,
                    content,
                    shareToken,
                    allowGuestEdit,
                    isPublic: true,
                    updatedAt: new Date()
                })
                .where(eq(notes.id, noteId));
        } else {
            // Crea una nuova nota nel database
            await db.insert(notes).values({
                id: noteId,
                ownerId: locals.user.id,
                title,
                content,
                shareToken,
                allowGuestEdit,
                isPublic: true,
                isCollaborative: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return json({ shareToken });
    } catch (error) {
        console.error('Error sharing note:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

export const PUT: RequestHandler = async ({ request, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { noteId, allowGuestEdit } = await request.json();

        if (!noteId) {
            return json({ error: 'Note ID is required' }, { status: 400 });
        }

        // Aggiorna solo i permessi
        await db
            .update(notes)
            .set({
                allowGuestEdit,
                updatedAt: new Date()
            })
            .where(eq(notes.id, noteId));

        return json({ success: true });
    } catch (error) {
        console.error('Error updating note permissions:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};