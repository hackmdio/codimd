export function stripTags(s) {
  return s.replace(RegExp('</?[^<>]*>', 'gi'), '')
}
