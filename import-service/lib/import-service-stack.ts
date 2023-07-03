import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { BUCKET_CORS_SETTINGS, CORS_PREFLIGHT_SETTINGS } from '../src/utils/index';
import 'dotenv/config';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, 'importServiceBucket', {
      bucketName: process.env.IMPORT_SERVICE_BUCKET_NAME,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const queue = sqs.Queue.fromQueueArn(this, 'importFileQueue', process.env.QUEUE_ARN as string);

    const environment = {
      BUCKET_NAME: importBucket.bucketName,
      BUCKET_ARN: importBucket.bucketArn,
      SQS_URL: queue.queueUrl,
    };

    const authLambda = lambda.Function.fromFunctionArn(this, 'authLambda', process.env.AUTH_LAMBDA_ARN as string);
    const authorizer = new apiGw.TokenAuthorizer(this, 'basicAuthorizer', {
      handler: authLambda,
      identitySource: apiGw.IdentitySource.header('Authorization'),
    });

    const importProductFiles = new NodejsFunction(this, 'GetProductsListHandler', {
      environment,
      functionName: 'importProductFiles',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/handlers/importProductsFile.ts',
    });

    const importFileParser = new NodejsFunction(this, 'importProductParser', {
      environment,
      functionName: 'importFileParser',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/handlers/importFileParser.ts',
    });

    const api = new apiGw.RestApi(this, 'import-api', {
      restApiName: 'Import Service',
      description: 'NodeJS shop import api',
    });

    const importModel = api.addModel('ImportModel', {
      modelName: 'ImportModel',
      contentType: 'application/json',
      schema: {
        schema: apiGw.JsonSchemaVersion.DRAFT4,
        title: 'importModel',
        type: apiGw.JsonSchemaType.OBJECT,
        properties: {
          name: {
            type: apiGw.JsonSchemaType.STRING,
          },
        },
      },
    });

    const importProductFilesIntegration = new apiGw.LambdaIntegration(importProductFiles);

    const importProductFilesResource = api.root.addResource('import');

    importBucket.addCorsRule(BUCKET_CORS_SETTINGS);
    importBucket.grantReadWrite(importProductFiles);

    importBucket.grantReadWrite(importFileParser);
    importBucket.grantDelete(importFileParser);

    queue.grantSendMessages(importFileParser);

    importProductFilesResource.addCorsPreflight(CORS_PREFLIGHT_SETTINGS);
    // authorizer.bind(importProductFilesResource);
    importProductFilesResource.addMethod('GET', importProductFilesIntegration, {
      authorizer: authorizer,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': importModel,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': importModel,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
          },
        },
      ],
    });

    importBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParser), {
      prefix: 'uploaded/',
    });
  }
}
