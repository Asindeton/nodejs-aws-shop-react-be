import httpStatusCode from './httpStatusCode';

export type TProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  count?: number;
};
export enum EMessage {
  notFound = 'Product not found',
  unableToGetProductsList = 'Unable to get products list.',
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
