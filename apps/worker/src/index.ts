import { config } from "./config";
import { pollOnce } from "./poller";

async function main() {
  console.log("Pulseboard worker started.");
  await pollOnce();

  setInterval(() => {
    void pollOnce();
  }, config.workerTickMs);
}

void main().catch((error) => {
  console.error("Worker crashed:", error);
  process.exit(1);
});
