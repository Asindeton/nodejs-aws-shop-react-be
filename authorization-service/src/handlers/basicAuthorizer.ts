import {Handler} from "aws-cdk-lib/aws-lambda";
import {APIGatewayTokenAuthorizerEvent, Callback, Context} from "aws-lambda";

export const handler:Handler = async (event: APIGatewayTokenAuthorizerEvent, _ctx: Context, callback: Callback) => {
    console.log('event', event);
    try {
        const token = event.authorizationToken;
        console.log('token', token);

        if(!token || !token.includes('Basic')) {
            throw new Error('Unauthorized');
        }

        const credentials = token.split(' ')[1];
        if(!credentials) {
            throw new Error('Unauthorized');
        }
        const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');

        const storedPassword = process.env[username]

        if(!storedPassword || storedPassword !== password) {
            throw new Error('Unauthorized');
        }
        return callback(null, generatePolicy('user', 'Allow', event.methodArn))
    }
    catch (e) {
        console.log('error', e);
        return callback(null, generatePolicy('user', 'Deny', event.methodArn))
    }
}

function generatePolicy(principalId:string, effect:string, resource:string) {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
    };
}