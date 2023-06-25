//create catalogBatchProcess lambda
import { buildResponse, validateBody } from '../utils';
import httpStatusCode from '../type/httpStatusCode';
import { EMessage, IProduct, IStock, TCreatedProduct, TError } from '../type';
import { Handler } from 'aws-cdk-lib/aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { createProduct } from '../dynamoDB';
import { snsClient } from '../libs/sns';
import { PublishCommand } from '@aws-sdk/client-sns';

export const handler: Handler = async (event) => {
  try {
    const { TABLE_NAME_PRODUCT, TABLE_NAME_STOCK, SNS_ARN } = process.env;
    const { Records } = event;
    console.log('records length', Records.length);

    for (const record of Records) {
      const body: TCreatedProduct = JSON.parse(record.body);
      if (!validateBody({ ...body, count: Number(body.count), price: Number(body.price) })) {
        throw { error: httpStatusCode.BAD_REQUEST, message: EMessage.wrongProductData };
      }
      const { description, title, price, count } = body;
      const id = uuidv4();
      const product: IProduct = { description, id, title, price: Number(price) };
      const stock: IStock = { product_id: id, count: Number(count) };

      const result = await createProduct(product, stock, TABLE_NAME_PRODUCT ?? 'Product', TABLE_NAME_STOCK ?? 'Stock');
      console.log('result', result);
      await snsClient.send(
        new PublishCommand({
          Subject: 'New product',
          TopicArn: SNS_ARN,
          Message: JSON.stringify({ id: id, description: description, title: title, price: price, count: count }),
        }),
      );
    }
    return buildResponse(httpStatusCode.OK, { message: Records.length + ' products created', Records });
  } catch (err) {
    const { error, message } = err as TError;
    return buildResponse(error || httpStatusCode.NOT_FOUND, {
      message: message || EMessage.unknownError,
    });
  }
};
