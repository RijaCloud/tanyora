import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({});

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function decodeS3Key(rawKey) {
  return decodeURIComponent(String(rawKey || "").replace(/\+/g, " "));
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function stripExtension(key) {
  const dotIndex = key.lastIndexOf(".");
  return dotIndex > 0 ? key.slice(0, dotIndex) : key;
}

function shouldSkipKey(key) {
  const lower = key.toLowerCase();
  return lower.endsWith(".webp") || lower.endsWith(".avif");
}

function isImageContentType(contentType) {
  const value = String(contentType || "").toLowerCase();
  return value.startsWith("image/");
}

function isSvgContentType(contentType) {
  const value = String(contentType || "").toLowerCase();
  return value.includes("svg");
}

export const handler = async (event) => {
  const sourceBucket = required("MEDIA_UPLOAD_BUCKET");
  const destinationBucket = process.env.MEDIA_OPTIMIZED_BUCKET || sourceBucket;

  const webpQuality = Number.parseInt(process.env.MEDIA_WEBP_QUALITY || "82", 10);
  const avifQuality = Number.parseInt(process.env.MEDIA_AVIF_QUALITY || "52", 10);

  for (const record of event.Records || []) {
    const bucketName = record?.s3?.bucket?.name;
    const objectKey = decodeS3Key(record?.s3?.object?.key);

    if (!bucketName || !objectKey) {
      continue;
    }

    if (shouldSkipKey(objectKey)) {
      continue;
    }

    if (bucketName !== sourceBucket) {
      continue;
    }

    const head = await s3.send(
      new HeadObjectCommand({
        Bucket: sourceBucket,
        Key: objectKey,
      }),
    );

    if (!isImageContentType(head.ContentType) || isSvgContentType(head.ContentType)) {
      continue;
    }

    const object = await s3.send(
      new GetObjectCommand({
        Bucket: sourceBucket,
        Key: objectKey,
      }),
    );

    const inputBuffer = await streamToBuffer(object.Body);
    const normalized = sharp(inputBuffer, { failOn: "none" }).rotate();

    const baseKey = stripExtension(objectKey);
    const webpKey = `${baseKey}.webp`;
    const avifKey = `${baseKey}.avif`;

    const [webpBuffer, avifBuffer] = await Promise.all([
      normalized.clone().webp({ quality: webpQuality }).toBuffer(),
      normalized.clone().avif({ quality: avifQuality }).toBuffer(),
    ]);

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: destinationBucket,
          Key: webpKey,
          Body: webpBuffer,
          ContentType: "image/webp",
          CacheControl: "public,max-age=31536000,immutable",
        }),
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: destinationBucket,
          Key: avifKey,
          Body: avifBuffer,
          ContentType: "image/avif",
          CacheControl: "public,max-age=31536000,immutable",
        }),
      ),
    ]);
  }
};
