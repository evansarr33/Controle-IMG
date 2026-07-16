/**
 * generate-manifest.js
 * -------------------------------------------------------------
 * À exécuter EN LOCAL (jamais dans le navigateur / jamais publié).
 * Lit les identifiants Cloudinary depuis .env (voir .env.example),
 * liste les images d'un dossier Cloudinary via l'Admin API,
 * et écrit un manifeste PUBLIC (aucun secret dedans) dans
 * data/images.json, que le site statique va simplement lire.
 *
 * Usage :
 *   npm install
 *   cp .env.example .env   puis renseigner les 3 valeurs
 *   node scripts/generate-manifest.js [dossier_cloudinary]
 *
 * Relancer ce script à chaque fois que de nouvelles images sont
 * ajoutées sur Cloudinary, puis commit/push data/images.json.
 * -------------------------------------------------------------
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

const folder = process.argv[2] || process.env.CLOUDINARY_FOLDER || '';

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Erreur : CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET manquants dans .env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

async function fetchAllResources() {
  let resources = [];
  let nextCursor = undefined;

  do {
    const params = {
      type: 'upload',
      resource_type: 'image',
      max_results: 500,
      next_cursor: nextCursor,
    };
    if (folder) params.prefix = folder;

    const res = await cloudinary.api.resources(params);
    resources = resources.concat(res.resources);
    nextCursor = res.next_cursor;
  } while (nextCursor);

  return resources;
}

function buildManifestEntry(resource) {
  const thumbUrl = cloudinary.url(resource.public_id, {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
    version: resource.version,
  });

  return {
    public_id: resource.public_id,
    url: resource.secure_url,
    thumb_url: thumbUrl,
    format: resource.format,
    width: resource.width,
    height: resource.height,
    bytes: resource.bytes,
    created_at: resource.created_at,
  };
}

(async () => {
  console.log(`Récupération des images Cloudinary${folder ? ` (dossier: ${folder})` : ''}…`);
  const resources = await fetchAllResources();
  console.log(`${resources.length} image(s) trouvée(s).`);

  const manifest = resources.map(buildManifestEntry);

  const outPath = path.join(__dirname, '..', 'data', 'images.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifeste écrit dans ${outPath}`);
})().catch(err => {
  console.error('Échec de la génération du manifeste :', err.message || err);
  process.exit(1);
});
