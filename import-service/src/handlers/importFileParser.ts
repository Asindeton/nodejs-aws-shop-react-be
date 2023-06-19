import { S3Event } from 'aws-lambda';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';
import { PassThrough, Readable } from 'stream';
import { buildResponse } from '../utils/index';
import { EMessage, TError } from '../type/index';
import httpStatusCode from '../type/httpStatusCode';
import csv from 'csv-parser';
// const csv = require('csv-parser');

export const handler = async (event: S3Event) => {
  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const params = {
    Bucket: bucket,
    Key: key,
  };
  try {
    const client = new S3Client({ region: process.env.AWS_REGION });
    // const output = await new S3().getObject({ ...params }).createReadStream();
    const file = await client.send(new GetObjectCommand(params));
    const data = file.Body;
    if (!(data instanceof Readable)) {
      throw new Error('Failed to read file');
    }
    await new Promise((resolve, reject) => {
      data
        ?.pipe(new PassThrough())
        .pipe(csv())
        .on('data', console.log)
        .on('error', console.log)
        .on('end', async () => {
          console.log({ Bucket: bucket, CopySource: bucket + '/' + key, Key: key.replace('uploaded', 'parsed') });
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
