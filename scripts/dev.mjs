// Start backend + Vite dev server together, without extra dependencies.
import { spawn } from 'node:child_process'

const server = spawn('node', ['server/index.js'], { stdio: 'inherit' })
const client = spawn('npx', ['vite', '--port', '5173'], { stdio: 'inherit', shell: true })

const stop = () => { server.kill(); client.kill(); process.exit(0) }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
server.on('exit', (code) => { if (code !== 0) console.error(`server exited with ${code}`) })
client.on('exit', (code) => { if (code !== 0) console.error(`vite exited with ${code}`) })
