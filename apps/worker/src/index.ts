import { config } from "./config";
import { pollOnce } from "./poller";

async function main() {
  console.log("Take This One worker started.");
  await pollOnce();

  setInterval(() => {
    void pollOnce();
  }, config.pollIntervalMs);
}

void main().catch((error) => {
  console.error("Worker crashed:", error);
  process.exit(1);
});
