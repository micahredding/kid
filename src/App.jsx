import { useState, useEffect, useRef } from 'react'
import './App.css'

const GAME_WIDTH = 600
const GAME_HEIGHT = 500
const SHORT_WORDS = ['CAT', 'DOG', 'HAT']
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

let nextId = 0

const MODES = { LETTERS: 'letters', WORDS: 'words', NUMBERS: 'numbers' }
const NUMBERS = '0123456789'

const MODE_CONFIG = {
  [MODES.LETTERS]: { fallSpeed: 0.6, spawnInterval: 2500, hint: 'Type the letters to explode them!' },
  [MODES.WORDS]: { fallSpeed: 0.3, spawnInterval: 3500, hint: 'Type the whole word to explode it!' },
  [MODES.NUMBERS]: { fallSpeed: 0.6, spawnInterval: 2500, hint: 'Type the numbers to explode them!' },
}

function randomWord() {
  return SHORT_WORDS[Math.floor(Math.random() * SHORT_WORDS.length)]
}

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

function randomNumber() {
  return NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
}

function invaderWidth(text) {
  return Math.max(70, text.length * 46 + 24)
}

function createInvader(mode) {
  const text = mode === MODES.WORDS ? randomWord() : mode === MODES.NUMBERS ? randomNumber() : randomLetter()
  const width = invaderWidth(text)
  const height = 64
  const x = Math.random() * (GAME_WIDTH - width)
  return { id: nextId++, text, typed: 0, x, y: -height, width, height }
}

function App() {
  const [mode, setMode] = useState(MODES.LETTERS)
  const [invaders, setInvaders] = useState([])
  const [score, setScore] = useState(0)
  const [explosions, setExplosions] = useState([])
  const [poofs, setPoofs] = useState([])

  // Refs so the game loop never has stale closures
  const modeRef = useRef(mode)
  const invadersRef = useRef([])
  const explosionsRef = useRef([])
  const poofsRef = useRef([])
  const lastSpawnRef = useRef(Date.now())
  const scoreRef = useRef(0)

  // Keep modeRef in sync and reset on mode change
  useEffect(() => {
    modeRef.current = mode
    invadersRef.current = []
    explosionsRef.current = []
    poofsRef.current = []
    scoreRef.current = 0
    lastSpawnRef.current = Date.now()
    setInvaders([])
    setExplosions([])
    setPoofs([])
    setScore(0)
  }, [mode])

  // Single game loop — runs once, reads everything through refs
  useEffect(() => {
    let rafId

    const loop = () => {
      const now = Date.now()
      const currentMode = modeRef.current
      const { spawnInterval, fallSpeed } = MODE_CONFIG[currentMode]

      // Spawn new invader
      if (now - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = now
        invadersRef.current = [...invadersRef.current, createInvader(currentMode)]
      }

      // Move invaders down
      const still = []
      const gone = []
      for (const inv of invadersRef.current) {
        const newY = inv.y + fallSpeed
        if (newY > GAME_HEIGHT) gone.push(inv)
        else still.push({ ...inv, y: newY })
      }
      invadersRef.current = still

      // Poofs for off-screen invaders
      if (gone.length > 0) {
        poofsRef.current = [
          ...poofsRef.current,
          ...gone.map(g => ({ id: g.id, x: g.x, width: g.width, height: g.height, time: now })),
        ]
      }

      // Clean up old effects
      explosionsRef.current = explosionsRef.current.filter(e => now - e.time < 500)
      poofsRef.current = poofsRef.current.filter(p => now - p.time < 700)

      // Push to React state for rendering
      setInvaders([...invadersRef.current])
      setExplosions([...explosionsRef.current])
      setPoofs([...poofsRef.current])

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Key handler — reads and writes invadersRef directly
  useEffect(() => {
    function handleKey(e) {
      const key = e.key.toUpperCase()
      if (!LETTERS.includes(key) && !NUMBERS.includes(key)) return

      const prev = invadersRef.current
      // Find the lowest (most dangerous) invader whose next expected letter matches
      const idx = prev.reduce((best, inv, i) => {
        const expected = inv.text[inv.typed]
        if (expected === key && (best === -1 || inv.y > prev[best].y)) return i
        return best
      }, -1)

      if (idx === -1) return

      const hit = prev[idx]
      const typed = hit.typed + 1

      if (typed >= hit.text.length) {
        // Word/letter complete — explode!
        scoreRef.current += 1
        setScore(scoreRef.current)
        explosionsRef.current = [
          ...explosionsRef.current,
          { id: hit.id, x: hit.x, y: hit.y, width: hit.width, height: hit.height, time: Date.now() },
        ]
        invadersRef.current = prev.filter((_, i) => i !== idx)
      } else {
        // Partial match — light up typed letters
        invadersRef.current = prev.map((inv, i) => (i === idx ? { ...inv, typed } : inv))
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="game-container">
      <div className="mode-toggle">
        <button
          type="button"
          className={`mode-button ${mode === MODES.LETTERS ? 'active' : ''}`}
          onClick={() => setMode(MODES.LETTERS)}
        >
          Letters
        </button>
        <button
          type="button"
          className={`mode-button ${mode === MODES.WORDS ? 'active' : ''}`}
          onClick={() => setMode(MODES.WORDS)}
        >
          Words
        </button>
        <button
          type="button"
          className={`mode-button ${mode === MODES.NUMBERS ? 'active' : ''}`}
          onClick={() => setMode(MODES.NUMBERS)}
        >
          Numbers
        </button>
      </div>

      <div className="score">⭐ {score}</div>

      <div className="game-area" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        {invaders.map(inv => (
          <div
            key={inv.id}
            className={`invader ${mode === MODES.WORDS ? 'invader-word' : mode === MODES.NUMBERS ? 'invader-number' : 'invader-letter'} color-${inv.id % 5}`}
            style={{ left: inv.x, top: inv.y, width: inv.width, height: inv.height }}
          >
            {mode === MODES.LETTERS || mode === MODES.NUMBERS ? (
              <span className="letter-char">{inv.text}</span>
            ) : (
              <div className="word-tiles">
                {inv.text.split('').map((char, i) => (
                  <span key={i} className={`word-tile ${i < inv.typed ? 'typed' : ''}`}>
                    {char}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {explosions.map(e => (
          <div
            key={'ex-' + e.id}
            className="explosion"
            style={{ left: e.x, top: e.y, width: e.width, height: e.height }}
          >
            💥
          </div>
        ))}

        {poofs.map(p => (
          <div
            key={'pf-' + p.id}
            className="poof"
            style={{ left: p.x, top: GAME_HEIGHT - p.height, width: p.width, height: p.height }}
          >
            💨
          </div>
        ))}
      </div>

      <div className="hint">{MODE_CONFIG[mode].hint}</div>
    </div>
  )
}

export default App
