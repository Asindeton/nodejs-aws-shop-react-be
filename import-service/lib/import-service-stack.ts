import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { BUCKET_CORS_SETTINGS, CORS_PREFLIGHT_SETTINGS } from '../src/utils/index';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import 'dotenv/config';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, 'importServiceBucket', {
      bucketName: process.env.IMPORT_SERVICE_BUCKET_NAME,
    });

    const environment = {
      BUCKET_NAME: importBucket.bucketName,
      BUCKET_ARN: importBucket.bucketArn,
    };

    const importProductFiles = new NodejsFunction(this, 'GetProductsListHandler', {
      environment,
      functionName: 'importProductFiles',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/handlers/importProductsFile.ts',
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

    importBucket.grantReadWrite(importProductFiles);
    importBucket.addCorsRule(BUCKET_CORS_SETTINGS);

    importProductFilesResource.addCorsPreflight(CORS_PREFLIGHT_SETTINGS);
    importProductFilesResource.addMethod('GET', importProductFilesIntegration, {
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
  }
}
