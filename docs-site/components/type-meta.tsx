import { gitConfig } from '@/lib/shared';

export type TypeKind =
  | 'Interface'
  | 'Class'
  | 'Abstract class'
  | 'Sealed class'
  | 'Static class'
  | 'Enum'
  | 'Delegate';

export interface TypeMetaProps {
  kind: TypeKind;
  /** Fully qualified namespace, e.g. `GearsAPI.Settings.Global`. */
  namespace: string;
  /** Repo-relative path to the declaring file, e.g. `GearsAPI/Source/IGearsMod.cs`. */
  source?: string;
  assembly?: string;
}

/**
 * The metadata strip at the top of every API reference type page: what kind of type this is,
 * where it lives, and a link to the declaring file on GitHub.
 */
export function TypeMeta({
  kind,
  namespace,
  source,
  assembly = 'GearsAPI.dll',
}: TypeMetaProps) {
  const sourceUrl = source
    ? `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/${source}`
    : undefined;

  return (
    <div className="not-prose my-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-fd-card px-3 py-2 text-sm text-fd-muted-foreground">
      <span className="font-medium text-fd-foreground">{kind}</span>
      <span aria-hidden>·</span>
      <span>
        Namespace <code className="text-fd-foreground">{namespace}</code>
      </span>
      <span aria-hidden>·</span>
      <span>
        Assembly <code className="text-fd-foreground">{assembly}</code>
      </span>
      {sourceUrl ? (
        <>
          <span aria-hidden>·</span>
          <a
            href={sourceUrl}
            rel="noreferrer noopener"
            target="_blank"
            className="font-medium text-fd-primary underline underline-offset-4"
          >
            Source
          </a>
        </>
      ) : null}
    </div>
  );
}
