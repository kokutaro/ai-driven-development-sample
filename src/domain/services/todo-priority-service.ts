import type { TodoEntity } from '@/domain/entities/todo-entity'

import { Priority } from '@/domain/value-objects/priority'

/**
 * 優先度調整提案のインターフェース
 */
export interface PriorityAdjustmentSuggestion {
  reason: string
  shouldAdjust: boolean
  suggestedPriority: Priority
}

/**
 * 優先度分布のインターフェース
 */
export interface PriorityDistribution {
  HIGH: number
  LOW: number
  NORMAL: number
  URGENT: number
}

/**
 * TodoPriorityService - TODO優先度管理のドメインサービス
 *
 * TODOの優先度に関連するビジネスロジックを提供します。
 * 優先度ベースのソート、フィルタリング、優先度調整の提案などを行います。
 */
export class TodoPriorityService {
  /**
   * 優先度の分布を計算します
   *
   * @param todos - 分析するTODO一覧
   * @returns 優先度ごとの件数
   */
  static calculatePriorityDistribution(
    todos: TodoEntity[]
  ): PriorityDistribution {
    const distribution: PriorityDistribution = {
      HIGH: 0,
      LOW: 0,
      NORMAL: 0,
      URGENT: 0,
    }

    for (const todo of todos) {
      switch (todo.priority.value) {
        case 'HIGH': {
          distribution.HIGH++
          break
        }
        case 'LOW': {
          distribution.LOW++
          break
        }
        case 'NORMAL': {
          distribution.NORMAL++
          break
        }
        case 'URGENT': {
          distribution.URGENT++
          break
        }
      }
    }

    return distribution
  }

  /**
   * 高優先度（HIGH、URGENT）のTODOのみを取得します
   *
   * @param todos - フィルタリングするTODO一覧
   * @returns 高優先度のTODO一覧
   */
  static getHighPriorityTodos(todos: TodoEntity[]): TodoEntity[] {
    return todos.filter(
      (todo) => todo.priority.isHigh() || todo.priority.isUrgent()
    )
  }

  /**
   * 緊急対応が必要なTODOを取得します
   *
   * @param todos - 分析するTODO一覧
   * @returns 緊急対応が必要なTODO一覧
   */
  static getUrgentActionRequired(todos: TodoEntity[]): TodoEntity[] {
    return todos.filter((todo) => {
      // 完了済みは除外
      if (todo.status.isCompleted()) {
        return false
      }

      // 緊急優先度のタスク
      if (todo.priority.isUrgent()) {
        return true
      }

      // 高優先度で期限切れまたは今日期限のタスク
      if (todo.priority.isHigh() && todo.dueDate) {
        return todo.isOverdue() || todo.isDueToday()
      }

      return false
    })
  }

  /**
   * TODO一覧を緊急度でソートします
   * 優先度と期限日を組み合わせて緊急度を計算します
   *
   * @param todos - ソートするTODO一覧
   * @returns 緊急度順でソートされたTODO一覧
   */
  static prioritizeByUrgency(todos: TodoEntity[]): TodoEntity[] {
    return [...todos].sort((a, b) => {
      const urgencyScoreA = this.calculateUrgencyScore(a)
      const urgencyScoreB = this.calculateUrgencyScore(b)

      return urgencyScoreB - urgencyScoreA
    })
  }

  /**
   * TODO一覧を優先度順でソートします
   *
   * @param todos - ソートするTODO一覧
   * @returns 優先度順（降順）でソートされたTODO一覧
   */
  static sortByPriority(todos: TodoEntity[]): TodoEntity[] {
    return [...todos].sort((a, b) => {
      return b.priority.compareTo(a.priority)
    })
  }

  /**
   * TODOの優先度調整を提案します
   *
   * @param todo - 分析するTODO
   * @returns 優先度調整の提案
   */
  static suggestPriorityAdjustment(
    todo: TodoEntity
  ): PriorityAdjustmentSuggestion {
    // 完了済みタスクは調整不要
    if (todo.status.isCompleted()) {
      return {
        reason: '完了済みタスクのため調整不要です',
        shouldAdjust: false,
        suggestedPriority: todo.priority,
      }
    }

    // 既に最高優先度の場合は調整不要
    if (todo.priority.isUrgent()) {
      return {
        reason: '既に最高優先度のため調整不要です',
        shouldAdjust: false,
        suggestedPriority: todo.priority,
      }
    }

    // 期限日がない場合は調整不要
    if (!todo.dueDate) {
      return {
        reason: '期限日なしのため調整不要です',
        shouldAdjust: false,
        suggestedPriority: todo.priority,
      }
    }

    // 期限切れの場合は高優先度に調整
    if (todo.isOverdue()) {
      return {
        reason: '期限切れのため高優先度への調整を推奨します',
        shouldAdjust: true,
        suggestedPriority: Priority.HIGH(),
      }
    }

    // 今日が期限の場合は高優先度に調整（現在が低優先度の場合）
    if (todo.isDueToday() && !todo.priority.isHigh()) {
      return {
        reason: '今日が期限のため高優先度への調整を推奨します',
        shouldAdjust: true,
        suggestedPriority: Priority.HIGH(),
      }
    }

    // 3日以内に期限の場合は通常優先度に調整（現在が低優先度の場合）
    if (todo.isDueWithinDays(3) && todo.priority.isLow()) {
      return {
        reason: '3日以内に期限のため通常優先度への調整を推奨します',
        shouldAdjust: true,
        suggestedPriority: Priority.NORMAL(),
      }
    }

    return {
      reason: '現在の優先度が適切です',
      shouldAdjust: false,
      suggestedPriority: todo.priority,
    }
  }

  /**
   * TODOの緊急度スコアを計算します
   *
   * @param todo - 分析するTODO
   * @returns 緊急度スコア（高いほど緊急）
   */
  private static calculateUrgencyScore(todo: TodoEntity): number {
    let score = 0

    // 優先度ベーススコア
    switch (todo.priority.value) {
      case 'HIGH': {
        score += 100
        break
      }
      case 'LOW': {
        score += 1
        break
      }
      case 'NORMAL': {
        score += 10
        break
      }
      case 'URGENT': {
        score += 1000
        break
      }
    }

    // 期限日による調整
    if (todo.dueDate) {
      if (todo.isOverdue()) {
        score += 500 // 期限切れは大幅加点
      } else if (todo.isDueToday()) {
        score += 100 // 今日期限は中程度加点
      } else if (todo.isDueWithinDays(3)) {
        score += 50 // 3日以内は軽微加点
      } else if (todo.isDueWithinDays(7)) {
        score += 10 // 1週間以内は微加点
      }
    }

    return score
  }
}
