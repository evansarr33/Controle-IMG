const fs = require('fs');
const path = require('path');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER = '',
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Variables Cloudinary manquantes. Renseigne CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const outputPath = path.join(process.cwd(), 'data', 'images.json');

function buildSearchExpression() {
  const base = 'resource_type:image';
  const folder = CLOUDINARY_FOLDER.trim();
  if (!folder) return base;
  const normalized = folder.replace(/^\/+|\/+$/g, '');
  return `${base} AND folder:${normalized}`;
}

function thumbUrl(publicId, format) {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    type: 'upload',
    format,
    transformation: [
      { width: 240, height: 240, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
}

async function fetchAllImages() {
  const resources = [];
  let nextCursor;

  do {
    const result = await cloudinary.search
      .expression(buildSearchExpression())
      .sort_by('public_id', 'asc')
      .max_results(500)
      .next_cursor(nextCursor)
      .execute();

    resources.push(...(result.resources || []));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  return resources.map((resource) => ({
    public_id: resource.public_id,
    url: resource.secure_url,
    thumb_url: thumbUrl(resource.public_id, resource.format),
    format: resource.format,
    width: resource.width,
    height: resource.height,
  }));
}

fetchAllImages()
  .then((images) => {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(images, null, 2)}\n`);
    console.log(`${images.length} image(s) écrite(s) dans ${outputPath}`);
  })
  .catch((error) => {
    console.error('Impossible de générer le manifeste Cloudinary :');
    console.error(error);
    process.exit(1);
  });
