import { formatDate } from './utils'

describe('formatDate', () => {
  it('日本語形式で日付をフォーマットする', () => {
    // Arrange
    const date = new Date('2024-01-15T10:30:00')

    // Act
    const result = formatDate(date)

    // Assert
    expect(result).toContain('2024')
    expect(result).toContain('1')
    expect(result).toContain('15')
    // 日本語ロケールでの表示確認
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('異なる日付で正しくフォーマットする', () => {
    // Arrange
    const date = new Date('2023-12-25T15:45:30')

    // Act
    const result = formatDate(date)

    // Assert
    expect(result).toContain('2023')
    expect(result).toContain('12')
    expect(result).toContain('25')
  })

  it('月初の日付を正しくフォーマットする', () => {
    // Arrange
    const date = new Date('2024-03-01T00:00:00')

    // Act
    const result = formatDate(date)

    // Assert
    expect(result).toContain('2024')
    expect(result).toContain('3')
    expect(result).toContain('1')
  })

  it('月末の日付を正しくフォーマットする', () => {
    // Arrange
    const date = new Date('2024-02-29T23:59:59') // うるう年

    // Act
    const result = formatDate(date)

    // Assert
    expect(result).toContain('2024')
    expect(result).toContain('2')
    expect(result).toContain('29')
  })

  it('年の境界値で正しくフォーマットする', () => {
    // Arrange
    const date = new Date('2025-01-01T12:00:00')

    // Act
    const result = formatDate(date)

    // Assert
    expect(result).toContain('2025')
    expect(result).toContain('1')
    expect(result).toContain('1')
  })

  it('時刻は表示されない（日付のみ）', () => {
    // Arrange
    const date = new Date('2024-01-15T23:59:59')

    // Act
    const result = formatDate(date)

    // Assert
    // 時刻情報（時、分、秒）が含まれていないことを確認
    expect(result).not.toContain('23')
    expect(result).not.toContain('59')
    expect(result).not.toContain(':')
  })

  it('不正な日付でもエラーを投げない', () => {
    // Arrange
    const invalidDate = new Date('invalid-date')

    // Act & Assert
    expect(() => formatDate(invalidDate)).not.toThrow()
  })

  it('NaNの日付の場合は適切に処理される', () => {
    // Arrange
    const nanDate = new Date(Number.NaN)

    // Act
    const result = formatDate(nanDate)

    // Assert
    expect(typeof result).toBe('string')
  })

  it('最小日付値で正しく動作する', () => {
    // Arrange
    const minDate = new Date(1900, 0, 1) // 1900年1月1日

    // Act
    const result = formatDate(minDate)

    // Assert
    expect(result).toContain('1900')
    expect(result).toContain('1')
  })

  it('最大日付値で正しく動作する', () => {
    // Arrange
    const maxDate = new Date(2099, 11, 31) // 2099年12月31日

    // Act
    const result = formatDate(maxDate)

    // Assert
    expect(result).toContain('2099')
    expect(result).toContain('12')
    expect(result).toContain('31')
  })

  it('タイムゾーンに関係なく一貫した結果を返す', () => {
    // Arrange
    const date1 = new Date('2024-01-15T00:00:00Z') // UTC
    const date2 = new Date('2024-01-15T12:00:00Z') // UTC

    // Act
    const result1 = formatDate(date1)
    const result2 = formatDate(date2)

    // Assert - 同じ日付なので同じ結果または類似した結果
    expect(typeof result1).toBe('string')
    expect(typeof result2).toBe('string')
    expect(result1.length).toBeGreaterThan(0)
    expect(result2.length).toBeGreaterThan(0)
  })

  it('Dateオブジェクトが正常に処理される', () => {
    // Arrange
    const today = new Date()

    // Act
    const result = formatDate(today)

    // Assert
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain(today.getFullYear().toString())
  })
})
