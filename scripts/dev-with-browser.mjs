#!/usr/bin/env node

import { spawn } from 'node:child_process';
import process from 'node:process';
import open from 'open';
import waitOn from 'wait-on';

const rawArgs = process.argv.slice(2);
const nextArgs = ['dev', '--turbopack', ...rawArgs];

const envPort = process.env.PORT;
let port = envPort ?? '3000';
const hasExplicitPort = rawArgs.some((arg, index) => {
  if (arg === '-p' || arg === '--port') {
    if (rawArgs[index + 1]) {
      port = rawArgs[index + 1];
    }
    return true;
  }
  if (arg.startsWith('--port=')) {
    port = arg.split('=')[1];
    return true;
  }
  if (arg.startsWith('-p=')) {
    port = arg.split('=')[1];
    return true;
  }
  return false;
});

if (!hasExplicitPort) {
  if (!envPort) {
    port = port ?? '3000';
  } else {
    port = envPort;
  }
  nextArgs.push('-p', port);
}

const envHost = process.env.HOST ?? process.env.HOSTNAME;
let hostname = envHost ?? 'localhost';
const hasExplicitHost = rawArgs.some((arg, index) => {
  if (arg === '-H' || arg === '--hostname') {
    if (rawArgs[index + 1]) {
      hostname = rawArgs[index + 1];
    }
    return true;
  }
  if (arg.startsWith('--hostname=')) {
    hostname = arg.split('=')[1];
    return true;
  }
  if (arg.startsWith('-H=')) {
    hostname = arg.split('=')[1];
    return true;
  }
  return false;
});

if (!hasExplicitHost && envHost) {
  hostname = envHost;
  nextArgs.push('--hostname', hostname);
}

const autoOpen = (process.env.AUTO_OPEN_BROWSER ?? 'true').toLowerCase() !== 'false';
const openDelay = Number.parseInt(process.env.AUTO_OPEN_DELAY ?? '1000', 10);
const openTimeout = Number.parseInt(process.env.AUTO_OPEN_TIMEOUT ?? '30000', 10);
const targetUrl = process.env.AUTO_OPEN_URL ?? `http://${hostname}:${port}`;

const toWaitResource = (url) => {
  if (url.startsWith('https://')) {
    return `https-get://${url.slice('https://'.length)}`;
  }
  if (url.startsWith('http://')) {
    return `http-get://${url.slice('http://'.length)}`;
  }
  return url;
};

const devProcess = spawn('npx', ['next', ...nextArgs], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

devProcess.on('error', (error) => {
  console.error('[dev-with-browser] Failed to start Next.js dev server:', error);
  process.exit(1);
});

if (autoOpen) {
  waitOn({
    resources: [toWaitResource(targetUrl)],
    delay: openDelay,
    interval: 500,
    timeout: openTimeout,
    tcpTimeout: 1000,
    validateStatus: (status) => status >= 200 && status < 400,
  })
    .then(() => open(targetUrl).catch((error) => {
      console.warn('[dev-with-browser] Unable to open browser automatically:', error.message);
    }))
    .catch((error) => {
      console.warn('[dev-with-browser] Timed out waiting for dev server to become ready:', error.message);
    });
}

const shutdown = (signal) => {
  if (!devProcess.killed) {
    devProcess.kill(signal);
  }
};

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

devProcess.on('exit', (code) => {
  process.exit(code ?? 0);
});

