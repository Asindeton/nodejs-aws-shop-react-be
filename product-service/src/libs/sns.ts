import { SNSClient } from '@aws-sdk/client-sns';
// Set the AWS Region.
const REGION = process.env.REGION ?? 'eu-west-1'; //e.g. "us-east-1"
// Create SNS service object.
const snsClient = new SNSClient({ region: REGION });
export { snsClient };
