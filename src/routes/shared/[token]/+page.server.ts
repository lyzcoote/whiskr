import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { token } = params;
    
    // In a real application, you would:
    // 1. Query the database for the note with this share token
    // 2. Check if the note exists and is public
    // 3. Return the note data
    
    // For now, we'll simulate this with a mock response
    const mockNote = {
        id: 'shared-note-1',
        title: 'Shared Document',
        content: '# Welcome to the Shared Document\n\nThis is a shared markdown document that you can view and potentially edit.',
        allowGuestEdit: true,
        owner: {
            name: 'John Doe',
            username: 'johndoe'
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
    };
    
    // Simulate token validation
    if (token.length < 10) {
        throw error(404, 'Document not found');
    }
    
    return {
        note: mockNote,
        shareToken: token
    };
};