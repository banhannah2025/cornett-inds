import type { PortableTextBlock } from "next-sanity";

export function portableTextToEditorText(body?: PortableTextBlock[]) {
  return (body ?? [])
    .filter((block) => block._type === "block")
    .map((block) => {
      const text =
        block.children
          ?.map((child) => ("text" in child ? child.text : ""))
          .join("") ?? "";
      if (block.style === "h2") return `## ${text}`;
      if (block.style === "h3") return `### ${text}`;
      if (block.style === "blockquote") return `> ${text}`;
      return text;
    })
    .join("\n\n");
}

export function editorTextToPortableText(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => {
      let style = "normal";
      let content = paragraph;
      if (paragraph.startsWith("### ")) {
        style = "h3";
        content = paragraph.slice(4);
      } else if (paragraph.startsWith("## ")) {
        style = "h2";
        content = paragraph.slice(3);
      } else if (paragraph.startsWith("> ")) {
        style = "blockquote";
        content = paragraph.slice(2);
      }
      return {
        _type: "block",
        _key: `block-${Date.now()}-${index}`,
        style,
        markDefs: [],
        children: [
          { _type: "span", _key: `span-${index}`, text: content, marks: [] },
        ],
      };
    });
}
