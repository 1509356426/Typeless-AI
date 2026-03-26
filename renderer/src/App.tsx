import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [version, setVersion] = useState<string>('Loading...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadVersion = async () => {
      try {
        if (window.electronAPI) {
          const appVersion = await window.electronAPI.getVersion()
          setVersion(appVersion)
        } else {
          setVersion('Web Mode (development)')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setVersion('Error loading version')
      }
    }

    loadVersion()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>Typeless AI</h1>
        <p>AI-Powered Voice Dictation Tool</p>
        <div className="version-info">
          <p>Application Version: {version}</p>
          {error && <p className="error">Error: {error}</p>}
        </div>
        <div className="feature-list">
          <h2>Features</h2>
          <ul>
            <li>Voice dictation powered by AI</li>
            <li>Real-time transcription</li>
            <li>Multi-language support</li>
            <li>Offline processing capability</li>
          </ul>
        </div>
      </header>
    </div>
  )
}

export default App
