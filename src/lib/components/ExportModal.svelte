<script lang="ts">
    import { 
        Modal, 
        Button, 
        Label, 
        Select, 
        Checkbox, 
        Range, 
        P,
        Spinner,
        Progress
    } from 'flowbite-svelte';
    import { 
        DownloadOutline, 
        FileImageOutline, 
        FilePdfOutline, 
        FileCodeOutline 
    } from 'flowbite-svelte-icons';
    import { exportStore } from '$lib/stores/export';
    
    let { 
        open = $bindable(false),
        content,
        title,
        previewElement
    }: {
        open: boolean;
        content: string;
        title: string;
        previewElement: HTMLElement | null;
    } = $props();
    
    let format = $state<'png' | 'pdf' | 'md'>('md');
    let includeMetadata = $state(true);
    let quality = $state(90);
    let filename = $state('');
    
    let exportState = $state({ isExporting: false, progress: 0 });
    
    exportStore.subscribe(state => {
        exportState = state;
    });
    
    $effect(() => {
        if (title) {
            filename = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        }
    });
    
    const formatOptions = [
        { value: 'md', name: 'Markdown (.md)', icon: FileCodeOutline },
        { value: 'png', name: 'PNG Image (.png)', icon: FileImageOutline },
        { value: 'pdf', name: 'PDF Document (.pdf)', icon: FilePdfOutline }
    ];
    
    async function handleExport() {
        if (!filename.trim()) {
            filename = 'document';
        }
        
        const fullFilename = `${filename}.${format}`;
        
        try {
            switch (format) {
                case 'png':
                    if (previewElement) {
                        await exportStore.exportToPNG(previewElement, fullFilename);
                    }
                    break;
                case 'pdf':
                    if (previewElement) {
                        await exportStore.exportToPDF(previewElement, fullFilename);
                    }
                    break;
                case 'md':
                    let exportContent = content;
                    if (includeMetadata) {
                        const metadata = `---
title: ${title}
created: ${new Date().toISOString()}
---

`;
                        exportContent = metadata + content;
                    }
                    exportStore.exportToMarkdown(exportContent, title, fullFilename);
                    break;
            }
            
            // Close modal after successful export
            setTimeout(() => {
                open = false;
            }, 1500);
            
        } catch (error) {
            console.error('Export failed:', error);
        }
    }
</script>

<Modal bind:open title="Export Document" size="md">
    <div class="space-y-6">
        <!-- Format Selection -->
        <div>
            <Label class="mb-2">Export Format</Label>
            <div class="grid grid-cols-1 gap-2">
                {#each formatOptions as option}
                    <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 {format === option.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}">
                        <input
                            type="radio"
                            bind:group={format}
                            value={option.value}
                            class="sr-only"
                        />
                        <svelte:component this={option.icon} class="w-5 h-5 mr-3 text-gray-500" />
                        <span class="font-medium">{option.name}</span>
                    </label>
                {/each}
            </div>
        </div>
        
        <!-- Filename -->
        <div>
            <Label for="filename" class="mb-2">Filename</Label>
            <div class="flex">
                <input
                    id="filename"
                    bind:value={filename}
                    class="flex-1 p-2.5 text-sm text-gray-900 bg-gray-50 rounded-l-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="Enter filename"
                />
                <span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                    .{format}
                </span>
            </div>
        </div>
        
        <!-- Options -->
        {#if format === 'md'}
            <div>
                <Checkbox bind:checked={includeMetadata}>
                    Include metadata (title, creation date)
                </Checkbox>
            </div>
        {/if}
        
        {#if format === 'png' || format === 'pdf'}
            <div>
                <Label class="mb-2">Quality: {quality}%</Label>
                <Range bind:value={quality} min="50" max="100" step="10" />
                <P class="text-sm text-gray-500 mt-1">
                    Higher quality results in larger file sizes
                </P>
            </div>
        {/if}
        
        <!-- Export Progress -->
        {#if exportState.isExporting}
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <Spinner size="4" />
                    <span class="text-sm">Exporting...</span>
                </div>
                <Progress progress={exportState.progress} />
            </div>
        {/if}
    </div>
    
    <svelte:fragment slot="footer">
        <Button color="alternative" onclick={() => open = false}>
            Cancel
        </Button>
        <Button 
            onclick={handleExport} 
            disabled={exportState.isExporting || !filename.trim()}
        >
            <DownloadOutline class="w-4 h-4 mr-2" />
            Export
        </Button>
    </svelte:fragment>
</Modal>