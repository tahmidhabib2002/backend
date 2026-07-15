const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const memberRoutes = require('./members');
const noticeRoutes = require('./notices');
const newsRoutes = require('./news');
const galleryRoutes = require('./gallery');
const cmsRoutes = require('./cms');

const Member = require('../models/Member');
const Notice = require('../models/Notice');
const News = require('../models/News');
const Event = require('../models/Event');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/members', memberRoutes);
router.use('/notices', noticeRoutes);
router.use('/news', newsRoutes);
router.use('/gallery', galleryRoutes);
router.use('/cms', cmsRoutes);

// Public counters for the homepage. Never returns PII.
router.get('/stats', async (req, res, next) => {
  try {
    const [members, notices, news, events] = await Promise.all([
      Member.countDocuments({ status: 'Active' }),
      Notice.countDocuments(),
      News.countDocuments(),
      Event.countDocuments()
    ]);
    res.status(200).json({ success: true, data: { members, notices, news, events } });
  } catch (err) { next(err); }
});

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', time: new Date().toISOString() });
});

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const members = await Member.find({ status: 'Active' }).select('slug updatedAt');
    const baseUrl = process.env.PUBLIC_SITE_URL || 'https://bddpa-bhola.org/#';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    const staticPages = ['/', '/about', '/members', '/executive', '/notice', '/gallery', '/contact', '/verification'];
    staticPages.forEach(page => {
      xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    members.forEach(m => {
      const lastmod = m.updatedAt ? m.updatedAt.toISOString().split('T')[0] : '';
      xml += `  <url>\n    <loc>${baseUrl}/members/${m.slug}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err) { next(err); }
});

router.get('/robots.txt', (req, res) => {
  const site = process.env.PUBLIC_SITE_URL || 'https://bddpa-bhola.org';
  const robots = `User-agent: *\nAllow: /\nDisallow: /api/v1/admin/\nDisallow: /#/admin/\n\nSitemap: ${site}/api/v1/sitemap.xml`;
  res.header('Content-Type', 'text/plain');
  res.status(200).send(robots);
});

module.exports = router;
