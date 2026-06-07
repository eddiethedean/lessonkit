import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

function resolveSafeFilePath(rootDir: string, requestPath: string): string | null {
  const resolvedRoot = resolve(rootDir);
  const filePath = resolve(resolvedRoot, requestPath.replace(/^\//, ""));
  if (filePath === resolvedRoot) return filePath;
  if (!filePath.startsWith(resolvedRoot + sep)) return null;
  return filePath;
}

export async function startStaticServer(rootDir: string, port: number): Promise<Server> {
  const server = createServer(async (req, res) => {
    try {
      const rawPath = decodeURIComponent(req.url?.split("?")[0] ?? "/");
      if (rawPath.split("/").includes("..")) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      let path = rawPath;
      if (path.endsWith("/")) path += "index.html";
      const filePath = resolveSafeFilePath(rootDir, path);
      if (!filePath) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      const body = await readFile(filePath);
      const ext = extname(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  await new Promise<void>((resolveListen) => server.listen(port, "127.0.0.1", resolveListen));
  return server;
}

export async function stopServer(server: Server | undefined): Promise<void> {
  if (!server?.listening) return;
  await new Promise<void>((resolveClose, reject) => {
    server.close((err) => {
      if (err && (err as NodeJS.ErrnoException).code === "ERR_SERVER_NOT_RUNNING") {
        resolveClose();
        return;
      }
      if (err) reject(err);
      else resolveClose();
    });
  });
}
