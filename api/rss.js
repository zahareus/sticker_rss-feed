import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// HTML <br/> + LF код — одночасно перенос і в HTML, і в plain text
const BREAK = '<br/>&#x0A;';

const escapeXml = (str = '') =>
  str.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&apos;');

const normalizeText = (str = '') =>
  String(str)
    .replace(/\r/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

const buildDescription = (item) => {
  const lines = [
    item.clubs?.name,
    `✅ ${item.location}`,
    normalizeText(item.description).replace(/\n/g, BREAK),
    `#️⃣ ${item.clubs?.media}`
  ].filter(Boolean);

  // об’єднання рядків через універсальний перенос
  return lines.join(BREAK);
};

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('stickers')
    .select('id, created_at, image_url, location, description, clubs(name, media)')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    res.status(500).send('Supabase error');
    return;
  }

  const rssItems = data.map((item) => {
    const title = escapeXml(item.clubs?.name || '');
    const desc = buildDescription(item);

    return `<item>
<title>${title}</title>
<description><![CDATA[${desc}]]></description>
<pubDate>${new Date(item.created_at).toUTCString()}</pubDate>
<guid>${item.id}</guid>
<enclosure url="${item.image_url}" type="image/jpeg" />
</item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>New Stickers</title>
<link>https://x.com/StickerHunting</link>
<description>Latest football sticker finds</description>
${rssItems}
</channel>
</rss>`;

  res.setHeader('Content-Type', 'application/rss+xml');
  res.status(200).send(rss);
}
