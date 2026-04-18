export function parseTodoInput(raw: string): { title: string; tags: string[] } {
  const tags: string[] = []
  const title = raw
    .replace(/#([^\s#]+)/g, (_, tag: string) => {
      tags.push(tag)
      return ''
    })
    .replace(/\s+/g, ' ')
    .trim()

  return { title, tags }
}
