import { Args } from "./args";
import aws from "aws-sdk";
import getCredentials, { Credentials } from "./authn";

export default async function main(args: Args): Promise<object> {
  const creds = await getCredentials({
    profile: args.profile,
    assume: args.assume
  });
  const command = args.commands.shift();
  switch (command) {
    case "get-address":
      return runGetAddress(creds, args);

    default:
      throw new Error(`Unsupported command: ${command}`);
  }
}

interface GetAddressResult {
  instances: Array<{
    address: string;
    keyName?: string;
    tags: Array<{ key: string; value: string }>;
  }>;
}

export async function runGetAddress(
  creds: Credentials,
  args: Args
): Promise<GetAddressResult> {
  const instances = await findInstances(creds, args);
  return {
    instances: instances.map(instance => ({
      address: instance.PrivateIpAddress,
      keyName: instance.KeyName,
      tags: (instance.Tags || []).map(({ Key, Value }) => ({
        key: Key,
        value: Value
      }))
    }))
  };
}

async function findInstances(
  creds: Credentials,
  args: Args
): Promise<aws.EC2.Instance[]> {
  const ec2 = new aws.EC2({
    apiVersion: "2016-11-15",
    credentials: creds,
    region: args.region
  });
  const filters = getAllFilters(args);

  const params: aws.EC2.Types.DescribeInstancesRequest = {};
  if (filters.length) {
    params.Filters = filters;
  }
  let results = await ec2.describeInstances(params).promise();

  const instances: Array<aws.EC2.Instance> = getAllInstancesFromReservations(
    results.Reservations
  );
  while (results.NextToken) {
    results = await ec2
      .describeInstances({ NextToken: results.NextToken })
      .promise();
    instances.push(...getAllInstancesFromReservations(results.Reservations));
  }
  return instances;
}

function getAllFilters(args: Args): aws.EC2.Filter[] {
  const filters: aws.EC2.Filter[] = [];
  args.tags.forEach(({ tag, value }) => {
    filters.push({ Name: `tag:${tag}`, Values: [value] });
  });
  return filters;
}

function getInstancesFromReservation(
  reservation?: aws.EC2.Reservation
): Array<aws.EC2.Instance> {
  return reservation ? reservation.Instances || [] : [];
}

function getAllInstancesFromReservations(
  reservations: Array<aws.EC2.Reservation>
): Array<aws.EC2.Instance> {
  return reservations.reduce(
    (all, res) => [...all, ...getInstancesFromReservation(res)],
    []
  );
}
