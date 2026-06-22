import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ServerEnv } from "@rag-llm/shared";

const createS3Client = (env: ServerEnv): S3Client =>
  new S3Client({
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY
    },
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: true,
    region: env.S3_REGION
  });

export const readTextObject = async (
  env: ServerEnv,
  key: string
): Promise<string> => {
  const client = createS3Client(env);
  const response = await client.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
  );

  if (!response.Body) {
    throw new Error("Stored object is empty");
  }

  return response.Body.transformToString();
};

export const readObjectBytes = async (
  env: ServerEnv,
  key: string
): Promise<Uint8Array> => {
  const client = createS3Client(env);
  const response = await client.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
  );

  if (!response.Body) {
    throw new Error("Stored object is empty");
  }

  return response.Body.transformToByteArray();
};
