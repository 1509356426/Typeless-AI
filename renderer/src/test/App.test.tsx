import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('Typeless AI')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<App />)
    expect(
      screen.getByText('AI-Powered Voice Dictation Tool')
    ).toBeInTheDocument()
  })

  it('renders feature list', () => {
    render(<App />)
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText(/Voice dictation powered by AI/)).toBeInTheDocument()
  })
})
