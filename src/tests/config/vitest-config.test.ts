import fs from 'fs'
import path from 'path'

import { describe, expect, it } from 'vitest'

/**
 * vitest.config.ts の CI向け設定を確認します
 */
describe('vitest.config CI settings', () => {
  it('maxWorkers 設定が含まれている', () => {
    const configPath = path.resolve(__dirname, '../../../vitest.config.ts')
    const configContent = fs.readFileSync(configPath, 'utf-8')
    expect(configContent).toMatch(
      /maxWorkers: process\.env\.CI \? 1 : undefined/
    )
  })
})
