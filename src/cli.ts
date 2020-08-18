import getArgs, { Args } from "./args";
import main from "./index";

async function cli(): Promise<void> {
  let args: Args;
  try {
    args = getArgs();
    const result = await main(args);
    if (args.json) {
      console.log(JSON.stringify(result, null, 4));
    } else {
      console.log(result);
    }
  } catch (error) {
    process.exitCode = 1;
    if (args.debug) {
      console.error(error);
    } else {
      console.error(error.message);
    }
  }
}

cli();
