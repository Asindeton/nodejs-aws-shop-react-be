import httpStatusCode from '../type/httpStatusCode';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import { TCreatedProduct } from '../type';

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

export const validateBody = (body: TCreatedProduct) => {
  const { description, title, price, count } = body;
  if (!description || !title || !price || !count) {
    return false;
  }
  if (
    typeof description !== 'string' ||
    typeof title !== 'string' ||
    typeof price !== 'number' ||
    typeof count !== 'number'
  ) {
    return false;
  }
  return true;
};
