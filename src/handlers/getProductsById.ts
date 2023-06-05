import { buildResponse } from '../utils/index';
import httpStatusCode from '../type/httpStatusCode';
import { getProductsById } from '../data/index';
import { TError, TGetProductsByIdEvent } from '../type/index';

export const handler = async (event: TGetProductsByIdEvent) => {
  try {
    const { productId } = event.pathParameters;
    const product = await getProductsById(productId);
    return buildResponse(httpStatusCode.OK, product);
  } catch (err) {
    const { error, message } = err as TError;
    return buildResponse(error, { message });
  }
};
