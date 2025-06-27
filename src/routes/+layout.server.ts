import type { LayoutServerLoad } from './$types';
import { getRequestEvent } from '$app/server';

export const load = (async () => {
    const user = requireLogin();
    return { user };
}) satisfies LayoutServerLoad;

function requireLogin() {
    const { locals } = getRequestEvent();

    if (!locals.user) {
        // Return an empty object to avoid redirecting
        return {
            id: null,
            username: null,
            email: null,
            name: null,
            surname: null,
            isAdmin: false,
        }
    }

    return locals.user;
}
