import data from './data.json';
import { EMessage, TProduct } from '../type';
import httpStatusCode from '../type/httpStatusCode';

export const getProductsData = () => Promise.resolve(data);
export const getProductsById = (id: string) => {
  const product: TProduct | undefined = data.find((p) => p.id === id);
  if (product) {
    return Promise.resolve(product);
  }
  return Promise.reject({ error: httpStatusCode.NOT_FOUND, message: EMessage.notFound });
};
