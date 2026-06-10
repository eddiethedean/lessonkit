import { cleanupE2eGoldenPackagingArtifacts } from "./support/goldenPackagingCleanup";

async function globalTeardown(): Promise<void> {
  await cleanupE2eGoldenPackagingArtifacts();
  console.log("e2e: cleaned golden packaging staging artifacts");
}

export default globalTeardown;
