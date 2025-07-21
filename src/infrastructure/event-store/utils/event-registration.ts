import type { EventSerializer } from '../interfaces/event-serializer.interface'

import {
  type DomainEvent,
  SubTaskAddedEvent,
  SubTaskRemovedEvent,
  TodoCancelledEvent,
  TodoCompletedEvent,
  TodoCreatedEvent,
  TodoDescriptionUpdatedEvent,
  TodoDueDateUpdatedEvent,
  TodoPriorityChangedEvent,
  TodoReopenedEvent,
  TodoStartedEvent,
  TodoTitleUpdatedEvent,
} from '@/domain/events/domain-events'

/**
 * 標準ドメインイベントの定義
 */
export const STANDARD_EVENTS = [
  // TODO関連イベント
  { constructor: TodoCreatedEvent, eventType: 'TodoCreated' },
  { constructor: TodoCompletedEvent, eventType: 'TodoCompleted' },
  { constructor: TodoStartedEvent, eventType: 'TodoStarted' },
  { constructor: TodoCancelledEvent, eventType: 'TodoCancelled' },
  { constructor: TodoReopenedEvent, eventType: 'TodoReopened' },

  // TODO属性更新イベント
  { constructor: TodoTitleUpdatedEvent, eventType: 'TodoTitleUpdated' },
  {
    constructor: TodoDescriptionUpdatedEvent,
    eventType: 'TodoDescriptionUpdated',
  },
  { constructor: TodoDueDateUpdatedEvent, eventType: 'TodoDueDateUpdated' },
  { constructor: TodoPriorityChangedEvent, eventType: 'TodoPriorityChanged' },

  // SubTask関連イベント
  { constructor: SubTaskAddedEvent, eventType: 'SubTaskAdded' },
  { constructor: SubTaskRemovedEvent, eventType: 'SubTaskRemoved' },
] as const

/**
 * イベントタイプマッピング（型安全性のため）
 */
export type StandardEventType = (typeof STANDARD_EVENTS)[number]['eventType']

/**
 * イベントタイプのドキュメント生成
 *
 * @param serializer - EventSerializerインスタンス
 * @returns マークダウン形式のドキュメント
 */
export function generateEventTypeDocumentation(
  serializer: EventSerializer
): string {
  const stats = getEventTypeStatistics(serializer)
  const validation = validateEventRegistration(serializer)

  let doc = '# Event Type Documentation\n\n'

  doc += '## Overview\n\n'
  doc += `- Total Event Types: ${stats.totalTypes}\n`
  doc += `- Standard Event Types: ${stats.standardTypes}/${STANDARD_EVENTS.length}\n`
  doc += `- Custom Event Types: ${stats.customTypes}\n`
  doc += `- Registration Status: ${validation.valid ? '✅ Valid' : '❌ Invalid'}\n\n`

  doc += '## Standard Events\n\n'
  for (const event of STANDARD_EVENTS) {
    const isRegistered = validation.registeredTypes.includes(event.eventType)
    doc += `- ${event.eventType} ${isRegistered ? '✅' : '❌'}\n`
  }

  if (validation.unknownTypes.length > 0) {
    doc += '\n## Custom Events\n\n'
    for (const type of validation.unknownTypes) {
      doc += `- ${type} 🔧\n`
    }
  }

  if (validation.missingStandardTypes.length > 0) {
    doc += '\n## Missing Standard Events\n\n'
    for (const type of validation.missingStandardTypes) {
      doc += `- ${type} ❌\n`
    }
  }

  return doc
}

/**
 * イベントタイプ統計を取得します
 *
 * @param serializer - EventSerializerインスタンス
 * @returns イベントタイプ統計
 */
export function getEventTypeStatistics(serializer: EventSerializer): {
  customTypes: number
  standardTypes: number
  totalTypes: number
  typesByCategory: Record<string, string[]>
} {
  const registry = serializer.getRegistry()
  const registeredTypes = registry.getAllEventTypes()
  const standardTypes = STANDARD_EVENTS.map((e) => e.eventType)

  const standardRegistered = registeredTypes.filter((type) =>
    (standardTypes as string[]).includes(type)
  )

  const customRegistered = registeredTypes.filter(
    (type) => !(standardTypes as string[]).includes(type)
  )

  // カテゴリ別分類
  const typesByCategory: Record<string, string[]> = {
    category: registeredTypes.filter((type) => type.startsWith('Category')),
    custom: customRegistered,
    subTask: registeredTypes.filter((type) => type.startsWith('SubTask')),
    todo: registeredTypes.filter((type) => type.startsWith('Todo')),
    user: registeredTypes.filter((type) => type.startsWith('User')),
  }

  return {
    customTypes: customRegistered.length,
    standardTypes: standardRegistered.length,
    totalTypes: registeredTypes.length,
    typesByCategory,
  }
}

/**
 * デバッグ用：登録されているイベントタイプを出力します
 *
 * @param serializer - EventSerializerインスタンス
 */
export function logEventTypeStatus(serializer: EventSerializer): void {
  const stats = getEventTypeStatistics(serializer)
  const validation = validateEventRegistration(serializer)

  console.log('📊 Event Type Registration Status:')
  console.log(`  Total Types: ${stats.totalTypes}`)
  console.log(
    `  Standard Types: ${stats.standardTypes}/${STANDARD_EVENTS.length}`
  )
  console.log(`  Custom Types: ${stats.customTypes}`)

  if (validation.missingStandardTypes.length > 0) {
    console.log(
      `  ⚠️  Missing Standard Types: ${validation.missingStandardTypes.join(', ')}`
    )
  }

  if (validation.unknownTypes.length > 0) {
    console.log(`  🔧 Custom Types: ${validation.unknownTypes.join(', ')}`)
  }

  console.log(`  ✅ Registration Valid: ${validation.valid}`)

  console.log('📂 Types by Category:')
  for (const [category, types] of Object.entries(stats.typesByCategory)) {
    if (types.length > 0) {
      console.log(`    ${category}: ${types.join(', ')}`)
    }
  }
}

/**
 * カスタムドメインイベントを登録します
 *
 * @param serializer - EventSerializerインスタンス
 * @param customEvents - カスタムイベントの定義
 * @returns 登録されたイベント数
 */
export function setupCustomEvents(
  serializer: EventSerializer,
  customEvents: Array<{
    constructor: new (...args: unknown[]) => DomainEvent
    eventType: string
  }>
): number {
  const registry = serializer.getRegistry()
  let registeredCount = 0

  for (const event of customEvents) {
    registry.register(event.eventType, event.constructor)
    registeredCount++
  }

  return registeredCount
}

/**
 * 特定のイベントタイプのみを登録します
 *
 * @param serializer - EventSerializerインスタンス
 * @param eventTypes - 登録するイベントタイプの配列
 * @returns 登録されたイベント数
 */
export function setupSelectedEvents(
  serializer: EventSerializer,
  eventTypes: StandardEventType[]
): number {
  const registry = serializer.getRegistry()
  let registeredCount = 0

  for (const eventType of eventTypes) {
    const eventDefinition = STANDARD_EVENTS.find(
      (e) => e.eventType === eventType
    )
    if (eventDefinition) {
      registry.register(
        eventDefinition.eventType,
        eventDefinition.constructor as new (...args: unknown[]) => DomainEvent
      )
      registeredCount++
    }
  }

  return registeredCount
}

/**
 * EventSerializerに標準ドメインイベントを登録します
 *
 * @param serializer - EventSerializerインスタンス
 * @returns 登録されたイベント数
 */
export function setupStandardEvents(serializer: EventSerializer): number {
  const registry = serializer.getRegistry()
  let registeredCount = 0

  for (const event of STANDARD_EVENTS) {
    registry.register(
      event.eventType,
      event.constructor as new (...args: unknown[]) => DomainEvent
    )
    registeredCount++
  }

  return registeredCount
}

/**
 * 登録済みのイベントタイプを検証します
 *
 * @param serializer - EventSerializerインスタンス
 * @returns 検証結果
 */
export function validateEventRegistration(serializer: EventSerializer): {
  missingStandardTypes: string[]
  registeredTypes: string[]
  unknownTypes: string[]
  valid: boolean
} {
  const registry = serializer.getRegistry()
  const registeredTypes = registry.getAllEventTypes()
  const standardTypes = STANDARD_EVENTS.map((e) => e.eventType)

  const missingStandardTypes = standardTypes.filter(
    (type) => !registeredTypes.includes(type)
  )

  const unknownTypes = registeredTypes.filter(
    (type) => !(standardTypes as string[]).includes(type)
  )

  return {
    missingStandardTypes,
    registeredTypes,
    unknownTypes,
    valid: missingStandardTypes.length === 0,
  }
}
