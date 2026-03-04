import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const GAME_WIDTH = 600
const GAME_HEIGHT = 500
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const SHORT_WORDS = ['CAT', 'DOG', 'HAT']

const MODES = {
  LETTERS: 'letters',
  WORDS: 'words',
}

const MODE_CONFIG = {
  [MODES.LETTERS]: {
    fallSpeed: 0.6,
    spawnInterval: 2500,
    hint: 'Type the letters to explode them!',
  },
  [MODES.WORDS]: {
    fallSpeed: 0.3,
    spawnInterval: 2800,
    hint: 'Type the whole word before it hits the bottom!',
  },
}

let nextId = 0

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

function randomWord() {
  return SHORT_WORDS[Math.floor(Math.random() * SHORT_WORDS.length)]
}

function invaderWidth(text) {
  return Math.max(80, text.length * 42 + 18)
}

function createInvader(mode) {
  const text = mode === MODES.WORDS ? randomWord() : randomLetter()
  const width = invaderWidth(text)
  const height = 60
  const x = Math.random() * (GAME_WIDTH - width)
  return { id: nextId++, text, typed: 0, x, y: -height, width, height }
}

function App() {
  const [mode, setMode] = useState(MODES.LETTERS)
  const [invaders, setInvaders] = useState([])
  const [score, setScore] = useState(0)
  const [explosions, setExplosions] = useState([])
  const [poofs, setPoofs] = useState([])
  const animRef = useRef()
  const lastSpawn = useRef(Date.now())

  const gameLoop = useCallback(() => {
    const now = Date.now()
    const { spawnInterval, fallSpeed } = MODE_CONFIG[mode]

    if (now - lastSpawn.current > spawnInterval) {
      lastSpawn.current = now
      setInvaders(prev => [...prev, createInvader(mode)])
    }

    setInvaders(prev => {
      const still = []
      const gone = []
      for (const invader of prev) {
        const newY = invader.y + fallSpeed
        if (newY > GAME_HEIGHT) {
          gone.push(invader)
        } else {
          still.push({ ...invader, y: newY })
        }
      }
      if (gone.length > 0) {
        setPoofs(p =>
          [...p, ...gone.map(g => ({ id: g.id, x: g.x, y: GAME_HEIGHT - g.height, width: g.width, height: g.height, time: Date.now() }))]
        )
      }
      return still
    })

    setExplosions(prev => prev.filter(e => Date.now() - e.time < 500))
    setPoofs(prev => prev.filter(p => Date.now() - p.time < 600))

    animRef.current = requestAnimationFrame(gameLoop)
  }, [mode])

  useEffect(() => {
    animRef.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animRef.current)
  }, [gameLoop])

  useEffect(() => {
    lastSpawn.current = Date.now()
    setInvaders([])
    setExplosions([])
    setPoofs([])
    setScore(0)
  }, [mode])

  useEffect(() => {
    function handleKey(e) {
      const key = e.key.toUpperCase()
      if (!LETTERS.includes(key)) return

      setInvaders(prev => {
        const idx = prev.reduce((best, l, i) => {
          const expected = l.text[l.typed]
          if (expected === key && (best === -1 || l.y > prev[best].y)) return i
          return best
        }, -1)

        if (idx === -1) return prev

        const hit = prev[idx]
        const typed = hit.typed + 1

        if (typed >= hit.text.length) {
          setScore(s => s + 1)
          setExplosions(ex => [...ex, { id: hit.id, x: hit.x, y: hit.y, width: hit.width, height: hit.height, time: Date.now() }])
          return prev.filter((_, i) => i !== idx)
        }

        return prev.map((invader, i) => (i === idx ? { ...invader, typed } : invader))
      })
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
          Letter Mode
        </button>
        <button
          type="button"
          className={`mode-button ${mode === MODES.WORDS ? 'active' : ''}`}
          onClick={() => setMode(MODES.WORDS)}
        >
          Word Mode
        </button>
      </div>
      <div className="score">Score: {score}</div>
      <div className="game-area" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        {invaders.map(l => (
          <div
            key={l.id}
            className={`letter ${mode === MODES.WORDS ? 'word' : ''}`}
            style={{ left: l.x, top: l.y, width: l.width, height: l.height, fontSize: mode === MODES.WORDS ? 30 : 42 }}
          >
            {mode === MODES.WORDS ? (
              <div className="word-tiles">
                {l.text.split('').map((char, i) => (
                  <span key={i} className={`word-tile ${i < l.typed ? 'typed' : ''}`}>
                    {char}
                  </span>
                ))}
              </div>
            ) : (
              l.text
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
