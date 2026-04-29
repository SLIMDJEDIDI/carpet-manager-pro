const { put } = require('@vercel/blob');

async function test() {
  try {
    const blob = await put('test.txt', 'Hello Vercel Blob', {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    console.log('Success:', blob.url);
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

test();
