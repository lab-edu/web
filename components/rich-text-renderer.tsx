import sanitizeHtml from "sanitize-html";

type RichTextRendererProps = {
  html?: string | null;
  emptyText?: string;
  className?: string;
};

const allowedTags = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "blockquote",
  "ul",
  "ol",
  "li",
  "pre",
  "code",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "a",
  "span",
];

function normalizeHtml(value?: string | null) {
  const safe = (value ?? "").toString();
  const trimmed = safe.trim();
  if (!trimmed) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function RichTextRenderer({ html, emptyText = "暂无内容", className }: RichTextRendererProps) {
  const source = html?.trim();

  if (!source) {
    return <span className={`rich-text-renderer__empty ${className ?? ""}`.trim()}>{emptyText}</span>;
  }

  const clean = sanitizeHtml(normalizeHtml(source), {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: [],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noreferrer noopener", target: "_blank" }),
    },
  });

  return <div className={`rich-text-renderer ${className ?? ""}`.trim()} dangerouslySetInnerHTML={{ __html: clean }} />;
}