import httpStatusCode from '../type/httpStatusCode';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';

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
