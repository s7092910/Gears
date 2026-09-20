import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { TypeMeta } from '@/components/type-meta';
import { MediaSlot } from '@/components/media-slot';
import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    // Registered globally so content pages don't need to import them. Card, Cards and
    // Callout already come from defaultMdxComponents.
    Tabs,
    Tab,
    TypeTable,
    Accordions,
    Accordion,
    Steps,
    Step,
    TypeMeta,
    MediaSlot,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
