// =============================================================
//  SUPPORTFLOW — DEV ORCHESTRATOR.
//  `npm run dev` from the repo root starts BOTH processes:
//    1. Backend  — its own `npm run dev` in ./backend (Firebase Functions emulator)
//    2. Frontend — its own `npm run dev` in ./frontend (Vite dev server)
//  No external dependencies (no concurrently needed). Both children
//  share this terminal; Ctrl+C stops them together.
// =============================================================
const { spawn } = require('child_process')
const path = require('path')

const root = path.resolve(__dirname, '..')
const isWin = process.platform === 'win32'

// Resolve a command on Windows (npm/firebase are .cmd shims).
function resolveCmd(cmd) {
  return isWin ? `${cmd}.cmd` : cmd
}

function launch(name) {
  let target
  if (name === 'backend') {
    // Run the backend's OWN dev script (firebase functions emulator).
    // firebase.json at the repo root + functions.source "backend" make this
    // work from anywhere, but launching from ./backend keeps it isolated.
    target = { cmd: resolveCmd('npm'), args: ['run', 'dev'], cwd: path.join(root, 'backend') }
  } else {
    target = { cmd: resolveCmd('npm'), args: ['run', 'dev'], cwd: path.join(root, 'frontend') }
  }

  const child = spawn(target.cmd, target.args, {
    cwd: target.cwd,
    stdio: 'inherit',
    shell: isWin, // on Windows, .cmd shims need a shell
  })

  child.on('error', (err) => {
    console.error(`[${name}] could not start: ${err.message}`)
    console.error(`[${name}] command was: ${target.cmd} ${target.args.join(' ')}`)
  })
  child.on('exit', (code) => {
    console.log(`[${name}] stopped (exit code ${code})`)
  })
  return child
}

const backend = launch('backend')
const frontend = launch('frontend')

process.stdin.resume()

function shutdown() {
  try {
    backend.kill('SIGTERM')
  } catch {}

  try {
    frontend.kill('SIGTERM')
  } catch {}

  setTimeout(() => process.exit(0), 800)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
