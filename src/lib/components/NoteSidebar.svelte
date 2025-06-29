<script lang="ts">
    import { Button, Input, Card, P } from 'flowbite-svelte';
    import { SearchOutline, FileOutline, ClockOutline } from 'flowbite-svelte-icons';
    import { notesStore } from '$lib/stores/note.js';
    import { localDB, type TempNote } from '$lib/stores/localStorage.js';
    
    let { onNoteSelect }: { onNoteSelect: (note: TempNote) => void } = $props();
    
    let searchQuery = $state('');
    let notes = $state<TempNote[]>([]);
    
    // Subscribe to notes store
    notesStore.subscribe(value => {
        notes = value;
    });
    
    $effect(() => {
        if (searchQuery.trim()) {
            notes = localDB.searchNotes(searchQuery);
        } else {
            notes = localDB.getAllNotes();
        }
    });
    
    function formatDate(date: Date): string {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
</script>

<div class="w-80 h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Saved Notes</h2>
        
        <!-- Search -->
        <div class="relative">
            <SearchOutline class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
                bind:value={searchQuery}
                placeholder="Search notes..."
                class="pl-10"
            />
        </div>
    </div>
    
    <!-- Notes List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
        {#each notes as note (note.id)}
            <Card 
                class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors p-3"
                onclick={() => onNoteSelect(note)}
            >
                <div class="flex items-start gap-3">
                    <FileOutline class="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-gray-900 dark:text-white truncate">
                            {note.title}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {note.content.slice(0, 100)}...
                        </p>
                        <div class="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <ClockOutline class="w-3 h-3" />
                            {formatDate(note.updatedAt)}
                        </div>
                    </div>
                </div>
            </Card>
        {:else}
            <div class="text-center py-8">
                <FileOutline class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <P class="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No notes found' : 'No saved notes yet'}
                </P>
            </div>
        {/each}
    </div>
</div>