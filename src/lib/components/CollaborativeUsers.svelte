<script lang="ts">
    import { Avatar, Badge, Tooltip } from 'flowbite-svelte';
    import { UserSolid } from 'flowbite-svelte-icons';
    import { collaborationStore, type CollaborativeUser } from '$lib/stores/collaboration';
    
    let users = $state<CollaborativeUser[]>([]);
    let isConnected = $state(false);
    
    collaborationStore.subscribe(state => {
        users = state.users;
        isConnected = state.isConnected;
    });
</script>

<div class="flex items-center gap-2">
    <!-- Connection Status -->
    <div class="flex items-center gap-1">
        <div class="w-2 h-2 rounded-full {isConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
        <span class="text-xs text-gray-500 dark:text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
        </span>
    </div>
    
    <!-- Active Users -->
    {#if users.length > 0}
        <div class="flex items-center gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400 mr-1">
                {users.length} user{users.length !== 1 ? 's' : ''}
            </span>
            
            {#each users.slice(0, 5) as user (user.id)}
                <div class="relative">
                    <Avatar
                        size="xs"
                        class="border-2"
                        style="border-color: {user.color}"
                        id="user-{user.id}"
                    >
                        <UserSolid class="w-3 h-3" style="color: {user.color}" />
                    </Avatar>
                    
                    <Tooltip triggeredBy="#user-{user.id}" placement="bottom">
                        {user.name}
                        {#if user.isGuest}
                            <Badge color="gray" class="ml-1">Guest</Badge>
                        {/if}
                    </Tooltip>
                </div>
            {/each}
            
            {#if users.length > 5}
                <Badge color="gray" class="text-xs">
                    +{users.length - 5}
                </Badge>
            {/if}
        </div>
    {/if}
</div>