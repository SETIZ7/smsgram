import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

const clientPromise: Promise<MongoClient> =
  global._mongoClientPromise ??
  (() => {
    const client = new MongoClient(uri);
    const promise = client.connect();
    global._mongoClientPromise = promise;
    return promise;
  })();

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
