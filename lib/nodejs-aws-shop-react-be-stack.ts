import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ErrorSchema, ProductListSchema, ProductSchema } from '../src/model';
import { CORS_PREFLIGHT_SETTINGS } from '../src/utils';
import httpMethod from '../src/type/httpMethod';
import httpStatusCode from '../src/type/httpStatusCode';

export class NodejsAwsShopReactBeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = dynamodb.Table.fromTableName(this, 'ProductTable', 'Product');
    const tableStock = dynamodb.Table.fromTableName(this, 'StockTable', 'Stock');

    const environment = {
      TABLE_NAME_PRODUCT: table.tableName,
      TABLE_NAME_STOCK: tableStock.tableName,
    };

    const getProductsList = new NodejsFunction(this, 'GetProductsListHandler', {
      environment,
      functionName: 'getProductsList',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/handlers/getProductsList.ts',
    });

    const getProductsById = new NodejsFunction(this, 'GetProductsByIdHandler', {
      environment,
      functionName: 'getProductsById',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/handlers/getProductsById.ts',
    });

    const createProduct = new NodejsFunction(this, 'CreateProductHandler', {
      environment,
      functionName: 'createProduct',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/handlers/createProduct.ts',
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
    const createProductIntegration = new apiGw.LambdaIntegration(createProduct);

    const productsApi = api.root.addResource('products');
    const productIdApi = productsApi.addResource('{productId}');

    productsApi.addCorsPreflight(CORS_PREFLIGHT_SETTINGS);
    productIdApi.addCorsPreflight(CORS_PREFLIGHT_SETTINGS);

    table.grantReadData(getProductsList);
    tableStock.grantReadData(getProductsList);
    table.grantReadData(getProductsById);
    tableStock.grantReadData(getProductsById);
    table.grantWriteData(createProduct);
    tableStock.grantWriteData(createProduct);

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

    productsApi.addMethod(httpMethod.POST, createProductIntegration, {
      methodResponses: [
        {
          statusCode: String(httpStatusCode.OK),
          responseModels: {
            'application/json': productModel,
          },
        },
        {
          statusCode: String(httpStatusCode.BAD_REQUEST),
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
