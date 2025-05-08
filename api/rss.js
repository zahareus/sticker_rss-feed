import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbmeslzlbsolkxnvesqb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWVzbHpsYnNvbGt4bnZlc3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwODcxMzYsImV4cCI6MjA2MDY2MzEzNn0.cu-Qw0WoEslfKXXCiMocWFg6Uf1sK_cQYcyP2mT0-Nw'
);

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

  const rssItems = data
    .map((item) => `
      <item>
        <title>New sticker from ${item.clubs.name}</title>
        <description><![CDATA[
          <img src="${item.image_url}" alt="${item.clubs.name}" width="300"/><br/>
          ${item.clubs.name}<br/>
          ✅ ${item.location}<br/>
          ${item.description}<br/>
          #️⃣ ${item.clubs.media}
        ]]></description>
        <pubDate>${new Date(item.created_at).toUTCString()}</pubDate>
        <guid>${item.id}</guid>
      </item>
    `)
    .join('');

  const rss = `<?xml version="1.0"?>
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
