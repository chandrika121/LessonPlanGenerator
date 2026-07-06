import { spawn } from "node:child_process";
import net from "node:net";

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 4173);
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 3002);

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        resolve(true);
        return;
      }
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(false));
    });

    server.listen(port, "0.0.0.0");
  });
}

function createCommand(command, args, cwd) {
  if (process.platform === "win32") {
    return spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: true,
    });
  }

  return spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });
}

function startDevServers() {
  const frontendProcess = createCommand("npx", ["vite"], process.cwd());
  const backendProcess = createCommand("npx", ["tsx", "watch", "server.ts"], `${process.cwd()}\\backend`);

  const shutdown = () => {
    frontendProcess.kill();
    backendProcess.kill();
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    shutdown();
    process.exit(0);
  });

  backendProcess.on("exit", (code) => {
    if (code && code !== 0) {
      frontendProcess.kill();
      process.exit(code);
    }
  });

  frontendProcess.on("exit", (code) => {
    if (code && code !== 0) {
      backendProcess.kill();
      process.exit(code);
    }
  });
}

const frontendInUse = await isPortInUse(FRONTEND_PORT);
const backendInUse = await isPortInUse(BACKEND_PORT);

if (frontendInUse && backendInUse) {
  console.log(`[dev] Frontend port ${FRONTEND_PORT} and backend port ${BACKEND_PORT} are already in use.`);
  console.log(`[dev] Reusing the existing dev servers.`);
  console.log(`[dev] Frontend: http://localhost:${FRONTEND_PORT}`);
  console.log(`[dev] Backend:  http://localhost:${BACKEND_PORT}`);
  process.exit(0);
}

if (frontendInUse || backendInUse) {
  console.error("[dev] Port conflict detected.");
  if (frontendInUse) {
    console.error(`[dev] Frontend port ${FRONTEND_PORT} is already in use.`);
  }
  if (backendInUse) {
    console.error(`[dev] Backend port ${BACKEND_PORT} is already in use.`);
  }
  console.error("[dev] Stop the existing process or free the port, then run `npm run dev` again.");
  process.exit(1);
}

startDevServers();
