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
import { TokenAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { aws_iam } from 'aws-cdk-lib';
import { PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

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

    const authLambda = lambda.Function.fromFunctionArn(
      this,
      'BasicAuthorizerLambda',
      process.env.AUTH_LAMBDA_ARN as string,
    );

    const authRole = new Role(this, 'authorizer-role', {
      roleName: 'authorizer-role',
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: {
        allowLambdaInvocation: PolicyDocument.fromJson({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['lambda:InvokeFunction', 'lambda:InvokeAsync'],
              Resource: process.env.AUTH_LAMBDA_ARN as string,
            },
          ],
        }),
      },
    });

    const authorizer = new TokenAuthorizer(this, 'basicAuthorizer', {
      handler: authLambda,
      authorizerName: 'ImportAuthorizer',
      resultsCacheTtl: cdk.Duration.seconds(0),
      assumeRole: authRole,
    });

    authLambda.addPermission('apigateway', {
      principal: new aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: authorizer.authorizerArn,
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
      bundling: {
        externalModules: ['aws-lambda'],
      },
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
    importProductFilesResource.addMethod('GET', importProductFilesIntegration, {
      authorizer,
      authorizationType: apiGw.AuthorizationType.CUSTOM,
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
    const responseHeaders = {
      'Access-Control-Allow-Origin': "'*'",
      'Access-Control-Allow-Headers': "'*'",
      'Access-Control-Allow-Methods': "'GET'",
    };

    api.addGatewayResponse('apiGwResponseUNAUTHORIZED', {
      type: apiGw.ResponseType.UNAUTHORIZED,
      responseHeaders,
    });
    api.addGatewayResponse('apiGwResponseACCESS_DENIED', {
      type: apiGw.ResponseType.ACCESS_DENIED,
      responseHeaders,
    });

    importBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParser), {
      prefix: 'uploaded/',
    });
  }
}
