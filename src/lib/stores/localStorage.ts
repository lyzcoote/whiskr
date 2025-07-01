import { browser } from '$app/environment';

export interface TempNote {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    isCollaborative: boolean;
    shareToken?: string; // Nuovo campo opzionale
    allowGuestEdit?: boolean; // Nuovo campo opzionale
}

const STORAGE_KEY = 'whiskr_temp_notes';

class LocalStorageDB {
    private getStorage(): TempNote[] {
        if (!browser) return [];
        
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return [];
            
            const notes = JSON.parse(data);
            // Converti le date da string a Date objects
            return notes.map((note: any) => ({
                ...note,
                createdAt: new Date(note.createdAt),
                updatedAt: new Date(note.updatedAt)
            }));
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    private setStorage(notes: TempNote[]): void {
        if (!browser) return;
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    }

    getAllNotes(): TempNote[] {
        return this.getStorage();
    }

    getNote(id: string): TempNote | null {
        const notes = this.getStorage();
        return notes.find(note => note.id === id) || null;
    }

    saveNote(note: Partial<TempNote> & { title: string; content: string }): TempNote {
        const notes = this.getStorage();
        const now = new Date();
        
        if (note.id) {
            // Aggiorna nota esistente
            const index = notes.findIndex(n => n.id === note.id);
            if (index !== -1) {
                notes[index] = {
                    ...notes[index],
                    ...note,
                    updatedAt: now
                };
                this.setStorage(notes);
                return notes[index];
            }
        }
        
        // Crea nuova nota
        const newNote: TempNote = {
            id: crypto.randomUUID(),
            title: note.title,
            content: note.content,
            isCollaborative: note.isCollaborative ?? false,
            shareToken: note.shareToken,
            allowGuestEdit: note.allowGuestEdit ?? false,
            createdAt: now,
            updatedAt: now
        };
        
        notes.unshift(newNote);
        this.setStorage(notes);
        return newNote;
    }

    deleteNote(id: string): boolean {
        const notes = this.getStorage();
        const index = notes.findIndex(note => note.id === id);
        
        if (index !== -1) {
            notes.splice(index, 1);
            this.setStorage(notes);
            return true;
        }
        
        return false;
    }

    searchNotes(query: string): TempNote[] {
        const notes = this.getStorage();
        const lowercaseQuery = query.toLowerCase();
        
        return notes.filter(note => 
            note.title.toLowerCase().includes(lowercaseQuery) ||
            note.content.toLowerCase().includes(lowercaseQuery)
        );
    }

    clearAll(): void {
        if (!browser) return;
        localStorage.removeItem(STORAGE_KEY);
    }

    exportNotes(): string {
        const notes = this.getStorage();
        return JSON.stringify(notes, null, 2);
    }

    importNotes(jsonData: string): boolean {
        try {
            const importedNotes = JSON.parse(jsonData);
            if (Array.isArray(importedNotes)) {
                this.setStorage(importedNotes);
                return true;
            }
        } catch (error) {
            console.error('Error importing notes:', error);
        }
        return false;
    }
}

export const localDB = new LocalStorageDB();