import { buildResponse } from '../utils';
import httpStatusCode from '../type/httpStatusCode';
import { TError, TGetProductsByIdEvent } from '../type';
import { getRecord } from '../dynamoDB';

export const handler = async (event: TGetProductsByIdEvent) => {
  console.log('getProductById', event);
  try {
    const { productId } = event.pathParameters;
    const { TABLE_NAME_PRODUCT, TABLE_NAME_STOCK } = process.env;

    const productItem = await getRecord(TABLE_NAME_PRODUCT ?? 'Product', 'id', productId);
    const stockItem = await getRecord(TABLE_NAME_STOCK ?? 'Stock', 'product_id', productId);
    delete stockItem?.product_id;
    const product = { ...productItem, ...stockItem };

    return buildResponse(httpStatusCode.OK, product);
  } catch (err) {
    const { error, message } = err as TError;
    return buildResponse(error, { message });
  }
};
