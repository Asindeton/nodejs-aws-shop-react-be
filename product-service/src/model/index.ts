import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

const PRODUCT_PROPERTIES = {
  id: { type: JsonSchemaType.STRING },
  title: { type: JsonSchemaType.STRING },
  description: { type: JsonSchemaType.STRING },
  count: { type: JsonSchemaType.NUMBER, minimum: 0 },
  price: { type: JsonSchemaType.NUMBER, minimum: 0 },
};

export const ProductSchema = {
  type: JsonSchemaType.OBJECT,
  properties: PRODUCT_PROPERTIES,
};

export const ProductListSchema = {
  type: JsonSchemaType.ARRAY,
  items: ProductSchema,
};

export const ErrorSchema = {
  type: JsonSchemaType.OBJECT,
  properties: {
    message: {
      type: JsonSchemaType.STRING,
    },
  },
};
