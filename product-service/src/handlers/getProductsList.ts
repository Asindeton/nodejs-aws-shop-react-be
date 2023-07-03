import { buildResponse } from '../utils';
import httpStatusCode from '../type/httpStatusCode';
import { EMessage, TError } from '../type';
import { getAllData } from '../dynamoDB';

export const handler = async () => {
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
