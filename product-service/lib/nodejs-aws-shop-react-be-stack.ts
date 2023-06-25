import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { SubscriptionProtocol } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ErrorSchema, ProductListSchema, ProductSchema } from '../src/model';
import { CORS_PREFLIGHT_SETTINGS } from '../src/utils';
import httpMethod from '../src/type/httpMethod';
import httpStatusCode from '../src/type/httpStatusCode';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import 'dotenv/config';
export class NodejsAwsShopReactBeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = dynamodb.Table.fromTableName(this, 'ProductTable', 'Product');
    const tableStock = dynamodb.Table.fromTableName(this, 'StockTable', 'Stock');

    const queue = new sqs.Queue(this, 'catalogItemsQueue', {
      queueName: 'catalogItemsQueue',
    });

    const topic = new sns.Topic(this, 'createProductTopic', {
      topicName: 'createProductTopic',
    });

    new sns.Subscription(this, 'importQueue', {
      endpoint: process.env.TOPIC_EMAIL as string,
      protocol: SubscriptionProtocol.EMAIL,
      topic: topic,
    });

    const environment = {
      TABLE_NAME_PRODUCT: table.tableName,
      TABLE_NAME_STOCK: tableStock.tableName,
      SNS_ARN: topic.topicArn,
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

    const catalogBatchProcess = new NodejsFunction(this, 'CatalogBatchProcessHandler', {
      environment,
      functionName: 'catalogBatchProcess',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/handlers/catalogBatchProcess.ts',
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

    topic.grantPublish(catalogBatchProcess);
    catalogBatchProcess.addEventSource(new SqsEventSource(queue, { batchSize: 5 }));
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
    table.grantWriteData(catalogBatchProcess);
    tableStock.grantWriteData(catalogBatchProcess);

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
