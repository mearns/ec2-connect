import yargs, { Argv } from "yargs";

export interface Args {
  commands: Array<string>;
  tags: Array<{ tag: string; value: string }>;
  debug: boolean;
  profile: string;
  assume: Array<string>;
  region: string;
  json: boolean;
}

export default function getArgs(): Args {
  const args = yargs
    .command(
      "get-address",
      "Get the IP address of one or more instances",
      (_y: Argv): Argv =>
        _y
          .option("tag", {
            array: true,
            default: [],
            alias: ["t", "tags"],
            coerce: values => {
              const tags = [];
              for (let i = 0; i < values.length; i += 2) {
                tags.push({ tag: values[i], value: values[i + 1] });
              }
              return tags;
            },
            describe:
              "specify the name and value of a resource tag that the instance must have, as a pair of arguments",
            nargs: 2
          })
          .strict()
    )
    .option("debug", {
      type: "boolean",
      hidden: true,
      default: false
    })
    .option("json", {
      type: "boolean"
    })
    .option("profile", {
      default: "default",
      type: "string",
      description:
        "Optionally specify the name of a profile in your AWS config file that will be used for authentication."
    })
    .option("assume", {
      default: [],
      type: "string",
      array: true,
      description:
        "Optionally specify the ARN of a role to assume. Specify this option more than once to create a " +
        "chain of role assumptions leading to the roles you will use to access EC2. The first role is assumed using " +
        "your base credentials, each subsequent is assumed using the previous."
    })
    .option("region", {
      alias: "r",
      default: process.env.AWS_REGION,
      type: "string",
      required: true,
      description: "Specify the name of your AWS region"
    })
    .demandCommand(1)
    .strict().argv;

  return {
    tags: args.tag as Args["tags"],
    debug: args.debug as boolean,
    commands: args._ as Array<string>,
    profile: args.profile as string,
    assume: args.assume as Array<string>,
    region: args.region as string,
    json: args.json as boolean
  } as Args;
}
