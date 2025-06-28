import { fail, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const user = requireLogin();
    return { user };
};

function requireLogin() {
    const { locals } = getRequestEvent();
    
    if (!locals.user) {
        return redirect(302, '/login');
    }
    
    return locals.user;
}
