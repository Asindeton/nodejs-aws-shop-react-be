import { buildResponse } from '../utils/index';
import httpStatusCode from '../type/httpStatusCode';
import { EMessage, TError } from '../type/index';
import { getAllData } from '../dynamoDB';

export const handler = async (event: unknown) => {
  console.log('getAllProduct', event);
  try {
    const { TABLE_NAME_PRODUCT, TABLE_NAME_STOCK } = process.env;

    const products = await getAllData(TABLE_NAME_PRODUCT ?? 'Product', TABLE_NAME_STOCK ?? 'Stock');

    return buildResponse(httpStatusCode.OK, products);
  } catch (err) {
    const { error, message } = err as TError;
    return buildResponse(error || httpStatusCode.NOT_FOUND, {
      message: message || EMessage.unableToGetProductsList,
    });
  }
};
