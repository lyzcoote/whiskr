<script lang="ts">
    import { enhance } from '$app/forms';
    import { Card, Button, Input, Label, Heading, P, Alert } from 'flowbite-svelte';
    import { UserSolid, LockSolid, MailBoxOutline, UserCircleSolid } from 'flowbite-svelte-icons';
    import type { ActionData } from './$types';

    let { form }: { form: ActionData } = $props();
</script>

<div class="max-w-md mx-auto p-6">
    <Card class="p-6">
        <div class="text-center mb-6">
            <Heading tag="h1" class="mb-2">Create Account</Heading>
            <P class="text-gray-500 dark:text-gray-400">Join Whiskr today</P>
        </div>

        <form method="post" action="?/register" use:enhance class="space-y-4">
            <div>
                <Label for="name" class="mb-2">Name</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    required
                >
                </Input>
            </div>

			<div>
				<Label for="surname" class="mb-2">Surname</Label>
				<Input
					id="surname"
					name="surname"
					placeholder="Enter your surname"
					required
				>
				</Input>
			</div>

            <div>
                <Label for="username" class="mb-2">Username</Label>
                <Input
                    id="username"
                    name="username"
                    placeholder="Choose a username"
                    required
                >
                </Input>
            </div>

            <div>
                <Label for="email" class="mb-2">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
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
                    placeholder="Create a password"
                    required
                >
                </Input>
            </div>

            <div class="flex flex-col gap-3 pt-4">
                <Button type="submit" class="w-full">
                    Create Account
                </Button>
                
                <Button 
                    type="submit" 
                    formaction="?/login" 
                    color="alternative" 
                    class="w-full"
                >
                    Sign In Instead
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
                Already have an account? 
                <a href="/login" class="text-blue-600 hover:underline dark:text-blue-500">
                    Sign in here
                </a>
            </P>
        </div>
    </Card>
</div>