/* eslint-disable unicorn/no-null */
import { Stack } from '@mantine/core'
import { DatePickerInput, type DatePickerInputProps } from '@mantine/dates'

import { DateQuickPicker } from './date-quick-picker'

interface DatePickerWithQuickSelectProps
  extends Omit<DatePickerInputProps, 'onChange' | 'value'> {
  /**
   * 日付が変更された時のコールバック関数
   */
  onChange: (date: Date | undefined) => void
  /**
   * 現在選択されている日付
   */
  value?: Date | undefined
}

/**
 * クイック選択機能付きの日付選択コンポーネント
 *
 * 通常のDatePickerInputにクイック選択ボタンを追加したコンポーネントです。
 * 「今日」「明日」「今週」のボタンで素早く期限日を設定できます。
 */
export function DatePickerWithQuickSelect({
  onChange,
  value,
  ...datePickerProps
}: DatePickerWithQuickSelectProps) {
  /**
   * DatePickerInputのonChangeハンドラー
   * DatePickerInputは文字列またはnullを渡すため、Dateオブジェクトまたはnullに変換する
   */
  const handleDatePickerChange = (dateString: null | string) => {
    if (dateString === null) {
      onChange(undefined)
    } else {
      const date = new Date(dateString)
      // 無効な日付でないかチェック
      if (Number.isNaN(date.getTime())) {
        onChange(undefined)
      } else {
        onChange(date)
      }
    }
  }

  return (
    <Stack gap="xs">
      <DateQuickPicker onChange={onChange} />
      <DatePickerInput
        {...datePickerProps}
        onChange={handleDatePickerChange}
        value={value ? value.toISOString().split('T')[0] : null}
      />
    </Stack>
  )
}
