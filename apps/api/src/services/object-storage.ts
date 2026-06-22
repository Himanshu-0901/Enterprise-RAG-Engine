import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import type { ServerEnv } from "@rag-llm/shared";

type UploadObjectInput = {
  body: Uint8Array;
  contentType: string;
  key: string;
};

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

const ensureBucket = async (client: S3Client, bucket: string): Promise<void> => {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
};

export const uploadObject = async (
  env: ServerEnv,
  input: UploadObjectInput
): Promise<void> => {
  const client = createS3Client(env);

  await ensureBucket(client, env.S3_BUCKET);
  await client.send(
    new PutObjectCommand({
      Body: input.body,
      Bucket: env.S3_BUCKET,
      ContentType: input.contentType,
      Key: input.key
    })
  );
};

export const readTextObject = async (
  env: ServerEnv,
  key: string
): Promise<string> => {
  const client = createS3Client(env);
  const response = await client.send(
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key
    })
  );

  return response.Body?.transformToString() ?? "";
};

export const deleteObjectPrefix = async (
  env: ServerEnv,
  prefix: string
): Promise<number> => {
  const client = createS3Client(env);
  let continuationToken: string | undefined;
  let deleted = 0;

  await ensureBucket(client, env.S3_BUCKET);

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: env.S3_BUCKET,
        ContinuationToken: continuationToken,
        Prefix: prefix
      })
    );
    const objects =
      listed.Contents?.flatMap((item) => (item.Key ? [{ Key: item.Key }] : [])) ?? [];

    if (objects.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: env.S3_BUCKET,
          Delete: { Objects: objects, Quiet: true }
        })
      );
      deleted += objects.length;
    }

    continuationToken = listed.NextContinuationToken;
  } while (continuationToken);

  return deleted;
};
