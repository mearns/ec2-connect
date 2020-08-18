import AWS from "aws-sdk";
import packageData from "../package.json";

export interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export default async function getCredentials({
  profile,
  assume = []
}: { profile?: string; assume?: string[] } = {}): Promise<Credentials> {
  const baseCreds: Promise<Credentials> = profile
    ? getSharedIniFileCredentials(profile)
    : getDefaultCredentials();
  return assume.reduce(
    async (
      prevCreds: Promise<Credentials>,
      role: string
    ): Promise<Credentials> => assumeRole(await prevCreds, role),
    baseCreds
  );
}

async function getDefaultCredentials(): Promise<Credentials> {
  return new Promise((resolve, reject) => {
    AWS.config.getCredentials(error => {
      if (error) {
        reject(error);
      } else {
        resolve(AWS.config.credentials);
      }
    });
  });
}

async function getSharedIniFileCredentials(
  profile: string
): Promise<Credentials> {
  return new Promise((resolve, reject) => {
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
