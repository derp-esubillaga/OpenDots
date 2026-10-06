#!/usr/bin/env node
// Opens http://localhost:<port> on this machine and forwards each connection
// to the OpenDots app container on a remote Docker host, over the Docker API
// connection itself (docker exec). Nothing extra is exposed on the remote host:
// the app keeps listening only inside its container network.
//
//   node scripts/remote/tunnel.mjs [--context home-pc] [--container opendots-app-1] [--port 8310]
//
// APP_ORIGIN on the remote app must equal http://localhost:<port>.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    context: { type: 'string', default: 'home-pc' },
    container: { type: 'string', default: 'opendots-app-1' },
    port: { type: 'string', default: '8310' },
    'app-port': { type: 'string', default: '4310' },
  },
});
const port = Number(values.port);
// Runs inside the app container, which already has Node: bridge stdin/stdout
// to the app's own port.
const bridge = `const s=require('net').connect(${Number(values['app-port'])},'127.0.0.1');process.stdin.pipe(s);s.pipe(process.stdout);process.stdin.on('end',()=>s.end());s.on('close',()=>process.exit(0));s.on('error',()=>process.exit(1));`;

let open = 0;
const server = createServer((socket) => {
  open++;
  const child = spawn(
    'docker',
    [
      '--context',
      values.context,
      'exec',
      '-i',
      values.container,
      'node',
      '-e',
      bridge,
    ],
    { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true },
  );
  socket.pipe(child.stdin);
  child.stdout.pipe(socket);
  child.stderr.on('data', (data) => process.stderr.write(data));
  const close = () => {
    socket.destroy();
    child.kill();
  };
  socket.on('error', close);
  socket.on('close', () => {
    open--;
    child.kill();
  });
  child.on('exit', () => socket.end());
  child.on('error', (error) => {
    console.error(`docker exec failed: ${error.message}`);
    close();
  });
});
server.listen(port, '127.0.0.1', () =>
  console.log(
    `OpenDots on ${values.context} -> http://localhost:${port} (Ctrl+C to stop)`,
  ),
);
server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
process.on('SIGINT', () => {
  console.log(`\nClosing (${open} open connections).`);
  process.exit(0);
});
