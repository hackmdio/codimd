export function stripTags(s: string): string {
  return s.replace(RegExp('</?[^<>]*>', 'gi'), '')
}
