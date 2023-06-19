import { buildResponse } from '../utils/index';
import { EMessage, TError } from '../type';
import httpStatusCode from '../type/httpStatusCode';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const handler = async (event: unknown) => {
  try {
    // @ts-ignore
    const name = event.queryStringParameters?.name;
    if (!name) {
      throw { error: httpStatusCode.BAD_REQUEST, message: EMessage.invalidName };
    }
    const { BUCKET_NAME } = process.env;

    const client = new S3Client({});
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME ?? 'BUCKET_NAME',
      Key: `uploaded/${name}`,
      Body: '',
      ContentType: 'text/csv',
    });

    await client.send(command);
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    return buildResponse(httpStatusCode.OK, {
      message: signedUrl,
    });
  } catch (e) {
    const { error, message } = e as TError;
    return buildResponse(error || httpStatusCode.INTERNAL_SERVER_ERROR, {
      message: message || EMessage.unableToGetProductsList,
    });
  }
};
