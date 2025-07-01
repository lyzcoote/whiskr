import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { notes, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
    const { token } = params;

    try {
        // Cerca la nota tramite il token di condivisione
        const sharedNote = await db
            .select({
                id: notes.id,
                title: notes.title,
                content: notes.content,
                allowGuestEdit: notes.allowGuestEdit,
                isCollaborative: notes.isCollaborative,
                createdAt: notes.createdAt,
                updatedAt: notes.updatedAt,
                owner: {
                    id: user.id,
                    name: user.name,
                    username: user.username
                }
            })
            .from(notes)
            .innerJoin(user, eq(notes.ownerId, user.id))
            .where(eq(notes.shareToken, token))
            .limit(1);

        if (sharedNote.length === 0) {
            throw error(404, 'Shared document not found');
        }

        return {
            note: sharedNote[0]
        };
    } catch (err) {
        console.error('Error loading shared note:', err);
        throw error(404, 'Shared document not found');
    }
};