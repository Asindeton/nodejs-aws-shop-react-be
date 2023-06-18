import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import 'dotenv/config';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'ImportServiceQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const importBucket = new s3.Bucket(this, 'importServiceBucket', {
      bucketName: process.env.IMPORT_SERVICE_BUCKET_NAME,
    });
  }
}
