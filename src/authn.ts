import AWS from "aws-sdk";
import packageData from "../package.json";

export interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export default async function getCredentials({
  profile = "default",
  assume = [] as Array<string>
} = {}): Promise<Credentials> {
  const baseCreds: Promise<Credentials> = new Promise((resolve, reject) => {
    const creds = new AWS.SharedIniFileCredentials({
      profile,
      callback: (error): void => {
        if (error) {
          reject(error);
        } else {
          resolve(creds);
        }
      }
    });
  });
  return assume.reduce(
    async (
      prevCreds: Promise<Credentials>,
      role: string
    ): Promise<Credentials> => assumeRole(await prevCreds, role),
    baseCreds
  );
}

async function assumeRole(
  usingCredentials: Credentials,
  roleArn: string
): Promise<Credentials> {
  const sts = new AWS.STS({
    apiVersion: "2011-06-15",
    credentials: usingCredentials
  });
  const response: AWS.STS.AssumeRoleResponse = await sts
    .assumeRole({
      RoleArn: roleArn,
      RoleSessionName: packageData.name
    })
    .promise();
  const {
    AccessKeyId: accessKeyId,
    SecretAccessKey: secretAccessKey,
    SessionToken: sessionToken
  } = response.Credentials;
  return { accessKeyId, secretAccessKey, sessionToken };
}
