const noop = () => {};
const ctxProxy = new Proxy({}, { get: (t, p) => (p === 'canvas' ? canvasStub : noop), set: () => true });
const canvasStub = { getContext: () => ctxProxy, width: 960, height: 540, style: {} };
globalThis.window = { addEventListener: noop, removeEventListener: noop };
globalThis.document = { addEventListener: noop, removeEventListener: noop };
globalThis.performance = { now: () => 0 };
globalThis.requestAnimationFrame = noop;
const { Engine } = await import('./js/engine.js');
const { CONFIG } = await import('./js/config.js');
const engine = new Engine(canvasStub);
const ts = CONFIG.tile.size;

for (const lvl of [0, 1]) {
  engine.player = null;
  engine.startLevel(lvl);
  engine.gameState = 'playing';
  engine.selectedCharacter = 3;
  engine.player.switchCharacter('caterpillar', engine.level);
  const foods = engine.entities.filter(e => e.type === 'food').map(f => Math.floor(f.x / ts)).sort((a,b)=>a-b);
  console.log(`level ${lvl+1}: fruits at cols ${foods.join(',')} | needed: ${engine.player.totalFoodsInLevel}`);

  // walk right, hopping to grab the early fruits; try transform whenever 3 collected
  const input = engine.input;
  let transformed = false;
  let dir = 1;
  for (let f = 0; f < 60 * 90; f++) {
    const p = engine.player;
    const have3 = p.foods.length >= 3;
    if (p.x > 34 * ts) dir = -1;
    if (p.x < 8 * ts) dir = 1;
    input.keys['ArrowRight'] = !have3 && dir === 1;
    input.keys['ArrowLeft'] = !have3 && dir === -1;
    input.keys[' '] = !have3 && (f % 37) < 14;   // constant hops while sweeping
    input.keys['c'] = have3 && (f % 20 === 0);
    input.update();
    engine.update();
    if (engine.player.isButterfly) { transformed = true; break; }
  }
  console.log(`  foods collected: ${engine.player.foods.join(',')} -> butterfly: ${transformed} at col ${Math.floor(engine.player.x/ts)}`);
}
