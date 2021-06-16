declare global {
  module diffMatchPatch {
    export const DIFF_DELETE = -1;
    export const DIFF_INSERT = 1;
    export const DIFF_EQUAL = 0;
  }

  enum DiffType {
    DIFF_DELETE = -1,
    DIFF_INSERT = 1,
    DIFF_EQUAL = 0
  }

  type Diff = {
    [0]: DiffType
    [1]: string
  }

  interface Patch {
    diffs: Diff[];

    start1?: number
    start2?: number

    length1: number
    length2: number

    toString(): string
  }

  class diffMatchPatch {
    diff_main(text1: string, text2: string, opt_checklines?: boolean,
              opt_deadline?: number): Diff[]

    diff_cleanupSemantic(diffs: Diff[])

    diff_cleanupEfficiency(diffs: Diff[])

    diff_cleanupSemanticLossless(diffs: Diff[])

    diff_levenshtein(diffs: Diff[]): number

    diff_prettyHtml(diffs: Diff[]): string

    diff_xIndex(diffs: Diff[], loc: number): number

    diff_cleanupMerge(diffs: Diff[])

    match_main(text: string, pattern: string, loc: number): number

    diff_fromDelta(text1: string, delta: string): Diff[]

    diff_toDelta(diffs: Diff[]): string

    diff_levenshtein(diffs: Diff[]): number

    diff_text1(diffs: Diff[]): string

    diff_text2(diffs: Diff[]): string

    patch_make(a: string, opt_b: string): Patch[]
    patch_make(a: Diff[]): Patch[]
    patch_make(a: string, opt_b: Diff[]): Patch[]
    patch_make(a: string, opt_b: string, opt_c: Diff[]): Patch[]

    patch_splitMax(patches: Patch[])

    patch_addPadding(patches: Patch[]): string

    patch_deepCopy(patches: Patch[]): Patch[]

    patch_toText(patches: Patch[]): string

    patch_fromText(textline: string): Patch[]

    patch_apply(patches: Patch[], text: string): {
      [0]: string
      [1]: boolean[]
    }
  }
}
export = diffMatchPatch
