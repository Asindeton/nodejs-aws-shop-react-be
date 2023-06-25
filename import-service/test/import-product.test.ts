import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { handler } from '../src/handlers/importProductsFile';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EMessage } from '../src/type/index';
import HttpStatusCode from '../src/type/httpStatusCode';

const mockSignedUrl = 'https://mock.s3.amazonaws.com/test';

jest.mock('@aws-sdk/s3-request-presigner');
const getSignedUrlMock = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;
getSignedUrlMock.mockImplementation(() => Promise.resolve(mockSignedUrl));

const validEvent = {
  queryStringParameters: {
    name: 'test',
  },
} as unknown;

const invalidEvent = {
  queryStringParameters: {},
} as unknown;

const errorMessage = 'test error message';

describe('import products lambda tests', () => {
  beforeAll(() => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(PutObjectCommand, { Bucket: 'bucket', Key: 'products.csv' }).resolves({});
  });

  it('Lambda should return 200 with signed url', async () => {
    const response = await handler(validEvent);
    expect(response.statusCode).toBe(HttpStatusCode.OK);
    const body = JSON.parse(response.body);
    expect(body?.message).toBe(mockSignedUrl);
  });

  it('Lambda should return 400 if no name is provided', async () => {
    const response = await handler(invalidEvent);
    expect(response.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    const body = JSON.parse(response.body);
    expect(body).toEqual({ message: EMessage.invalidName });
  });

  it('Lambda should return 500 in case of unexpected error', async () => {
    getSignedUrlMock.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));
    const response = await handler(validEvent);
    expect(response.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
    const body = JSON.parse(response.body);
    expect(body).toEqual({ message: errorMessage });
  });
});
