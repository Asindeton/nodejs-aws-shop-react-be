import {Handler} from "aws-cdk-lib/aws-lambda";

// @ts-ignore
export const handlerL:Handler = (event) => {
    console.log('event', event);
    try {
        const token = event.authorizationToken;

        if(!token || !token.includes('Basic')) {
            throw new Error('Unauthorized');
        }

        const credentials = token.split(' ')[1];
        const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');
        const storedPassword = process.env[username]

        if(!storedPassword || storedPassword !== password) {
            throw new Error('Unauthorized');
        }
        return generatePolicy('user', 'Allow', event.methodArn);
    }
    catch (e) {
        console.log('error', e);
        return generatePolicy('user', 'Deny', event.methodArn);
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