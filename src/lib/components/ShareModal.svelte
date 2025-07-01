<script lang="ts">
    import { 
        Modal, 
        Button, 
        Input, 
        Label, 
        Toggle, 
        Alert,
        Badge,
        Card,
        P
    } from 'flowbite-svelte';
    import { 
        ShareAllOutline, 
        FileCopyOutline, 
        CheckOutline,
        EyeOutline,
        EditOutline
    } from 'flowbite-svelte-icons';
    
    let { 
        open = $bindable(false),
        noteId,
        shareToken = $bindable(),
        allowGuestEdit = $bindable(false),
        onUpdatePermissions,
        noteTitle,
        noteContent
    }: {
        open: boolean;
        noteId: string | null;
        shareToken: string | null;
        allowGuestEdit: boolean;
        onUpdatePermissions: (allowEdit: boolean) => Promise<void>;
        noteTitle: string;
        noteContent: string;
    } = $props();
    
    let copied = $state(false);
    let shareUrl = $state('');
    let isGenerating = $state(false);
    
    $effect(() => {
        if (shareToken && typeof window !== 'undefined') {
            shareUrl = `${window.location.origin}/shared/${shareToken}`;
        }
    });
    
    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(shareUrl);
            copied = true;
            setTimeout(() => {
                copied = false;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }
    
    async function handlePermissionChange() {
        if (onUpdatePermissions) {
            await onUpdatePermissions(allowGuestEdit);
        }
    }

    async function generateShareLink() {
        if (!noteId || !noteTitle.trim() || !noteContent.trim()) {
            alert('Please save your note first before sharing');
            return;
        }

        isGenerating = true;
        try {
            const response = await fetch('/api/notes/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    noteId,
                    title: noteTitle,
                    content: noteContent,
                    allowGuestEdit
                })
            });

            if (response.ok) {
                const data = await response.json();
                shareToken = data.shareToken;
            } else {
                throw new Error('Failed to generate share link');
            }
        } catch (error) {
            console.error('Error generating share link:', error);
            alert('Failed to generate share link. Please try again.');
        } finally {
            isGenerating = false;
        }
    }
</script>

<Modal bind:open title="Share Document" size="md">
    <div class="space-y-6">
        {#if shareToken}
            <!-- Share URL -->
            <div>
                <Label class="mb-2">Share Link</Label>
                <div class="flex gap-2">
                    <Input
                        value={shareUrl}
                        readonly
                        class="flex-1"
                    />
                    <Button
                        size="sm"
                        color="alternative"
                        onclick={copyToClipboard}
                        class="flex-shrink-0"
                    >
                        {#if copied}
                            <CheckOutline class="w-4 h-4" />
                        {:else}
                            <FileCopyOutline class="w-4 h-4" />
                        {/if}
                    </Button>
                </div>
                {#if copied}
                    <P class="text-sm text-green-600 dark:text-green-400 mt-1">
                        Link copied to clipboard!
                    </P>
                {/if}
            </div>
            
            <!-- Permissions -->
            <Card class="p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        {#if allowGuestEdit}
                            <EditOutline class="w-5 h-5 text-blue-500" />
                            <div>
                                <P class="font-medium">Edit Access</P>
                                <P class="text-sm text-gray-500">Guests can edit this document</P>
                            </div>
                        {:else}
                            <EyeOutline class="w-5 h-5 text-gray-500" />
                            <div>
                                <P class="font-medium">View Only</P>
                                <P class="text-sm text-gray-500">Guests can only view this document</P>
                            </div>
                        {/if}
                    </div>
                    <Toggle
                        bind:checked={allowGuestEdit}
                        onchange={handlePermissionChange}
                    />
                </div>
            </Card>
            
            <!-- Security Notice -->
            <Alert color="yellow">
                <span class="font-medium">Security Notice:</span>
                Anyone with this link can access your document. Only share with trusted individuals.
            </Alert>
            
        {:else}
            <Alert color="blue">
                <span class="font-medium">No share link generated yet.</span>
                Click "Generate Share Link" to create a shareable link for this document.
            </Alert>
        {/if}
    </div>
    
    <svelte:fragment>
        <Button color="alternative" onclick={() => open = false}>
            Close
        </Button>
        {#if shareUrl}
            <Button onclick={copyToClipboard}>
                <ShareAllOutline class="w-4 h-4 mr-2" />
                Copy Link
            </Button>
        {:else}
            <Button onclick={generateShareLink} disabled={isGenerating}>
                {#if isGenerating}
                    Generating...
                {:else}
                    <ShareAllOutline class="w-4 h-4 mr-2" />
                    Generate Share Link
                {/if}
            </Button>
        {/if}
    </svelte:fragment>
</Modal>