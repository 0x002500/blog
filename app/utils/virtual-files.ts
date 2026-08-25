import type { TerminalDocument, VirtualFile } from './commands/types'

function inlineText(node: unknown): string {
  if (typeof node === 'string') return node
  if (!Array.isArray(node)) return ''
  const [tag, properties, ...children] = node
  if (tag === 'style') return ''
  if (tag === 'pre' && properties && typeof properties === 'object' && 'code' in properties) {
    return typeof properties.code === 'string' ? properties.code : ''
  }
  return children.map(inlineText).join('')
}

function bodyLines(body: unknown) {
  if (!body || typeof body !== 'object' || !('value' in body) || !Array.isArray(body.value)) return []
  return body.value
    .flatMap((node) => inlineText(node).split(/\r?\n/))
    .map(line => line.trimEnd())
    .filter(Boolean)
}

function documentLines(document: TerminalDocument) {
  return [
    document.title,
    document.date,
    document.description,
    document.tags?.join(' '),
    ...bodyLines(document.body),
  ].filter((line): line is string => Boolean(line))
}

export function createVirtualFiles(documents: TerminalDocument[]): VirtualFile[] {
  return documents.map(document => ({
    path: `~/${document.stem}.md`,
    document,
    lines: documentLines(document),
  }))
}
