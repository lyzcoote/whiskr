import { verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        return redirect(302, '/profile');
    }
    return {};
};

export const actions: Actions = {
    login: async (event) => {
        const formData = await event.request.formData();
        const username = formData.get('username');
        const password = formData.get('password');

        if (!validateUsername(username)) {
            return fail(400, {
                message: 'Invalid username (min 3, max 31 characters, alphanumeric only)'
            });
        }
        if (!validatePassword(password)) {
            return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
        }

        const results = await db.select().from(table.user).where(eq(table.user.username, username));

        const existingUser = results.at(0);
        if (!existingUser) {
            return fail(400, { message: 'Incorrect username or password' });
        }

        const validPassword = await verify(existingUser.passwordHash, password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });
        if (!validPassword) {
            return fail(400, { message: 'Incorrect username or password' });
        }

        const sessionToken = auth.generateSessionToken();
        const session = await auth.createSession(sessionToken, existingUser.id);
        auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

        return redirect(302, '/profile');
    },
};

function validateUsername(username: unknown): username is string {
    return (
        typeof username === 'string' &&
        username.length >= 3 &&
        username.length <= 31 &&
        /^[a-z0-9_-]+$/.test(username)
    );
}

function validatePassword(password: unknown): password is string {
    return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}
