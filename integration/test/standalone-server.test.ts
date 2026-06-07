import { describe, expect, it } from "vitest";
import { request } from "node:http";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startStaticServer, stopServer } from "../../e2e/support/standalone-server.js";

function httpGetStatus(port: number, path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method: "GET" }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("error", reject);
    req.end();
  });
}

describe("startStaticServer", () => {
  it("rejects path traversal outside the document root", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-e2e-root-"));
    await writeFile(join(root, "index.html"), "<html>ok</html>", "utf8");

    const server = await startStaticServer(root, 0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("expected port");
    const port = address.port;

    expect(await httpGetStatus(port, "/../../../etc/passwd")).toBe(403);
    expect(await httpGetStatus(port, "/index.html")).toBe(200);

    await stopServer(server);
  });
});
