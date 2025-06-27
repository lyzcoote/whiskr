<script lang="ts">
    import { enhance } from '$app/forms';
    import { Card, Button, Input, Label, Heading, P, Alert } from 'flowbite-svelte';
    import { UserSolid, LockSolid, UserOutline } from 'flowbite-svelte-icons';
    import type { ActionData } from './$types';

    let { form }: { form: ActionData } = $props();
</script>

<div class="max-w-md mx-auto p-6">
    <Card class="p-6">
        <div class="text-center mb-6">
            <Heading tag="h1" class="mb-2">Welcome Back</Heading>
            <P class="text-gray-500 dark:text-gray-400">Sign in to your Whiskr account</P>
        </div>

        <form method="post" action="?/login" use:enhance class="space-y-4">
            <div>
                <Label for="username" class="mb-2">Username</Label>
                <Input
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    required
                >
                </Input>
            </div>

            <div>
                <Label for="password" class="mb-2">Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                >
                </Input>
            </div>

            <div class="flex flex-col gap-3 pt-4">
                <Button type="submit" class="w-full flex items-center justify-center gap-2">
                    <UserOutline class="w-4 h-4" />
                    Sign In
                </Button>
            </div>
        </form>

        {#if form?.message}
            <Alert color="red" class="mt-4">
                {form.message}
            </Alert>
        {/if}

        <div class="text-center mt-6">
            <P class="text-sm text-gray-500 dark:text-gray-400">
                Don't have an account? 
                <a href="/register" class="text-blue-600 hover:underline dark:text-blue-500">
                    Create one here
                </a>
            </P>
        </div>
    </Card>
</div>