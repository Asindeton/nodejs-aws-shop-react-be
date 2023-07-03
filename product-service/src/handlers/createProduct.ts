import { buildResponse, validateBody } from '../utils';
import httpStatusCode from '../type/httpStatusCode';
import { EMessage, IProduct, IStock, TCreatedProduct, TError } from '../type';
import { createProduct } from '../dynamoDB';
import { Handler } from 'aws-cdk-lib/aws-lambda';
import { v4 as uuidv4 } from 'uuid';

// @ts-ignore
export const handler = async (event) => {
  console.log('createProduct', event);
  try {
    if (!event.body) {
      throw { error: httpStatusCode.BAD_REQUEST, message: EMessage.missingBody };
    }

    // @ts-ignore
    const body: TCreatedProduct = JSON.parse(event.body);
    const { description, title, price, count } = body;
    const id = uuidv4();
    if (!validateBody(body)) {
      throw { error: httpStatusCode.BAD_REQUEST, message: EMessage.wrongProductData };
    }
    const product: IProduct = { description, id, title, price };
    const stock: IStock = { product_id: id, count };

    const { TABLE_NAME_PRODUCT, TABLE_NAME_STOCK } = process.env;

    const response = await createProduct(product, stock, TABLE_NAME_PRODUCT ?? 'Product', TABLE_NAME_STOCK ?? 'Stock');
    console.log('response', response);
    return buildResponse(httpStatusCode.OK, { result: { id, description, title, price, count } });
  } catch (err) {
    const { error, message } = err as TError;
    return buildResponse(error || httpStatusCode.NOT_FOUND, {
      message: message || EMessage.unableToCreateProduct,
    });
  }
};
