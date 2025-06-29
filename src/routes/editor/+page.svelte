<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {
        Button,
        Toolbar,
        ToolbarGroup,
        Input,
        Toast,
        Checkbox,
        Label
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
        UsersGroupOutline
    } from 'flowbite-svelte-icons';
    import NotesSidebar from '$lib/components/NoteSidebar.svelte';
    import * as Y from 'yjs';
    import { WebsocketProvider } from 'y-websocket';
    import { marked } from 'marked';
    import { notesStore } from '$lib/stores/note';
    import { type TempNote } from '$lib/stores/localStorage';

    let editorContainer = $state<HTMLDivElement>();
    let previewContainer = $state<HTMLDivElement | undefined>();
    let resizeHandle = $state<HTMLDivElement>();
    let ydoc: Y.Doc;
    let provider: WebsocketProvider | null;
    let ytext: Y.Text;
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

    // Resize state
    let editorWidth = $state(50);
    let isResizing = $state(false);

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
        initializeYJS();
        await updatePreview();
    });

    onDestroy(() => {
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }
        if (provider) {
            provider.destroy();
        }
        if (ydoc) {
            ydoc.destroy();
        }
    });

    function initializeYJS() {
        // Destroy existing connection if present
        if (provider) {
            provider.destroy();
            provider = null;
        }
        if (ydoc) {
            ydoc.destroy();
        }

        // Initialize YJS only if the note is collaborative
        if (isCollaborative) {
            ydoc = new Y.Doc();

            // Use the note ID as room name for collaboration
            const roomName = currentNoteId || 'temp-' + Date.now();
            provider = new WebsocketProvider('ws://localhost:1234', roomName, ydoc);

            ytext = ydoc.getText('content');

            // Listener for YJS changes - PREVENT LOOPS
            ytext.observe(async (event, transaction) => {
                // Ignore if the change comes from this instance
                if (transaction.local || isUpdatingYJS) return;

                const newContent = ytext.toString();
                if (newContent !== markdownContent && !isUpdatingFromYJS) {
                    isUpdatingFromYJS = true;
                    markdownContent = newContent;
                    await updatePreview();
                    scheduleAutoSave();

                    // Reset flag after a tick
                    setTimeout(() => {
                        isUpdatingFromYJS = false;
                    }, 0);
                }
            });

            // Synchronize current content ONLY if YJS is empty
            provider.on('status', (event: any) => {
                if (event.status === 'connected') {
                    // Wait a moment for initial synchronization
                    setTimeout(() => {
                        if (ytext.length === 0 && markdownContent.trim()) {
                            isUpdatingYJS = true;
                            ytext.insert(0, markdownContent);
                            setTimeout(() => {
                                isUpdatingYJS = false;
                            }, 100);
                        } else if (ytext.length > 0 && !isUpdatingFromYJS) {
                            isUpdatingFromYJS = true;
                            markdownContent = ytext.toString();
                            updatePreview();
                            setTimeout(() => {
                                isUpdatingFromYJS = false;
                            }, 0);
                        }
                    }, 100);
                }
            });

            console.log('🤝 Collaborative mode enabled for room:', roomName);
        } else {
            console.log('✏️ Solo editing mode');
        }
    }

    // Watcher for when isCollaborative changes
    $effect(() => {
        initializeYJS();
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
        // Prevent loop if we're updating from YJS
        if (isUpdatingFromYJS) return;

        const target = event.target as HTMLTextAreaElement;
        const newContent = target.value;

        markdownContent = newContent;
        await updatePreview();
        scheduleAutoSave();

        // If collaborative, synchronize with YJS
        if (isCollaborative && ytext && !isUpdatingYJS) {
            isUpdatingYJS = true;

            // Calculate differences instead of replacing everything
            const currentYJSContent = ytext.toString();
            if (currentYJSContent !== newContent) {
                // More efficient method: use YJS transactions
                ydoc.transact(() => {
                    ytext.delete(0, ytext.length);
                    ytext.insert(0, newContent);
                });
            }

            setTimeout(() => {
                isUpdatingYJS = false;
            }, 50);
        }
    }

    function scheduleAutoSave() {
        // Don't auto-save if we're syncing
        if (isUpdatingFromYJS) return;

        saveStatus = 'unsaved';

        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }

        autoSaveTimeout = setTimeout(() => {
            saveNote();
        }, 2000);
    }

    function saveNote() {
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

            // If it just became collaborative and has an ID, reconnect YJS
            if (isCollaborative && !provider) {
                initializeYJS();
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

        // Reset flags
        isUpdatingFromYJS = false;
        isUpdatingYJS = false;

        // Reinitialize YJS if needed
        if (provider) {
            provider.destroy();
            provider = null;
        }

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
        if (isCollaborative && ytext && !isUpdatingYJS) {
            isUpdatingYJS = true;
            ydoc.transact(() => {
                ytext.delete(0, ytext.length);
                ytext.insert(0, newContent);
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

    // Resize functions remain the same
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
                        <Checkbox bind:checked={isCollaborative} onchange={scheduleAutoSave} />
                        <Label class="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            <UsersGroupOutline class="w-4 h-4" />
                            Collaborative
                        </Label>
                    </div>

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
                <div class="w-full h-full overflow-auto bg-white dark:bg-gray-900">
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

<style>
    .resize-container {
        user-select: none;
    }
</style>