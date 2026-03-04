import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const GAME_WIDTH = 600
const GAME_HEIGHT = 500
const LETTER_SIZE = 60
const FALL_SPEED = 0.6
const SPAWN_INTERVAL = 2500
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

let nextId = 0

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

function App() {
  const [letters, setLetters] = useState([])
  const [score, setScore] = useState(0)
  const [explosions, setExplosions] = useState([])
  const [poofs, setPoofs] = useState([])
  const animRef = useRef()
  const lastSpawn = useRef(Date.now())

  const gameLoop = useCallback(() => {
    const now = Date.now()

    if (now - lastSpawn.current > SPAWN_INTERVAL) {
      lastSpawn.current = now
      const x = Math.random() * (GAME_WIDTH - LETTER_SIZE)
      setLetters(prev => [...prev, { id: nextId++, letter: randomLetter(), x, y: -LETTER_SIZE }])
    }

    setLetters(prev => {
      const still = []
      const gone = []
      for (const l of prev) {
        const newY = l.y + FALL_SPEED
        if (newY > GAME_HEIGHT) {
          gone.push(l)
        } else {
          still.push({ ...l, y: newY })
        }
      }
      if (gone.length > 0) {
        setPoofs(p => [...p, ...gone.map(g => ({ id: g.id, x: g.x, y: GAME_HEIGHT - LETTER_SIZE, time: Date.now() }))])
      }
      return still
    })

    setExplosions(prev => prev.filter(e => Date.now() - e.time < 500))
    setPoofs(prev => prev.filter(p => Date.now() - p.time < 600))

    animRef.current = requestAnimationFrame(gameLoop)
  }, [])

  useEffect(() => {
    animRef.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animRef.current)
  }, [gameLoop])

  useEffect(() => {
    function handleKey(e) {
      const key = e.key.toUpperCase()
      if (!LETTERS.includes(key)) return

      setLetters(prev => {
        const idx = prev.reduce((best, l, i) => {
          if (l.letter === key && (best === -1 || l.y > prev[best].y)) return i
          return best
        }, -1)

        if (idx === -1) return prev

        const hit = prev[idx]
        setScore(s => s + 1)
        setExplosions(ex => [...ex, { id: hit.id, x: hit.x, y: hit.y, letter: hit.letter, time: Date.now() }])
        return prev.filter((_, i) => i !== idx)
      })
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="game-container">
      <div className="score">Score: {score}</div>
      <div className="game-area" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        {letters.map(l => (
          <div
            key={l.id}
            className="letter"
            style={{ left: l.x, top: l.y, width: LETTER_SIZE, height: LETTER_SIZE, fontSize: LETTER_SIZE * 0.7 }}
          >
            {l.letter}
          </div>
        ))}
        {explosions.map(e => (
          <div
            key={'ex-' + e.id}
            className="explosion"
            style={{ left: e.x, top: e.y, width: LETTER_SIZE, height: LETTER_SIZE }}
          >
            💥
          </div>
        ))}
        {poofs.map(p => (
          <div
            key={'pf-' + p.id}
            className="poof"
            style={{ left: p.x, top: GAME_HEIGHT - LETTER_SIZE, width: LETTER_SIZE, height: LETTER_SIZE }}
          >
            💨
          </div>
        ))}
      </div>
      <div className="hint">Type the letters to explode them!</div>
    </div>
  )
}

export default App
