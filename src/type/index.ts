import httpStatusCode from './httpStatusCode';

export type TCreatedProduct = {
  id: string;
  description: string;
  price: number;
  title: string;
  count: number;
};

export interface IProduct {
  id: string;
  description: string;
  price: number;
  title: string;
}

export interface IStock {
  product_id: string;
  count: number;
}

export enum EMessage {
  notFound = 'Product not found',
  unableToGetProductsList = 'Unable to get products list.',
  missingBody = 'Missing body',
  unableToCreateProduct = 'Unable to create product',
  wrongProductData = 'Wrong product data',
}

export type TError = {
  error: httpStatusCode;
  message: EMessage;
};

export type TGetProductsByIdEvent = {
  pathParameters: {
    productId: string;
  };
};
