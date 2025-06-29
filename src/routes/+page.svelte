<script lang="ts">
  import { setLocale } from '$lib/paraglide/runtime';
  import { m } from '$lib/paraglide/messages.js';
  import { Label, Input, Button } from 'flowbite-svelte';
  
  let userName = $state("");
</script>

<div class="flex items-center justify-center bg-gray-50">
  <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
    <h1 class="text-2xl font-bold text-center mb-6 text-gray-800">
      {m.hello_world({ name: userName || 'Guest' })}
    </h1>
    
    <div class="mb-6">
      <Label for="name" class="block mb-2 text-sm font-medium">
        Name
      </Label>
        <Input
            id="name"
            type="text"
            bind:value={userName}
            placeholder="Enter your name"
            class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
    
    <div class="flex gap-3 justify-center">
        <Button
            onclick={() => setLocale('en')}
            class="bg-blue-500 text-white hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
        >
            English
        </Button>
        <Button
            onclick={() => setLocale('it')}
            class="bg-green-500 text-white hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5"
        >
            Italiano
        </Button>
    </div>
  </div>
</div>