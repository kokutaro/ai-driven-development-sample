/**
 * UUID v4を生成する関数
 * crypto.randomUUID()が利用可能な場合はそれを使用し、
 * 利用できない場合は代替実装を使用する
 * @returns 生成されたUUID v4文字列
 */
export function generateUUID(): string {
  // crypto.randomUUID()が利用可能な場合は使用
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // 代替実装: UUID v4の生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
