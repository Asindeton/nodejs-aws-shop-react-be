import { buildResponse } from '../utils/index';
import httpStatusCode from '../type/httpStatusCode';
import { getProductsData } from '../data/index';
import { EMessage, TError } from '../type/index';

export const handler = async () => {
  try {
    const products = await getProductsData();
    return buildResponse(httpStatusCode.OK, products);
  } catch (err) {
    const { error, message } = err as TError;
    return buildResponse(error || httpStatusCode.NOT_FOUND, {
      message: message || EMessage.unableToGetProductsList,
    });
  }
};
