import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ErrorSchema, ProductListSchema, ProductSchema } from '../src/model';
import { CORS_PREFLIGHT_SETTINGS } from '../src/utils';
import httpMethod from '../src/type/httpMethod';
import httpStatusCode from '../src/type/httpStatusCode';

export class NodejsAwsShopReactBeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const getProductsList = new NodejsFunction(this, 'GetProductsListHandler', {
      functionName: 'getProductsList',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/handlers/getProductsList.ts',
    });

    const getProductsById = new NodejsFunction(this, 'GetProductsByIdHandler', {
      functionName: 'getProductsById',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/handlers/getProductsById.ts',
    });

    const api = new apiGw.RestApi(this, 'products-api', {
      restApiName: 'Products Service',
      description: 'NodeJS shop api',
    });

    const productModel = api.addModel('ProductModel', {
      modelName: 'ProductModel',
      schema: ProductSchema,
    });

    const productListModel = api.addModel('ProductListModel', {
      modelName: 'ProductListModel',
      schema: ProductListSchema,
    });

    const errorModel = api.addModel('ErrorModel', {
      modelName: 'ErrorModel',
      schema: ErrorSchema,
    });

    const getProductsIntegration = new apiGw.LambdaIntegration(getProductsList);
    const getProductsByIdIntegration = new apiGw.LambdaIntegration(getProductsById);

    const productsApi = api.root.addResource('products');
    const productIdApi = productsApi.addResource('{productId}');

    productsApi.addCorsPreflight(CORS_PREFLIGHT_SETTINGS);
    productIdApi.addCorsPreflight(CORS_PREFLIGHT_SETTINGS);

    productsApi.addMethod(httpMethod.GET, getProductsIntegration, {
      methodResponses: [
        {
          statusCode: String(httpStatusCode.OK),
          responseModels: {
            'application/json': productListModel,
          },
        },
        {
          statusCode: String(httpStatusCode.NOT_FOUND),
          responseModels: {
            'application/json': errorModel,
          },
        },
      ],
    });

    productIdApi.addMethod(httpMethod.GET, getProductsByIdIntegration, {
      methodResponses: [
        {
          statusCode: String(httpStatusCode.OK),
          responseModels: {
            'application/json': productModel,
          },
        },
        {
          statusCode: String(httpStatusCode.NOT_FOUND),
          responseModels: {
            'application/json': errorModel,
          },
        },
      ],
    });
  }
}
