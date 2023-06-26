import httpStatusCode from '../type/httpStatusCode';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import { HttpMethods } from 'aws-cdk-lib/aws-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';

export function buildResponse<T>(statusCode: httpStatusCode, body: T) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Credentials': true,
};

export const CORS_PREFLIGHT_SETTINGS = {
  allowOrigins: ['*'],
  allowHeaders: ['*'],
  allowMethods: apiGw.Cors.ALL_METHODS,
};

export const BUCKET_CORS_SETTINGS = {
  allowedHeaders: ['*'],
  allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
  allowedOrigins: ['*'],
};

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export { s3Client, sqsClient };
