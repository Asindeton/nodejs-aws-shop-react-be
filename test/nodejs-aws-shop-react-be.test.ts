import { getProductsById, getProductsData } from '../src/data';
import { handler as allHandle } from '../src/handlers/getProductsList';
import { handler as oneHandler } from '../src/handlers/getProductsById';
import { CORS_HEADERS } from '../src/utils';
import data from '../src/data/data.json';

const expectedProducts = [...data];

const mockFunc = {
  getProductsData,
  getProductsById,
};

describe('getProductsList', () => {
  it('should return a 200 with list', async () => {
    jest.spyOn(mockFunc, 'getProductsData').mockResolvedValueOnce(expectedProducts);
    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(expectedProducts),
    };
    const result = await allHandle();
    expect(result).toEqual(expectedResult);
  });

  it('should return a 404 with error', async () => {
    const serviceError = {};
    jest.spyOn(mockFunc, 'getProductsData').mockRejectedValueOnce(serviceError);
    const expectedResult = {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Unable to get products list.' }),
    };
    const result = await allHandle();
    expect(result).not.toEqual(expectedResult);
  });
});

describe('getProductsById', () => {
  it('should return a 200 with product', async () => {
    const expectedProduct = expectedProducts[0];
    jest.spyOn(mockFunc, 'getProductsById').mockResolvedValueOnce(expectedProduct);
    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(expectedProduct),
    };
    const result = await oneHandler({ pathParameters: { productId: expectedProduct.id } });
    expect(result).toEqual(expectedResult);
  });
  it('should return a 404 with error', async () => {
    const expectedProduct = expectedProducts[0];
    const serviceError = {};
    jest.spyOn(mockFunc, 'getProductsById').mockRejectedValueOnce(serviceError);
    const expectedResult = {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Unable to get product.' }),
    };
    const result = await oneHandler({ pathParameters: { productId: expectedProduct.id } });
    expect(result).not.toEqual(expectedResult);
  });
});
