import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

/**
 * Renderer treści CMS.
 *
 * `react-markdown` domyślnie **nie** przepuszcza surowego HTML-u — i tak
 * zostaje. Treść pisze admin w panelu, ale markdown to wystarczająca władza
 * nad stroną; wstrzykiwanie skryptów przez pole tekstowe nią nie jest.
 *
 * Dwa warianty stylów, bo ten sam komponent renderuje podgląd w panelu
 * (tokeny panelu) i gotową stronę publiczną (tokeny `--front-*`).
 */

const FRONT = {
  h2: "mt-10 mb-3 font-display text-3xl font-semibold tracking-tight first:mt-0",
  h3: "mt-8 mb-2 font-display text-2xl font-semibold tracking-tight",
  h4: "mt-6 mb-2 font-display text-xl font-semibold",
  p: "mt-4 max-w-[68ch] leading-relaxed text-front-muted",
  a: "font-semibold text-front-brand hover:underline",
  ul: "mt-4 grid max-w-[68ch] gap-2 text-front-muted",
  ol: "mt-4 grid max-w-[68ch] gap-2 text-front-muted",
  li: "flex gap-2.5 before:mt-2.5 before:size-1.5 before:shrink-0 before:rounded-full before:bg-front-brand",
  blockquote:
    "mt-6 max-w-[68ch] rounded-2xl bg-front-brand-soft px-5 py-4 leading-relaxed text-front-ink",
  code: "rounded-md bg-front-ground px-1.5 py-0.5 font-mono text-[0.9em]",
  hr: "my-10 border-front-line",
  table: "mt-6 w-full border-collapse text-left",
  th: "border-b border-front-line py-2 pr-4 font-display font-semibold",
  td: "border-b border-front-line py-2 pr-4 text-front-muted",
  strong: "font-bold text-front-ink",
}

const PANEL = {
  h2: "mt-6 mb-2 text-lg font-semibold text-foreground first:mt-0",
  h3: "mt-5 mb-1.5 text-base font-semibold text-foreground",
  h4: "mt-4 mb-1 text-sm font-semibold text-foreground",
  p: "mt-3 text-sm leading-relaxed text-muted-foreground",
  a: "font-medium text-foreground underline",
  ul: "mt-3 grid gap-1.5 text-sm text-muted-foreground",
  ol: "mt-3 grid gap-1.5 text-sm text-muted-foreground",
  li: "flex gap-2 before:mt-2 before:size-1 before:shrink-0 before:rounded-full before:bg-muted-foreground/50",
  blockquote:
    "mt-4 rounded-lg bg-muted px-4 py-3 text-sm leading-relaxed text-foreground",
  code: "rounded bg-muted px-1 py-0.5 font-mono text-xs",
  hr: "my-6 border-border",
  table: "mt-4 w-full border-collapse text-left text-sm",
  th: "border-b border-border py-1.5 pr-3 font-medium text-foreground",
  td: "border-b border-border py-1.5 pr-3 text-muted-foreground",
  strong: "font-semibold text-foreground",
}

export function MarkdownContent({
  content,
  tone = "front",
  className,
}: {
  content: string
  tone?: "front" | "panel"
  className?: string
}) {
  const s = tone === "front" ? FRONT : PANEL

  return (
    <div className={cn("min-w-0", className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h2 className={s.h2} {...props} />,
          h2: (props) => <h2 className={s.h2} {...props} />,
          h3: (props) => <h3 className={s.h3} {...props} />,
          h4: (props) => <h4 className={s.h4} {...props} />,
          p: (props) => <p className={s.p} {...props} />,
          a: (props) => (
            <a
              className={s.a}
              {...props}
              {...(props.href?.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            />
          ),
          ul: (props) => <ul className={s.ul} {...props} />,
          ol: (props) => <ol className={s.ol} {...props} />,
          li: (props) => <li className={s.li} {...props} />,
          blockquote: (props) => <blockquote className={s.blockquote} {...props} />,
          code: (props) => <code className={s.code} {...props} />,
          hr: (props) => <hr className={s.hr} {...props} />,
          table: (props) => (
            <div className="mt-2 overflow-x-auto">
              <table className={s.table} {...props} />
            </div>
          ),
          th: (props) => <th className={s.th} {...props} />,
          td: (props) => <td className={s.td} {...props} />,
          strong: (props) => <strong className={s.strong} {...props} />,
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
