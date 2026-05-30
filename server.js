const { spawn } = require('child_process');
const http = require('http');

let child = null;
function start() {
  child = spawn('node', ['.next/standalone/server.js'], {
    cwd: '/home/z/my-project',
    env: { ...process.env, PORT: '3000', HOSTNAME: '0.0.0.0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.on('exit', () => { setTimeout(start, 300); });
  child.stdout.on('data', d => process.stdout.write(d));
  child.stderr.on('data', d => process.stderr.write(d));
}
start();

// Health check responder
const srv = http.createServer((req, res) => {
  if (child && child.exitCode === null) {
    res.writeHead(200); res.end('ok');
  } else {
    res.writeHead(503); res.end('restarting');
  }
});
srv.listen(3001, () => console.log('watchdog on 3001'));
