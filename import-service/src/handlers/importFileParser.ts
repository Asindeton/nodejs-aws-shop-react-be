import { S3Event } from 'aws-lambda';
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PassThrough, Readable } from 'stream';
import { buildResponse } from '../utils/index';
import { EMessage, TError } from '../type/index';
import httpStatusCode from '../type/httpStatusCode';
import csv from 'csv-parser';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

export const handler = async (event: S3Event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const params = {
    Bucket: bucket,
    Key: key,
  };
  try {
    const client = new S3Client({ region: process.env.AWS_REGION });
    const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

    const file = await client.send(new GetObjectCommand(params));
    const data = file.Body;
    if (!(data instanceof Readable)) {
      throw new Error('Failed to read file');
    }

    await new Promise((resolve, reject) => {
      const stream = data?.pipe(new PassThrough());
      stream
        ?.pipe(csv())
        .on('data', async (data) => {
          stream.pause();
          try {
            console.log('Sending message to SQS', data);
            await sqsClient.send(
              new SendMessageCommand({
                QueueUrl: process.env.SQS_URL ?? '',
                MessageBody: JSON.stringify(data),
              }),
            );
          } catch (e) {
            reject(e);
          }
          stream.resume();
        })
        .on('error', reject)
        .on('end', async () => {
          console.log({
            Bucket: bucket,
            CopySource: bucket + '/' + key,
            Key: key.replace('uploaded', 'parsed'),
            sqsUrl: process.env.SQS_URL,
          });
          await client.send(
            new CopyObjectCommand({
              Bucket: bucket,
              CopySource: bucket + '/' + key,
              Key: key.replace('uploaded', 'parsed'),
            }),
          );
          console.log('Copied into parsed folder');
          await client.send(new DeleteObjectCommand(params));
          console.log('Deleted from uploaded folder');
          resolve(null);
        });
    });
    return buildResponse(200, { message: 'File parsed' });
  } catch (e) {
    const { error, message } = e as TError;
    return buildResponse(error || httpStatusCode.NOT_FOUND, {
      message: message || EMessage.unableToGetProductsList,
    });
  }
};
