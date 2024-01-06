<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import InputText from 'primevue/inputtext';
import DataView from 'primevue/dataview';
import Button from 'primevue/button';
import SplitButton from 'primevue/splitbutton';
import Chip from 'primevue/chip';
import { refDebounced, useEventListener } from '@vueuse/core';
import { Search } from 'lucide-vue-next';
import { vscode } from '@/utils/vscode';
import { type IncomingMessage, type OutcomingMessage, type InstallMessage } from '@/models/message';
import type { Suggestion } from './model';
import type { MenuItem } from 'primevue/menuitem';

const buttons: MenuItem[] = [
  {
    type: 'install-dev',
    label: 'devDependencies',
  },
];
const search = ref('')
const debouncedSearch = refDebounced(search, 1_000)
const suggestions = ref<Suggestion[] | undefined>(undefined)

// handle sending "link" message to extension
function onClickLinkToNpm(link: string) {
  const linkMessage: OutcomingMessage = {
    type: 'link',
    link
  }

  vscode.postMessage(linkMessage);
}

// handle sending "install" message to extension
function installAs(message: InstallMessage) {
  vscode.postMessage(message);
}

// handle sending "search" message to extension
watchEffect(() => {
  const searchMessage: OutcomingMessage = {
    type: 'search',
    search: debouncedSearch.value
  }

  vscode.postMessage(searchMessage)
})

// Handle messages sent from the extension to the webview
useEventListener('message', event => {
  // The json data that the extension sent
  const message = event.data as IncomingMessage;

  switch (message.type) {
    // we can't fetch in the webview, so we fetch in the extension and send the response back to webview
    case 'ext.suggestions': {
      // assign suggestions to ref
      suggestions.value = message.suggestions
      break;
    }
  }
});
</script>

<template>
  <main class="flex flex-col justify-center w-full h-full gap-3 p-1.5">
    <header class="flex flex-col gap-1.5 xs:flex-row xs:justify-between xs:items-center">
      <label for="search" class="text-base text-primary-500">Search package:</label>

      <span class="relative">
        <Search class="h-[1.1em] absolute top-2/4 -mt-2 left-2" />
        <InputText id="search" class="pl-10 w-full xs:w-[33vw]" placeholder="Package name..." size="small"
          v-model="search" />
      </span>
    </header>

    <DataView v-show="!!debouncedSearch" dataKey="highlight" paginator :value="suggestions" :rows="5" :pt="{
      root: { class: '[&>nav>div]:mt-5 [&>nav>div]:bg-[var(--vscode-sideBar-background)]' },
      content: { class: 'bg-[var(--vscode-sideBar-background)]' },
    }">
      <template #empty>
        <p class="text-center">Not found</p>
      </template>

      <template #list="{ items }">
        <section class="grid grid-cols-1 gap-5">
          <div v-for="( suggestion, index ) in (items as Suggestion[]) " :key="index" class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <p class="cursor-pointer text-primary-500 hover:underline hover:font-bold"
                @click="onClickLinkToNpm(suggestion.package.links.npm)">{{ suggestion.package.name }}@{{
                  suggestion.package.version }}</p>

              <SplitButton label="Install" size="small" text :model="buttons"
                @click="installAs({ type: 'install-prod', packageName: suggestion.package.name, version: suggestion.package.version })">
                <template #item="{ item }">
                  <Button class="w-full" text :label="(item.label as string)"
                    @click="installAs({ type: item.type, packageName: suggestion.package.name, version: suggestion.package.version })" />
                </template>
              </SplitButton>
            </div>

            <p class="text-xs text-[var(--vscode-sideBarTitle-foreground)]">{{ suggestion.package.description }}</p>
            <p class="text-xs text-slate-500">Updated on {{ new
              Date(suggestion.package.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) }}</p>

            <span class="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5"
              v-show="!!suggestion?.package?.keywords?.length">
              <Chip v-for="keyword in suggestion.package.keywords" :label="keyword"
                :pt="{ root: 'rounded-full pl-2 py-1 border border-[var(--vscode-sideBarSectionHeader-border)] bg-[var(--vscode-sideBarSectionHeader-background)]', label: 'truncate text-xs text-[var(--vscode-sideBarSectionHeader-foreground)]' }" />
            </span>
          </div>
        </section>
      </template>
    </DataView>
  </main>
</template>