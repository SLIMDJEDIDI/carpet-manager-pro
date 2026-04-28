const { put } = require('@vercel/blob');
require('dotenv').config();

async function testUpload() {
  console.log("Token present:", !!process.env.BLOB_READ_WRITE_TOKEN);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("ERROR: BLOB_READ_WRITE_TOKEN is missing from .env");
    return;
  }

  try {
    console.log("Attempting test upload...");
    const blob = await put('test-system.txt', 'Hello Vercel Blob', {
      access: 'public',
    });
    console.log("SUCCESS! Blob URL:", blob.url);
  } catch (e) {
    console.error("UPLOAD FAILED:", e);
  }
}

testUpload();
