import { Button, Group } from '@mantine/core'

/**
 * 今日の日付（23:59:59）を取得
 */
const getToday = (): Date => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return today
}

/**
 * 明日の日付（23:59:59）を取得
 */
const getTomorrow = (): Date => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 59, 999)
  return tomorrow
}

/**
 * 今週の日曜日の日付（23:59:59）を取得
 * 日本では日曜日が週の始まりとして扱われる
 */
const getThisWeekSunday = (): Date => {
  const today = new Date()
  const daysUntilSunday = 7 - today.getDay()
  const thisSunday = new Date()
  thisSunday.setDate(today.getDate() + daysUntilSunday)
  thisSunday.setHours(23, 59, 59, 999)
  return thisSunday
}

interface DateQuickPickerProps {
  /**
   * 日付が選択された時のコールバック関数
   */
  onChange: (date: Date | null) => void
}

/**
 * 日付クイック選択コンポーネント
 *
 * よく使用される期限（今日、明日、今週）を素早く選択できるボタンを提供します。
 * 選択された日付は23:59:59に設定されます。
 */
export function DateQuickPicker({ onChange }: DateQuickPickerProps) {

  /**
   * 今日ボタンクリック時の処理
   */
  const handleTodayClick = () => {
    onChange(getToday())
  }

  /**
   * 明日ボタンクリック時の処理
   */
  const handleTomorrowClick = () => {
    onChange(getTomorrow())
  }

  /**
   * 今週ボタンクリック時の処理
   */
  const handleThisWeekClick = () => {
    onChange(getThisWeekSunday())
  }

  return (
    <Group gap="xs" mb="xs">
      <Button onClick={handleTodayClick} size="xs" variant="light">
        今日
      </Button>
      <Button onClick={handleTomorrowClick} size="xs" variant="light">
        明日
      </Button>
      <Button onClick={handleThisWeekClick} size="xs" variant="light">
        今週
      </Button>
    </Group>
  )
}
