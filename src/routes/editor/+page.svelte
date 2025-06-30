<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {
        Button,
        Toolbar,
        ToolbarGroup,
        Input,
        Toast,
        Checkbox,
        Label,
        Dropdown,
        DropdownItem
    } from 'flowbite-svelte';
    import {
        LetterBoldOutline,
        LetterItalicOutline,
        ListOutline,
        CodeOutline,
        EyeOutline,
        EditOutline,
        FloppyDiskOutline,
        TrashBinOutline,
        UsersGroupOutline,
        ShareOutline,
        DownloadOutline,
        ChevronDownOutline
    } from 'flowbite-svelte-icons';
    import NotesSidebar from '$lib/components/NoteSidebar.svelte';
    import CollaborativeUsers from '$lib/components/CollaborativeUsers.svelte';
    import ShareModal from '$lib/components/ShareModal.svelte';
    import ExportModal from '$lib/components/ExportModal.svelte';
    import { marked } from 'marked';
    import { notesStore } from '$lib/stores/note';
    import { collaborationStore } from '$lib/stores/collaboration';
    import { type TempNote } from '$lib/stores/localStorage';

    let editorContainer = $state<HTMLDivElement>();
    let previewContainer = $state<HTMLDivElement | undefined>();
    let resizeHandle = $state<HTMLDivElement>();
    let markdownContent = $state('');
    let htmlPreview = $state('');
    let documentTitle = $state('Untitled Document');
    let isPreviewMode = $state(false);
    let showSidebar = $state(false);

    // Note management
    let currentNoteId = $state<string | null>(null);
    let saveStatus = $state<'saved' | 'saving' | 'unsaved'>('unsaved');
    let autoSaveTimeout: NodeJS.Timeout;
    let isCollaborative = $state(false);
    let shareToken = $state<string | null>(null);
    let allowGuestEdit = $state(false);

    // Modal states
    let showShareModal = $state(false);
    let showExportModal = $state(false);

    // Resize state
    let editorWidth = $state(50);
    let isResizing = $state(false);

    // Collaboration state
    let collaborationState = $state({
        isConnected: false,
        users: [],
        roomId: null,
        provider: null,
        ydoc: null,
        ytext: null
    });

    // Flags to prevent infinite loops
    let isUpdatingFromYJS = $state(false);
    let isUpdatingYJS = $state(false);

    // Marked configuration for rendering
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    onMount(async () => {
        // Initialize the notes store
        notesStore.init();
        await updatePreview();
        
        // Subscribe to collaboration store
        collaborationStore.subscribe(state => {
            collaborationState = state;
            
            // Handle YJS text changes
            if (state.ytext && !isUpdatingFromYJS) {
                state.ytext.observe(async (event, transaction) => {
                    if (transaction.local || isUpdatingYJS) return;
                    
                    const newContent = state.ytext!.toString();
                    if (newContent !== markdownContent) {
                        isUpdatingFromYJS = true;
                        markdownContent = newContent;
                        await updatePreview();
                        scheduleAutoSave();
                        
                        setTimeout(() => {
                            isUpdatingFromYJS = false;
                        }, 0);
                    }
                });
            }
        });
    });

    onDestroy(() => {
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }
        collaborationStore.disconnect();
    });

    async function updatePreview() {
        try {
            htmlPreview = await marked(markdownContent);
        } catch (error) {
            console.error('Error parsing markdown:', error);
            htmlPreview = '<p>Error parsing markdown</p>';
        }
    }

    async function handleInput(event: Event) {
        if (isUpdatingFromYJS) return;

        const target = event.target as HTMLTextAreaElement;
        const newContent = target.value;

        markdownContent = newContent;
        await updatePreview();
        scheduleAutoSave();

        // Update cursor position for collaboration
        collaborationStore.updateCursor(target.selectionStart);

        // If collaborative, synchronize with YJS
        if (isCollaborative && collaborationState.ytext && !isUpdatingYJS) {
            isUpdatingYJS = true;

            const currentYJSContent = collaborationState.ytext.toString();
            if (currentYJSContent !== newContent) {
                collaborationState.ydoc!.transact(() => {
                    collaborationState.ytext!.delete(0, collaborationState.ytext!.length);
                    collaborationState.ytext!.insert(0, newContent);
                });
            }

            setTimeout(() => {
                isUpdatingYJS = false;
            }, 50);
        }
    }

    function scheduleAutoSave() {
        if (isUpdatingFromYJS) return;

        saveStatus = 'unsaved';

        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }

        autoSaveTimeout = setTimeout(() => {
            saveNote();
        }, 2000);
    }

    async function saveNote() {
        if (!documentTitle.trim() || !markdownContent.trim()) return;

        saveStatus = 'saving';

        try {
            const savedNote = notesStore.save({
                id: currentNoteId ?? undefined,
                title: documentTitle,
                content: markdownContent,
                isCollaborative: isCollaborative
            });

            currentNoteId = savedNote.id;
            saveStatus = 'saved';

            // Generate share token if collaborative and doesn't exist
            if (isCollaborative && !shareToken) {
                shareToken = generateShareToken();
                // In a real app, you'd save this to the database
            }

            // Connect to collaboration if needed
            if (isCollaborative && !collaborationState.isConnected) {
                // In a real app, get user info from context
                collaborationStore.connect(currentNoteId, 'user-id', 'User Name');
            }

            setTimeout(() => {
                if (saveStatus === 'saved') {
                    saveStatus = 'unsaved';
                }
            }, 2000);
        } catch (error) {
            console.error('Error saving note:', error);
            saveStatus = 'unsaved';
        }
    }

    function newNote() {
        currentNoteId = null;
        documentTitle = 'Untitled Document';
        markdownContent = '# New Note\n\nStart writing...';
        isCollaborative = false;
        shareToken = null;
        allowGuestEdit = false;

        // Reset flags
        isUpdatingFromYJS = false;
        isUpdatingYJS = false;

        // Disconnect from collaboration
        collaborationStore.disconnect();

        updatePreview();
    }

    function loadNote(note: TempNote) {
        // Reset flags before loading
        isUpdatingFromYJS = false;
        isUpdatingYJS = false;

        currentNoteId = note.id;
        documentTitle = note.title;
        markdownContent = note.content;
        isCollaborative = note.isCollaborative || false;

        // Disconnect from previous collaboration
        collaborationStore.disconnect();

        // Connect to collaboration if needed
        if (isCollaborative) {
            collaborationStore.connect(note.id, 'user-id', 'User Name');
        }

        updatePreview();
        saveStatus = 'saved';
    }

    function deleteCurrentNote() {
        if (currentNoteId && confirm('Are you sure you want to delete this note?')) {
            notesStore.delete(currentNoteId);
            newNote();
        }
    }

    async function insertMarkdown(before: string, after: string = '') {
        if (!editorContainer) return;
        const textarea = editorContainer.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = markdownContent.slice(start, end);
        const replacement = before + selectedText + after;

        const newContent = markdownContent.slice(0, start) + replacement + markdownContent.slice(end);

        markdownContent = newContent;
        await updatePreview();

        // Update YJS if collaborative
        if (isCollaborative && collaborationState.ytext && !isUpdatingYJS) {
            isUpdatingYJS = true;
            collaborationState.ydoc!.transact(() => {
                collaborationState.ytext!.delete(0, collaborationState.ytext!.length);
                collaborationState.ytext!.insert(0, newContent);
            });
            setTimeout(() => {
                isUpdatingYJS = false;
            }, 50);
        }

        // Keep focus and update selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + before.length,
                start + before.length + selectedText.length
            );
        }, 0);
    }

    function togglePreview() {
        isPreviewMode = !isPreviewMode;
    }

    function generateShareToken(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async function updateSharePermissions(allowEdit: boolean) {
        allowGuestEdit = allowEdit;
        // In a real app, you'd update this in the database
        console.log('Updated share permissions:', { allowEdit });
    }

    // Resize functions
    function startResize(event: MouseEvent) {
        isResizing = true;
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
        event.preventDefault();
    }

    function handleResize(event: MouseEvent) {
        if (!isResizing) return;

        const container = document.querySelector('.resize-container') as HTMLElement;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const mouseX = event.clientX - containerRect.left;
        const newWidth = (mouseX / containerRect.width) * 100;

        editorWidth = Math.max(20, Math.min(80, newWidth));
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
    }
</script>

<svelte:head>
    <title>Editor - {documentTitle} | Whiskr</title>
</svelte:head>

<!-- Editor takes all available space outside the tab layout -->
<div class="fixed inset-0 top-16 bg-white dark:bg-gray-900 z-40">
    <!-- Header with toolbar -->
    <div class="h-auto border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="px-4 py-3">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                    <!-- Toggle Sidebar Button -->
                    <Button
                        size="sm"
                        color="alternative"
                        onclick={() => (showSidebar = !showSidebar)}
                        title="Toggle Notes"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16"
                            ></path>
                        </svg>
                    </Button>

                    <Input
                        bind:value={documentTitle}
                        class="text-lg font-medium bg-transparent border-none focus:ring-0 p-0 max-w-md"
                        placeholder="Document title..."
                    />

                    <!-- Collaborative Checkbox -->
                    <div class="flex items-center gap-2">
                        <Checkbox 
                            bind:checked={isCollaborative} 
                            onchange={() => {
                                if (isCollaborative && currentNoteId) {
                                    collaborationStore.connect(currentNoteId, 'user-id', 'User Name');
                                } else {
                                    collaborationStore.disconnect();
                                }
                                scheduleAutoSave();
                            }}
                        />
                        <Label class="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            <UsersGroupOutline class="w-4 h-4" />
                            Collaborative
                        </Label>
                    </div>

                    <!-- Collaborative Users -->
                    {#if isCollaborative}
                        <CollaborativeUsers />
                    {/if}

                    <!-- Save Status Indicator -->
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        {#if saveStatus === 'saving'}
                            Saving...
                        {:else if saveStatus === 'saved'}
                            ✓ Saved
                        {:else}
                            Unsaved
                        {/if}
                    </div>
                </div>

                <!-- Action buttons -->
                <div class="flex gap-2">
                    <!-- Save/New/Delete buttons -->
                    <Button size="sm" color="green" onclick={saveNote} title="Save Note">
                        <FloppyDiskOutline class="w-4 h-4" />
                    </Button>

                    <Button size="sm" color="alternative" onclick={newNote} title="New Note">New</Button>

                    {#if currentNoteId}
                        <Button size="sm" color="red" onclick={deleteCurrentNote} title="Delete Note">
                            <TrashBinOutline class="w-4 h-4" />
                        </Button>
                    {/if}

                    <!-- Share Button -->
                    {#if isCollaborative && currentNoteId}
                        <Button 
                            size="sm" 
                            color="blue" 
                            onclick={() => showShareModal = true}
                            title="Share Document"
                        >
                            <ShareOutline class="w-4 h-4" />
                        </Button>
                    {/if}

                    <!-- Export Dropdown -->
                    <Button size="sm" color="alternative" class="relative">
                        <DownloadOutline class="w-4 h-4 mr-1" />
                        Export
                        <ChevronDownOutline class="w-3 h-3 ml-1" />
                    </Button>
                    <Dropdown class="w-48">
                        <DropdownItem onclick={() => showExportModal = true}>
                            <DownloadOutline class="w-4 h-4 mr-2" />
                            Export Options...
                        </DropdownItem>
                    </Dropdown>

                    <!-- View toggle buttons -->
                    <Button size="sm" color="alternative" onclick={togglePreview}>
                        {#if isPreviewMode}
                            <EditOutline class="w-4 h-4 mr-2" />
                            Edit Only
                        {:else}
                            <EyeOutline class="w-4 h-4 mr-2" />
                            Preview Only
                        {/if}
                    </Button>

                    <Button
                        size="sm"
                        color="blue"
                        onclick={() => (isPreviewMode = false)}
                        class="hidden lg:block"
                    >
                        Split View
                    </Button>
                </div>
            </div>

            <Toolbar class="overflow-x-auto">
                <ToolbarGroup>
                    <Button
                        size="sm"
                        color="alternative"
                        onclick={() => insertMarkdown('**', '**')}
                        title="Bold"
                    >
                        <LetterBoldOutline class="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        color="alternative"
                        onclick={() => insertMarkdown('*', '*')}
                        title="Italic"
                    >
                        <LetterItalicOutline class="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        color="alternative"
                        onclick={() => insertMarkdown('`', '`')}
                        title="Code"
                    >
                        <CodeOutline class="w-4 h-4" />
                    </Button>
                </ToolbarGroup>

                <ToolbarGroup>
                    <Button
                        size="sm"
                        color="alternative"
                        onclick={() => insertMarkdown('# ', '')}
                        title="Heading"
                    >
                        H1
                    </Button>
                    <Button
                        size="sm"
                        color="alternative"
                        onclick={() => insertMarkdown('## ', '')}
                        title="Heading 2"
                    >
                        H2
                    </Button>
                    <Button
                        size="sm"
                        color="alternative"
                        onclick={() => insertMarkdown('- ', '')}
                        title="List"
                    >
                        <ListOutline class="w-4 h-4" />
                    </Button>
                </ToolbarGroup>
            </Toolbar>
        </div>
    </div>

    <div class="flex h-full" style="height: calc(100vh - 180px);">
        <!-- Sidebar -->
        {#if showSidebar}
            <div class="w-80 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                <NotesSidebar onNoteSelect={loadNote} />
            </div>
        {/if}

        <!-- Editor area -->
        <div class="flex-1 flex overflow-hidden resize-container">
            {#if isPreviewMode}
                <!-- Preview only -->
                <div class="w-full h-full overflow-auto bg-white dark:bg-gray-900" bind:this={previewContainer}>
                    <div
                        class="prose prose-lg max-w-none dark:prose-invert p-6
                        prose-headings:text-gray-900 dark:prose-headings:text-white
                        prose-p:text-gray-700 dark:prose-p:text-gray-300
                        prose-li:text-gray-700 dark:prose-li:text-gray-300
                        prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:text-gray-900 dark:prose-code:text-gray-100
                        prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
                    >
                        {@html htmlPreview}
                    </div>
                </div>
            {:else}
                <!-- Split view with resize -->
                <div class="flex w-full h-full">
                    <!-- Editor Panel -->
                    <div
                        class="h-full bg-white dark:bg-gray-900"
                        style="width: {editorWidth}%"
                        bind:this={editorContainer}
                    >
                        <textarea
                            bind:value={markdownContent}
                            oninput={handleInput}
                            class="w-full h-full resize-none border-none focus:ring-0 focus:outline-none bg-white dark:bg-gray-900 font-mono text-sm p-6 text-gray-900 dark:text-gray-100"
                            placeholder="Start writing your markdown..."
                            spellcheck="false"
                        ></textarea>
                    </div>

                    <!-- Resize Handle -->
                    <div
                        class="w-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize relative group transition-colors duration-200 hidden lg:block"
                        bind:this={resizeHandle}
                        onmousedown={startResize}
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize panels"
                    >
                        <!-- Visual indicator -->
                        <div
                            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 dark:bg-gray-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        ></div>
                    </div>

                    <!-- Preview Panel -->
                    <div
                        class="h-full overflow-auto bg-white dark:bg-gray-900 hidden lg:block"
                        style="width: {100 - editorWidth}%"
                        bind:this={previewContainer}
                    >
                        <div
                            class="prose prose-lg max-w-none dark:prose-invert p-6
                            prose-headings:text-gray-900 dark:prose-headings:text-white
                            prose-p:text-gray-700 dark:prose-p:text-gray-300
                            prose-li:text-gray-700 dark:prose-li:text-gray-300
                            prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:text-gray-900 dark:prose-code:text-gray-100
                            prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
                        >
                            {@html htmlPreview}
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- Modals -->
<ShareModal 
    bind:open={showShareModal}
    {noteId}
    {shareToken}
    bind:allowGuestEdit
    onUpdatePermissions={updateSharePermissions}
/>

<ExportModal 
    bind:open={showExportModal}
    content={markdownContent}
    title={documentTitle}
    previewElement={previewContainer}
/>

<style>
    .resize-container {
        user-select: none;
    }
</style>