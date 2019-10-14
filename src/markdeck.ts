/**
 * Utils for handling presenting markdown
 */

/**
 * Split markdown to pages by "horizontal rules" (`---` or `***`)
 * @param markdown the markdown string
 */
export function splitMarkdownToPages (markdown: string): string[] {
  return markdown.split(/\n[-*]{3,}\n/)
}
