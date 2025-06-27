<script lang="ts">
    import { enhance } from '$app/forms';
    import { Card, Avatar, Button, Badge, Heading, P } from 'flowbite-svelte';
    import { UserSolid, UserRemoveOutline } from 'flowbite-svelte-icons';
    import type { PageServerData } from './$types';

    let { data }: { data: PageServerData } = $props();
</script>

<div class="max-w-2xl mx-auto p-6">
    <Card class="text-center">
        <div class="flex flex-col items-center pb-10">
            <Avatar size="xl" class="mb-3">
                <UserSolid class="w-12 h-12 text-gray-400" />
            </Avatar>
            
            <Heading tag="h1" class="mb-1 text-xl font-medium text-gray-900 dark:text-white">
                {data.user.username}
            </Heading>
            
            <Badge color="blue" class="mb-4">
                User ID: {data.user.id}
            </Badge>
            
            <P class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Welcome to your profile page
            </P>
            
            <form method="post" action="?/logout" use:enhance>
                <Button type="submit" color="red" class="flex items-center gap-2">
                    <UserRemoveOutline class="w-4 h-4" />
                    Sign out
                </Button>
            </form>
        </div>
    </Card>
</div>