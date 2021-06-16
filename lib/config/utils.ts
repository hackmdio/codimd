import * as fs from "fs";
import * as path from "path";

export function toBooleanConfig(configValue: string | boolean): boolean {
  if (configValue && typeof configValue === 'string') {
    return (configValue === 'true')
  }
  return configValue as boolean
}

export function toArrayConfig(configValue: string | [], separator = ',', fallback ?: string[]): string[] {
  if (configValue && typeof configValue === 'string') {
    return (configValue.split(separator).map(arrayItem => arrayItem.trim()))
  }
  return fallback
}

export function toIntegerConfig(configValue: string | number): number {
  if (configValue && typeof configValue === 'string') {
    return parseInt(configValue)
  }
  return configValue as number
}

export function getGitCommit(repodir: string): string {
  if (!fs.existsSync(repodir + '/.git/HEAD')) {
    return undefined
  }
  let reference = fs.readFileSync(repodir + '/.git/HEAD', 'utf8')
  if (reference.startsWith('ref: ')) {
    reference = reference.substr(5).replace('\n', '')
    reference = fs.readFileSync(path.resolve(repodir + '/.git', reference), 'utf8')
  }
  reference = reference.replace('\n', '')
  return reference
}

export function getGitHubURL(repo: string, reference: string): string {
  // if it's not a github reference, we handle handle that anyway
  if (!repo.startsWith('https://github.com') && !repo.startsWith('git@github.com')) {
    return repo
  }
  if (repo.startsWith('git@github.com') || repo.startsWith('ssh://git@github.com')) {
    repo = repo.replace(/^(ssh:\/\/)?git@github.com:/, 'https://github.com/')
  }

  if (repo.endsWith('.git')) {
    repo = repo.replace(/\.git$/, '/')
  } else if (!repo.endsWith('/')) {
    repo = repo + '/'
  }
  return repo + 'tree/' + reference
}
