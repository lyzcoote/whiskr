<script lang="ts">
  import { page } from '$app/state';
  import { base } from '$app/paths';
  import { Button, Card, Heading, P, Accordion, AccordionItem } from 'flowbite-svelte';
  import { ArrowLeftOutline, CodeOutline } from 'flowbite-svelte-icons';
  import { m } from '$lib/paraglide/messages.js';

  let errorDetails = $state(page.error);
  let status = $state(page.status);

  let title = $state(m.error_oops_title());
  let message = $state(errorDetails?.message || m.error_unexpected_message());
  let emoji = $state('🤦‍♂️');

  if (status === 404) {
    emoji = '🤷‍♂️';
    title = m.error_404_title();
    message = m.error_404_message();
  } else if (status === 401) {
    emoji = '🚫';
    title = m.error_401_title();
    message = m.error_401_message();
  } else if (status === 403) {
    emoji = '🔒';
    title = m.error_403_title();
    message = m.error_403_message();
  } else if (status === 500) {
    emoji = '🛠️';
    title = m.error_500_title();
    message = m.error_500_message();
  } else if (status === 503) {
    emoji = '🌐';
    title = m.error_503_title();
    message = m.error_503_message();
  } else if (status >= 400 && status < 500) {
    emoji = '🤔';
    title = m.error_client_title();
    message = m.error_client_message();
  }
</script>

<svelte:head>
  <title>{m.error_page_title({ status })}</title>
  <meta name="description" content={m.error_page_description({ status })} />
</svelte:head>

<div class="flex flex-col items-center justify-center p-4 text-center">
  <Card class="max-w-lg w-full" style="padding: 2rem;">
    <div class="flex flex-col items-center">
      <div class="text-6xl mb-4">{emoji}</div>

      <Heading tag="h1" class="mb-2 text-6xl font-bold text-primary-600 dark:text-primary-500">{status}</Heading>
      <Heading tag="h2" class="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">{title}</Heading>
      <P class="mb-6 text-gray-500 dark:text-gray-400">{message}</P>

      {#if errorDetails && import.meta.env.DEV}
        <Accordion class="w-full mb-6 text-left">
          <AccordionItem>
            {#snippet header()}
              <span class="flex items-center">
                <CodeOutline class="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                {m.error_details_dev_mode()}
              </span>
            {/snippet}
            <pre class="p-4 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto max-h-60 text-gray-700 dark:text-gray-300">{JSON.stringify(errorDetails, null, 2)}</pre>
          </AccordionItem>
        </Accordion>
      {/if}

      <Button href="{base}/" color="primary">
        <ArrowLeftOutline class="w-5 h-5 mr-2" />
        {m.error_go_to_homepage()}
      </Button>
    </div>
  </Card>
</div>