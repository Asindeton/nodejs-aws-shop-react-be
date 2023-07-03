import { S3Event } from 'aws-lambda';
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PassThrough, Readable } from 'stream';
import { buildResponse, s3Client, sqsClient } from '../utils/index';
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
    const file = await s3Client.send(new GetObjectCommand(params));
    const readableStream = file.Body;
    if (!(readableStream instanceof Readable)) {
      throw new Error('Failed to read file');
    }

    await new Promise((resolve, reject) => {
      readableStream
        .pipe(csv())
        .on('data', async (data) => {
          readableStream.pause();
          try {
            await sqsClient.send(
              new SendMessageCommand({
                QueueUrl: process.env.SQS_URL ?? '',
                MessageBody: JSON.stringify(data),
              }),
            );
            console.log('Sending message to SQS', data);
          } catch (e) {
            console.log('Error sending message to SQS', data);
            reject(e);
          }
          readableStream.resume();
        })
        .on('error', reject)
        .on('end', resolve);
    });

    console.log({
      Bucket: bucket,
      CopySource: bucket + '/' + key,
      Key: key.replace('uploaded', 'parsed'),
      sqsUrl: process.env.SQS_URL,
    });

    await s3Client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: bucket + '/' + key,
        Key: key.replace('uploaded', 'parsed'),
      }),
    );

    console.log('Copied into parsed folder');
    await s3Client.send(new DeleteObjectCommand(params));
    console.log('Deleted from uploaded folder');

    return buildResponse(200, { message: 'File parsed' });
  } catch (e) {
    const { error, message } = e as TError;
    return buildResponse(error || httpStatusCode.NOT_FOUND, {
      message: message || EMessage.unableToGetProductsList,
    });
  }
};
