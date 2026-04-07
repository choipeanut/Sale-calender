import { runIngestionPipeline } from "@/lib/ingestion/run-ingestion";

const main = async () => {
  const output = await runIngestionPipeline("all:cli");
  console.log(JSON.stringify(output, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
