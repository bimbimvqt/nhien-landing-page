import { Client } from 'pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

async function migrateImage(s3Client, bucketName, baseUrl, folder, oldUrl) {
  if (!oldUrl || !oldUrl.includes('supabase.co')) {
    return oldUrl; // No migration needed
  }
  
  console.log(`Downloading: ${oldUrl}`);
  const response = await fetch(oldUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${oldUrl}: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  
  // Try to extract original name from URL or use a default
  let originalName = 'image';
  try {
    const urlParts = oldUrl.split('?')[0].split('/');
    originalName = urlParts[urlParts.length - 1];
  } catch (e) {
    // Ignore error
  }
  
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = originalName
    .replace(/\.[^/.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'upload';
    
  const uniqueId = crypto.randomUUID();
  const filePath = folder ? `${folder}/${uniqueId}-${safeName}.${extension}` : `${uniqueId}-${safeName}.${extension}`;

  console.log(`Uploading to MinIO as: ${filePath}`);
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filePath,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'max-age=3600',
  });

  await s3Client.send(command);

  return `${baseUrl}/${bucketName}/${filePath}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const s3Client = new S3Client({
    endpoint: process.env.CDN_S3_INTERNAL_ENDPOINT || process.env.CDN_S3_ENDPOINT,
    region: process.env.CDN_S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.CDN_S3_ACCESS_KEY || '',
      secretAccessKey: process.env.CDN_S3_SECRET_KEY || '',
    },
    forcePathStyle: process.env.CDN_S3_FORCE_PATH_STYLE === 'true',
  });

  const bucketName = process.env.CDN_S3_BUCKET || 'nhien-coffee';
  const baseUrl = process.env.CDN_PUBLIC_BASE_URL || 'https://cdn.skytruong.com';

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // 1. Migrate store_settings (hero_image_url)
    console.log('\n--- Migrating store_settings ---');
    const settingsRes = await client.query('SELECT id, hero_image_url FROM store_settings LIMIT 1');
    if (settingsRes.rows.length > 0) {
      const setting = settingsRes.rows[0];
      if (setting.hero_image_url && setting.hero_image_url.includes('supabase.co')) {
        try {
          const newUrl = await migrateImage(s3Client, bucketName, baseUrl, 'hero', setting.hero_image_url);
          await client.query('UPDATE store_settings SET hero_image_url = $1 WHERE id = $2', [newUrl, setting.id]);
          console.log('Successfully updated store_settings hero image.');
        } catch (err) {
          console.error(`Failed to migrate store_settings image:`, err);
        }
      } else {
        console.log('No migration needed for store_settings.hero_image_url');
      }
    }

    // 2. Migrate products (image_url)
    console.log('\n--- Migrating products ---');
    const productsRes = await client.query("SELECT id, name, image_url FROM products WHERE image_url LIKE '%supabase.co%'");
    console.log(`Found ${productsRes.rows.length} products to migrate.`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of productsRes.rows) {
      console.log(`\nMigrating product: ${product.name} (ID: ${product.id})`);
      try {
        const newUrl = await migrateImage(s3Client, bucketName, baseUrl, 'menu', product.image_url);
        await client.query('UPDATE products SET image_url = $1 WHERE id = $2', [newUrl, product.id]);
        console.log(`Successfully updated product: ${product.name}`);
        successCount++;
      } catch (err) {
        console.error(`Failed to migrate product ${product.id} (${product.name}):`, err);
        failCount++;
      }
    }
    
    console.log(`\n--- Migration Summary ---`);
    console.log(`Products successfully migrated: ${successCount}`);
    console.log(`Products failed: ${failCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

main();
