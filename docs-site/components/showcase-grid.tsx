'use client';

import { Fragment, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';

/** A mod card, already rendered on the server, with the fields the search and filter read. */
export type ShowcaseGridItem = {
  key: string;
  name: string;
  description: string;
  globalSettings: boolean;
  worldSettings: boolean;
  tile: ReactNode;
};

const filters = [
  { value: 'all', label: 'All' },
  { value: 'global', label: 'Global settings' },
  { value: 'world', label: 'World settings' },
] as const;

type Filter = (typeof filters)[number]['value'];

// A mod with both kinds of settings shows under either filter.
function matchesFilter(item: ShowcaseGridItem, filter: Filter) {
  switch (filter) {
    case 'all':
      return true;
    case 'global':
      return item.globalSettings;
    case 'world':
      return item.worldSettings;
  }
}

// Every word in the query has to appear somewhere in the mod's name or description.
function matchesQuery(item: ShowcaseGridItem, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${item.name} ${item.description}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

/**
 * The Mod Showcase grid, with a search box and a settings filter.
 *
 * The tiles are rendered by the page, on the server, because `MediaSlot` reads the file system to
 * find each image. This component only chooses which of them to show. `trailing` is always shown
 * last, whatever the search and filter are.
 */
export function ShowcaseGrid({
  items,
  trailing,
}: {
  items: ShowcaseGridItem[];
  trailing: ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const shown = items.filter((item) => matchesFilter(item, filter) && matchesQuery(item, query));
  const narrowed = shown.length !== items.length;

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative w-full md:max-w-sm">
          <span className="sr-only">Search mods</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fd-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mods"
            className="h-10 w-full rounded-md border border-fd-border bg-fd-background ps-9 pe-3 text-sm placeholder:text-fd-muted-foreground focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
          />
        </label>
        <div
          role="group"
          aria-label="Filter by settings"
          className="flex flex-wrap gap-1 rounded-md border border-fd-border p-1"
        >
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className="rounded px-3 py-1.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground aria-pressed:bg-fd-primary aria-pressed:text-fd-primary-foreground"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm text-fd-muted-foreground" aria-live="polite">
        {narrowed
          ? shown.length === 0
            ? 'No mods match your search and filter.'
            : `Showing ${shown.length} of ${items.length} mods.`
          : ''}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => (
          <Fragment key={item.key}>{item.tile}</Fragment>
        ))}
        {trailing}
      </div>
    </>
  );
}
