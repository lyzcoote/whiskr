<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {
        Button,
        Card,
        Badge,
        Alert,
        Input,
        Label
    } from 'flowbite-svelte';
    import {
        EyeOutline,
        EditOutline,
        UserSolid,
        CalendarOutline
    } from 'flowbite-svelte-icons';
    import CollaborativeUsers from '$lib/components/CollaborativeUsers.svelte';
    import { collaborationStore } from '$lib/stores/collaboration';
    import { marked } from 'marked';
    import type { PageData } from './$types';
    
    let { data }: { data: PageData } = $props();
    
    let markdownContent = $state(data.note.content);
    let htmlPreview = $state('');
    let isEditing = $state(false);
    let guestName = $state('');
    let hasJoined = $state(false);
    
    // Collaboration state
    let collaborationState = $state({
        isConnected: false,
        users: [],
        roomId: null,
        provider: null,
        ydoc: null,
        ytext: null
    });
    
    let isUpdatingFromYJS = $state(false);
    let isUpdatingYJS = $state(false);
    
    // Marked configuration
    marked.setOptions({
        breaks: true,
        gfm: true
    });
    
    onMount(async () => {
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
                        
                        setTimeout(() => {
                            isUpdatingFromYJS = false;
                        }, 0);
                    }
                });
            }
        });
    });
    
    onDestroy(() => {
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
        if (isUpdatingFromYJS || !data.note.allowGuestEdit) return;

        const target = event.target as HTMLTextAreaElement;
        const newContent = target.value;

        markdownContent = newContent;
        await updatePreview();

        // Update cursor position for collaboration
        collaborationStore.updateCursor(target.selectionStart);

        // Synchronize with YJS
        if (collaborationState.ytext && !isUpdatingYJS) {
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
    
    function joinCollaboration() {
        if (!guestName.trim()) {
            guestName = 'Anonymous Guest';
        }
        
        // Connect to collaboration room
        collaborationStore.connect(data.note.id, undefined, guestName);
        hasJoined = true;
    }
    
    function toggleEditMode() {
        if (!data.note.allowGuestEdit) return;
        
        isEditing = !isEditing;
        
        if (isEditing && !hasJoined) {
            joinCollaboration();
        }
    }
    
    function formatDate(date: Date): string {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
</script>

<svelte:head>
    <title>{data.note.title} - Shared Document | Whiskr</title>
    <meta name="description" content="Shared document: {data.note.title}" />
</svelte:head>

<div class="max-w-6xl mx-auto p-6">
    <!-- Header -->
    <Card class="mb-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {data.note.title}
                </h1>
                <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div class="flex items-center gap-1">
                        <UserSolid class="w-4 h-4" />
                        Shared by {data.note.owner.name} (@{data.note.owner.username})
                    </div>
                    <div class="flex items-center gap-1">
                        <CalendarOutline class="w-4 h-4" />
                        Updated {formatDate(data.note.updatedAt)}
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <!-- Collaborative Users -->
                {#if hasJoined}
                    <CollaborativeUsers />
                {/if}
                
                <!-- Permission Badge -->
                <Badge color={data.note.allowGuestEdit ? 'green' : 'blue'}>
                    {#if data.note.allowGuestEdit}
                        <EditOutline class="w-3 h-3 mr-1" />
                        Can Edit
                    {:else}
                        <EyeOutline class="w-3 h-3 mr-1" />
                        View Only
                    {/if}
                </Badge>
                
                <!-- Edit Toggle -->
                {#if data.note.allowGuestEdit}
                    <Button
                        size="sm"
                        color={isEditing ? 'red' : 'blue'}
                        onclick={toggleEditMode}
                    >
                        {#if isEditing}
                            <EyeOutline class="w-4 h-4 mr-2" />
                            View Mode
                        {:else}
                            <EditOutline class="w-4 h-4 mr-2" />
                            Edit Mode
                        {/if}
                    </Button>
                {/if}
            </div>
        </div>
    </Card>
    
    <!-- Guest Name Input (if not joined and editing) -->
    {#if isEditing && !hasJoined}
        <Card class="mb-6">
            <div class="flex items-center gap-3">
                <div class="flex-1">
                    <Label for="guestName" class="mb-2">Your Name (Optional)</Label>
                    <Input
                        id="guestName"
                        bind:value={guestName}
                        placeholder="Enter your name to identify yourself to other collaborators"
                    />
                </div>
                <Button onclick={joinCollaboration} class="mt-6">
                    Join Collaboration
                </Button>
            </div>
        </Card>
    {/if}
    
    <!-- Content Area -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Editor (if editing) -->
        {#if isEditing && data.note.allowGuestEdit}
            <Card class="h-96 lg:h-[600px]">
                <div class="h-full">
                    <h3 class="text-lg font-semibold mb-3">Editor</h3>
                    <textarea
                        bind:value={markdownContent}
                        oninput={handleInput}
                        class="w-full h-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Start editing the document..."
                        disabled={!hasJoined}
                    ></textarea>
                </div>
            </Card>
        {/if}
        
        <!-- Preview -->
        <Card class="h-96 lg:h-[600px] {isEditing && data.note.allowGuestEdit ? '' : 'lg:col-span-2'}">
            <div class="h-full overflow-auto">
                <h3 class="text-lg font-semibold mb-3">
                    {isEditing && data.note.allowGuestEdit ? 'Preview' : 'Document'}
                </h3>
                <div
                    class="prose prose-lg max-w-none dark:prose-invert
                    prose-headings:text-gray-900 dark:prose-headings:text-white
                    prose-p:text-gray-700 dark:prose-p:text-gray-300
                    prose-li:text-gray-700 dark:prose-li:text-gray-300
                    prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:text-gray-900 dark:prose-code:text-gray-100
                    prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
                >
                    {@html htmlPreview}
                </div>
            </div>
        </Card>
    </div>
    
    <!-- Info Alert -->
    {#if !data.note.allowGuestEdit}
        <Alert color="blue" class="mt-6">
            <span class="font-medium">Read-only document:</span>
            This document is shared in view-only mode. You can read the content but cannot make changes.
        </Alert>
    {:else if !isEditing}
        <Alert color="green" class="mt-6">
            <span class="font-medium">Collaborative document:</span>
            This document allows editing. Click "Edit Mode" to start collaborating in real-time with others.
        </Alert>
    {/if}
</div>