import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import 'dotenv/config';

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = {
      asindeton: process.env.asindeton!,
    };

    new NodejsFunction(this, 'BasicAuthorizerLambda', {
      environment,
      functionName: 'basicAuthorizer',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/handlers/basicAuthorizer.ts',
    });

  }
}
