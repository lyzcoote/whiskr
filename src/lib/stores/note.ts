import { writable } from 'svelte/store';
import { localDB, type TempNote } from './localStorage.js';
import { browser } from '$app/environment';

function createNotesStore() {
    const { subscribe, set, update } = writable<TempNote[]>([]);

    return {
        subscribe,
        
        // Inizializza lo store con i dati dal localStorage
        init: () => {
            if (browser) {
                set(localDB.getAllNotes());
            }
        },

        // Salva una nota
        save: (note: Partial<TempNote> & { title: string; content: string }) => {
            const savedNote = localDB.saveNote(note);
            update(notes => {
                if (note.id) {
                    // Aggiorna esistente
                    const index = notes.findIndex(n => n.id === note.id);
                    if (index !== -1) {
                        notes[index] = savedNote;
                    }
                } else {
                    // Nuova nota
                    notes.unshift(savedNote);
                }
                return notes;
            });
            return savedNote;
        },

        // Elimina una nota
        delete: (id: string) => {
            if (localDB.deleteNote(id)) {
                update(notes => notes.filter(note => note.id !== id));
                return true;
            }
            return false;
        },

        // Ricerca note
        search: (query: string) => {
            return localDB.searchNotes(query);
        },

        // Pulisce tutto
        clear: () => {
            localDB.clearAll();
            set([]);
        }
    };
}

export const notesStore = createNotesStore();