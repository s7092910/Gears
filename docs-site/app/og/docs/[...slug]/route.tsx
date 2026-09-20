import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { renderOGImage, sectionLabel } from '@/lib/og';
import { getPageImageUrl } from '@/lib/shared';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const pageSlugs = slug.slice(0, -1);
  const page = source.getPage(pageSlugs);
  if (!page) notFound();

  return renderOGImage({
    title: page.data.title,
    eyebrow: sectionLabel(pageSlugs),
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImageUrl(page).segments,
  }));
}
