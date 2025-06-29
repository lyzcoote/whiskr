<script lang="ts">
	import {
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger,
		Avatar,
		Dropdown,
		DropdownItem,
		DropdownHeader,
		DropdownGroup,
		Skeleton,
		ImagePlaceholder,
		TextPlaceholder,
		Tabs,
		TabItem
	} from 'flowbite-svelte';

	import '../app.css';
	import { type LayoutProps } from './$types';
	import { dev } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { UserSolid } from 'flowbite-svelte-icons';

	// Vercel Analytics and Speed Insights
	injectSpeedInsights();
	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { data, children }: LayoutProps = $props();

	let user = $derived(data?.user || null);
	let isLoggedIn = $derived(!!user);

	$effect(() => {
		if (isLoggedIn) {
			console.log('User logged in:');
			$inspect(user);
		} else {
			console.log('No user logged in');
		}
	});
</script>

<svelte:head>
	<title>Whiskr</title>
	<meta name="description" content="Whiskr - A collaborative Obsidian like Markdown editor! " />
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="flex flex-col min-h-screen">
	<Navbar>
		<NavBrand href="/">
			<img
				src="https://flowbite-svelte.com/images/flowbite-svelte-icon-logo.svg"
				class="me-3 h-6 sm:h-9"
				alt="Flowbite Logo"
			/>
			<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Whiskr</span
			>
		</NavBrand>

		{#key isLoggedIn}
			<div class="flex items-center md:order-2">
				{#if isLoggedIn}
					<Avatar
						id="avatar-menu"
						src="https://api.dicebear.com/9.x/lorelei/svg"
						class="w-8 h-8 me-3 cursor-pointer"
						alt="User avatar"
					/>
				{:else}
					<div
						id="avatar-menu"
						class="w-8 h-8 me-3 cursor-pointer flex items-center justify-center bg-gray-200 rounded-full"
					>
						<UserSolid class="w-5 h-5 text-gray-600" />
					</div>
				{/if}
				<NavHamburger />
			</div>
			<Dropdown placement="bottom" triggeredBy="#avatar-menu">
				{#if isLoggedIn && user}
					<DropdownHeader>
						<span class="block text-sm">{user.name || ''}</span>
						<span class="block truncate text-sm font-medium">{user.email || ''}</span>
					</DropdownHeader>
					<DropdownGroup>
						<DropdownItem href="/">Home</DropdownItem>
						<DropdownItem>Settings</DropdownItem>
						<form method="POST" action="/logout" use:enhance>
							<button
								type="submit"
								class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
							>
								Logout
							</button>
						</form>
					</DropdownGroup>
					<DropdownGroup>
						<DropdownItem href="/profile">Profile</DropdownItem>
					</DropdownGroup>
				{:else}
					<DropdownHeader>
						<span class="block text-sm">Welcome Guest</span>
						<span class="block truncate text-sm font-medium">Please login</span>
					</DropdownHeader>
					<DropdownGroup>
						<DropdownItem href="/login">Login</DropdownItem>
						<DropdownItem href="/register">Register</DropdownItem>
					</DropdownGroup>
				{/if}
			</Dropdown>
		{/key}

		<NavUl>
			<NavLi href="/">Home</NavLi>
			<NavLi href="/about">About</NavLi>
			<NavLi href="/pricing">Pricing</NavLi>
			<NavLi href="/contact">Contact</NavLi>
		</NavUl>
	</Navbar>

	<main id="main-render" class="container mx-auto px-4 sm:px-0 flex-grow">
		<Tabs>
			<TabItem open title="Main Content">
				<div class="flex items-center justify-center min-h-[60vh]">
					{@render children()}
				</div>
			</TabItem>
			<TabItem title="Preview">
				<div style="height:300px;" class="overflow-scroll pb-16">
					<Skeleton class="mt-16 mb-8" />
					<ImagePlaceholder class="my-8" />
					<TextPlaceholder class="my-8" />
				</div>
			</TabItem>
		</Tabs>
	</main>
</div>
