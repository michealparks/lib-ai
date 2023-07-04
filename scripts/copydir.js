import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Copy a directory
 * @param {string} src 
 * @param {string} dest 
 */
export const copyDir = async (src, dest) => {
  await fs.mkdir(dest, { recursive: true })

  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    entry.isDirectory()
      ? await copyDir(srcPath, destPath)
      : await fs.copyFile(srcPath, destPath)
  }
}
