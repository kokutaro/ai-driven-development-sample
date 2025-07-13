import { describe, expect, it } from 'vitest'

import { expectValidationError } from './test-helpers'

import { TodoStatus } from '@/domain/value-objects/todo-status'

describe('TodoStatus Value Object', () => {
  describe('作成', () => {
    it('should create TodoStatus with PENDING value', () => {
      // Act
      const status = TodoStatus.PENDING()

      // Assert
      expect(status.value).toBe('PENDING')
    })

    it('should create TodoStatus with IN_PROGRESS value', () => {
      // Act
      const status = TodoStatus.IN_PROGRESS()

      // Assert
      expect(status.value).toBe('IN_PROGRESS')
    })

    it('should create TodoStatus with COMPLETED value', () => {
      // Act
      const status = TodoStatus.COMPLETED()

      // Assert
      expect(status.value).toBe('COMPLETED')
    })

    it('should create TodoStatus with CANCELLED value', () => {
      // Act
      const status = TodoStatus.CANCELLED()

      // Assert
      expect(status.value).toBe('CANCELLED')
    })

    it('should create TodoStatus from valid string', () => {
      // Act
      const status = TodoStatus.fromString('IN_PROGRESS')

      // Assert
      expect(status.value).toBe('IN_PROGRESS')
    })
  })

  describe('バリデーション', () => {
    it('should throw error for invalid string status', () => {
      // Act & Assert
      expectValidationError(
        () => TodoStatus.fromString('INVALID'),
        '無効なステータスです: INVALID'
      )
    })

    it('should throw error for empty string', () => {
      // Act & Assert
      expectValidationError(
        () => TodoStatus.fromString(''),
        '無効なステータスです: '
      )
    })

    it('should throw error for null value', () => {
      // Act & Assert
      expectValidationError(
        () => TodoStatus.fromString(null as never),
        '無効なステータスです: null'
      )
    })

    it('should throw error for undefined value', () => {
      // Act & Assert
      expectValidationError(
        () => TodoStatus.fromString(undefined as never),
        '無効なステータスです: undefined'
      )
    })
  })

  describe('状態判定', () => {
    it('should identify pending status correctly', () => {
      // Arrange
      const pending = TodoStatus.PENDING()
      const inProgress = TodoStatus.IN_PROGRESS()
      const completed = TodoStatus.COMPLETED()
      const cancelled = TodoStatus.CANCELLED()

      // Act & Assert
      expect(pending.isPending()).toBe(true)
      expect(inProgress.isPending()).toBe(false)
      expect(completed.isPending()).toBe(false)
      expect(cancelled.isPending()).toBe(false)
    })

    it('should identify in progress status correctly', () => {
      // Arrange
      const pending = TodoStatus.PENDING()
      const inProgress = TodoStatus.IN_PROGRESS()
      const completed = TodoStatus.COMPLETED()
      const cancelled = TodoStatus.CANCELLED()

      // Act & Assert
      expect(pending.isInProgress()).toBe(false)
      expect(inProgress.isInProgress()).toBe(true)
      expect(completed.isInProgress()).toBe(false)
      expect(cancelled.isInProgress()).toBe(false)
    })

    it('should identify completed status correctly', () => {
      // Arrange
      const pending = TodoStatus.PENDING()
      const inProgress = TodoStatus.IN_PROGRESS()
      const completed = TodoStatus.COMPLETED()
      const cancelled = TodoStatus.CANCELLED()

      // Act & Assert
      expect(pending.isCompleted()).toBe(false)
      expect(inProgress.isCompleted()).toBe(false)
      expect(completed.isCompleted()).toBe(true)
      expect(cancelled.isCompleted()).toBe(false)
    })

    it('should identify cancelled status correctly', () => {
      // Arrange
      const pending = TodoStatus.PENDING()
      const inProgress = TodoStatus.IN_PROGRESS()
      const completed = TodoStatus.COMPLETED()
      const cancelled = TodoStatus.CANCELLED()

      // Act & Assert
      expect(pending.isCancelled()).toBe(false)
      expect(inProgress.isCancelled()).toBe(false)
      expect(completed.isCancelled()).toBe(false)
      expect(cancelled.isCancelled()).toBe(true)
    })

    it('should identify active status correctly', () => {
      // Arrange
      const pending = TodoStatus.PENDING()
      const inProgress = TodoStatus.IN_PROGRESS()
      const completed = TodoStatus.COMPLETED()
      const cancelled = TodoStatus.CANCELLED()

      // Act & Assert
      expect(pending.isActive()).toBe(true)
      expect(inProgress.isActive()).toBe(true)
      expect(completed.isActive()).toBe(false)
      expect(cancelled.isActive()).toBe(false)
    })

    it('should identify finished status correctly', () => {
      // Arrange
      const pending = TodoStatus.PENDING()
      const inProgress = TodoStatus.IN_PROGRESS()
      const completed = TodoStatus.COMPLETED()
      const cancelled = TodoStatus.CANCELLED()

      // Act & Assert
      expect(pending.isFinished()).toBe(false)
      expect(inProgress.isFinished()).toBe(false)
      expect(completed.isFinished()).toBe(true)
      expect(cancelled.isFinished()).toBe(true)
    })
  })

  describe('状態遷移', () => {
    it('should allow transition from PENDING to IN_PROGRESS', () => {
      // Arrange
      const from = TodoStatus.PENDING()
      const to = TodoStatus.IN_PROGRESS()

      // Act & Assert
      expect(from.canTransitionTo(to)).toBe(true)
    })

    it('should allow transition from PENDING to COMPLETED', () => {
      // Arrange
      const from = TodoStatus.PENDING()
      const to = TodoStatus.COMPLETED()

      // Act & Assert
      expect(from.canTransitionTo(to)).toBe(true)
    })

    it('should allow transition from PENDING to CANCELLED', () => {
      // Arrange
      const from = TodoStatus.PENDING()
      const to = TodoStatus.CANCELLED()

      // Act & Assert
      expect(from.canTransitionTo(to)).toBe(true)
    })

    it('should allow transition from IN_PROGRESS to COMPLETED', () => {
      // Arrange
      const from = TodoStatus.IN_PROGRESS()
      const to = TodoStatus.COMPLETED()

      // Act & Assert
      expect(from.canTransitionTo(to)).toBe(true)
    })

    it('should allow transition from IN_PROGRESS to CANCELLED', () => {
      // Arrange
      const from = TodoStatus.IN_PROGRESS()
      const to = TodoStatus.CANCELLED()

      // Act & Assert
      expect(from.canTransitionTo(to)).toBe(true)
    })

    it('should allow transition from IN_PROGRESS to PENDING', () => {
      // Arrange
      const from = TodoStatus.IN_PROGRESS()
      const to = TodoStatus.PENDING()

      // Act & Assert
      expect(from.canTransitionTo(to)).toBe(true)
    })

    it('should not allow transition from COMPLETED to other states', () => {
      // Arrange
      const completed = TodoStatus.COMPLETED()
      const pending = TodoStatus.PENDING()
      const inProgress = TodoStatus.IN_PROGRESS()
      const cancelled = TodoStatus.CANCELLED()

      // Act & Assert
      expect(completed.canTransitionTo(pending)).toBe(false)
      expect(completed.canTransitionTo(inProgress)).toBe(false)
      expect(completed.canTransitionTo(cancelled)).toBe(false)
    })

    it('should not allow transition from CANCELLED to other states', () => {
      // Arrange
      const cancelled = TodoStatus.CANCELLED()
      const pending = TodoStatus.PENDING()
      const inProgress = TodoStatus.IN_PROGRESS()
      const completed = TodoStatus.COMPLETED()

      // Act & Assert
      expect(cancelled.canTransitionTo(pending)).toBe(false)
      expect(cancelled.canTransitionTo(inProgress)).toBe(false)
      expect(cancelled.canTransitionTo(completed)).toBe(false)
    })

    it('should allow transition to same status', () => {
      // Arrange
      const status = TodoStatus.PENDING()

      // Act & Assert
      expect(status.canTransitionTo(status)).toBe(true)
    })
  })

  describe('等価性', () => {
    it('should be equal when values are same', () => {
      // Arrange
      const status1 = TodoStatus.COMPLETED()
      const status2 = TodoStatus.COMPLETED()

      // Act & Assert
      expect(status1.equals(status2)).toBe(true)
      expect(status2.equals(status1)).toBe(true)
    })

    it('should not be equal when values are different', () => {
      // Arrange
      const status1 = TodoStatus.COMPLETED()
      const status2 = TodoStatus.PENDING()

      // Act & Assert
      expect(status1.equals(status2)).toBe(false)
      expect(status2.equals(status1)).toBe(false)
    })

    it('should not be equal to null', () => {
      // Arrange
      const status = TodoStatus.COMPLETED()

      // Act & Assert
      expect(status.equals(null as never)).toBe(false)
    })
  })

  describe('表示', () => {
    it('should return display name correctly', () => {
      // Act & Assert
      expect(TodoStatus.PENDING().displayName).toBe('未着手')
      expect(TodoStatus.IN_PROGRESS().displayName).toBe('作業中')
      expect(TodoStatus.COMPLETED().displayName).toBe('完了')
      expect(TodoStatus.CANCELLED().displayName).toBe('キャンセル')
    })

    it('should return color code correctly', () => {
      // Act & Assert
      expect(TodoStatus.PENDING().colorCode).toBe('#6B7280')
      expect(TodoStatus.IN_PROGRESS().colorCode).toBe('#3B82F6')
      expect(TodoStatus.COMPLETED().colorCode).toBe('#10B981')
      expect(TodoStatus.CANCELLED().colorCode).toBe('#EF4444')
    })

    it('should return icon correctly', () => {
      // Act & Assert
      expect(TodoStatus.PENDING().icon).toBe('○')
      expect(TodoStatus.IN_PROGRESS().icon).toBe('◐')
      expect(TodoStatus.COMPLETED().icon).toBe('●')
      expect(TodoStatus.CANCELLED().icon).toBe('×')
    })
  })

  describe('文字列変換', () => {
    it('should return value as string', () => {
      // Arrange
      const status = TodoStatus.IN_PROGRESS()

      // Act & Assert
      expect(status.toString()).toBe('IN_PROGRESS')
    })
  })

  describe('フィルタリング', () => {
    it('should get active statuses', () => {
      // Act
      const activeStatuses = TodoStatus.getActiveStatuses()

      // Assert
      expect(activeStatuses).toHaveLength(2)
      expect(activeStatuses.map((s) => s.value)).toEqual([
        'PENDING',
        'IN_PROGRESS',
      ])
    })

    it('should get finished statuses', () => {
      // Act
      const finishedStatuses = TodoStatus.getFinishedStatuses()

      // Assert
      expect(finishedStatuses).toHaveLength(2)
      expect(finishedStatuses.map((s) => s.value)).toEqual([
        'COMPLETED',
        'CANCELLED',
      ])
    })

    it('should get all statuses', () => {
      // Act
      const allStatuses = TodoStatus.getAllStatuses()

      // Assert
      expect(allStatuses).toHaveLength(4)
      expect(allStatuses.map((s) => s.value)).toEqual([
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
      ])
    })
  })
})
