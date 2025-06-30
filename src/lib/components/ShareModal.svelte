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
        ShareOutline, 
        CopyOutline, 
        CheckOutline,
        EyeOutline,
        EditOutline
    } from 'flowbite-svelte-icons';
    
    let { 
        open = $bindable(false),
        noteId,
        shareToken,
        allowGuestEdit = $bindable(false),
        onUpdatePermissions
    }: {
        open: boolean;
        noteId: string | null;
        shareToken: string | null;
        allowGuestEdit: boolean;
        onUpdatePermissions: (allowEdit: boolean) => Promise<void>;
    } = $props();
    
    let copied = $state(false);
    let shareUrl = $state('');
    
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
                            <CopyOutline class="w-4 h-4" />
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
                Save your document first to enable sharing.
            </Alert>
        {/if}
    </div>
    
    <svelte:fragment slot="footer">
        <Button color="alternative" onclick={() => open = false}>
            Close
        </Button>
        {#if shareUrl}
            <Button onclick={copyToClipboard}>
                <ShareOutline class="w-4 h-4 mr-2" />
                Copy Link
            </Button>
        {/if}
    </svelte:fragment>
</Modal>