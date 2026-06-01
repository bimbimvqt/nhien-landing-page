import { S3Client, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

async function main() {
  const s3Client = new S3Client({
    endpoint: process.env.CDN_S3_ENDPOINT || 'https://cdn.skytruong.com',
    region: process.env.CDN_S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.CDN_S3_ACCESS_KEY || '',
      secretAccessKey: process.env.CDN_S3_SECRET_KEY || '',
    },
    forcePathStyle: process.env.CDN_S3_FORCE_PATH_STYLE === 'true',
  });

  const bucketName = process.env.CDN_S3_BUCKET || 'nhien-coffee';

  const bucketPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`]
      }
    ]
  };

  try {
    console.log(`Setting public policy for bucket: ${bucketName}...`);
    const command = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy),
    });
    
    await s3Client.send(command);
    console.log("Successfully set bucket policy to public-read.");
  } catch (err) {
    console.error("Error setting bucket policy:", err);
  }
}

main();
