import { MainLayout } from './main-layout'

import { render, screen } from '@/tests/test-utils'

describe('MainLayout', () => {
  it('renders main layout with children', () => {
    // Arrange
    const testContent = 'テストコンテンツ'

    // Act
    render(<MainLayout>{testContent}</MainLayout>)

    // Assert
    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('renders header component', () => {
    // Arrange & Act
    render(<MainLayout>テストコンテンツ</MainLayout>)

    // Assert
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders navigation sidebar', () => {
    // Arrange & Act
    render(<MainLayout>テストコンテンツ</MainLayout>)

    // Assert
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders main content area', () => {
    // Arrange & Act
    render(<MainLayout>テストコンテンツ</MainLayout>)

    // Assert
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
