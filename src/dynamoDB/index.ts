import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { IProduct, IStock } from '../type/index';

const client = new DynamoDBClient({});
const dynamoDbDocClient = DynamoDBDocumentClient.from(client);

export const scanTable = async (tableName: string): Promise<any[]> => {
  try {
    const data = await dynamoDbDocClient.send(new ScanCommand({ TableName: tableName }));
    return data.Items || [];
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getAllData = async (table1: string, table2: string) => {
  const itemsFromProductTable = await scanTable(table1);
  const itemsFromStockTable = await scanTable(table2);

  return itemsFromProductTable?.map((item) => {
    const stocks = { ...itemsFromStockTable?.find((stock) => stock.product_id === item.id) };
    const { product_id: _, ...stocksWithoutId } = stocks;

    return { ...item, ...stocksWithoutId };
  });
};

export const getRecord = async (tableName: string, key: string, id: string) => {
  const params = {
    TableName: tableName,
    Key: {
      [key]: id,
    },
  };

  try {
    const data = await dynamoDbDocClient.send(new GetCommand(params));
    return data.Item;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const createProduct = async (product: IProduct, stock: IStock, productTable: string, stockTable: string) => {
  try {
    await dynamoDbDocClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: productTable,
              Item: product,
            },
          },
          {
            Put: {
              TableName: stockTable,
              Item: stock,
            },
          },
        ],
      }),
    );
  } catch (err) {
    console.log(err);
    throw err;
  }
};
