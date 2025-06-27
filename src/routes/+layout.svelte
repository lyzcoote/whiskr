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
	import type { LayoutServerLoad } from './$types';

	import { type LayoutProps } from "./$types";
  let { data, children }: LayoutProps = $props();

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
            <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
                >Whiskr</span
            >
        </NavBrand>
        <div class="flex items-center md:order-2">
            <Avatar id="avatar-menu" src="https://api.dicebear.com/9.x/lorelei/svg" 
				class="w-8 h-8 me-3 cursor-pointer"
				alt="User avatar"
			/>
            <NavHamburger />
        </div>
        <Dropdown placement="bottom" triggeredBy="#avatar-menu">
            {#if data.user.username}
            <DropdownHeader>
                <span class="block text-sm">{data.user.name + "" + data.user.surname}</span>
                <span class="block truncate text-sm font-medium">{data.user.email}</span>
            </DropdownHeader>
            <DropdownGroup>
                <DropdownItem>Home</DropdownItem>
                <DropdownItem>Settings</DropdownItem>
				<DropdownItem href="/logout">Logout</DropdownItem>
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