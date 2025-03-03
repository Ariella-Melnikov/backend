import puppeteer from 'puppeteer';
import { z } from 'zod';

const PropertySchema = z.object({
  address: z.string().optional().default("Unknown"),
  city: z.string().optional().default("Unknown"),
  price: z.number().optional().default(0),
  rooms: z.number().optional().default(0),
  size_sqm: z.number().nullable().optional(),
  has_elevator: z.boolean().optional(),
  has_parking: z.boolean().optional(),
  has_saferoom: z.boolean().optional(),
  allows_pets: z.boolean().optional(),
  is_furnished: z.boolean().optional(),
  listing_type: z.enum(['sale', 'rent']).optional().default("rent"),
  images: z.array(z.string()).optional(),
  source_url: z.string(),
  source_site: z.string()
});

const scraperService = {
  async scrapeProperties(listingUrls) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const properties = [];

    try {
      if (listingUrls.length === 0) {
        console.log('❌ No listings found.');
        return [];
      }

      for (const url of listingUrls) {
        console.log('🌍 Scraping:', url);

        try {
          if (!url.startsWith("http")) {
            console.log('⚠️ Skipping invalid URL:', url);
            continue;
          }

          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

          // **✅ Wait for key content to load**
          await page.waitForTimeout(3000);

          // **🔍 Extract Property Information**
          const property = await page.evaluate(() => {
            const getText = (selector) => document.querySelector(selector)?.innerText.trim() || null;
            const getNumber = (selector) => {
              const text = getText(selector);
              return text ? parseInt(text.replace(/[^\d]/g, ''), 10) || null : null;
            };
            const getBoolean = (selector) => !!document.querySelector(selector);
            const getImages = (selector) => Array.from(document.querySelectorAll(selector)).map(img => img.src).slice(0, 5);

            return {
              address: getText('.address, .main_title, .listing-title') || "Unknown",
              city: getText('.city, .subtitle, .listing-location') || "Unknown",
              price: getNumber('.price, .listing-price') || 0,
              rooms: getNumber('.rooms, .listing-rooms') || 0,
              size_sqm: getNumber('.size, .listing-size') || null,
              has_parking: getBoolean('.parking-icon, .has-parking'),
              has_elevator: getBoolean('.elevator-icon, .has-elevator'),
              listing_type: getText('.listing-type')?.toLowerCase().includes("sale") ? "sale" : "rent",
              images: getImages('.listing-image img, .img img'),
              source_url: window.location.href,
              source_site: window.location.hostname
            };
          });

          // **✅ Validate and Store**
          const validatedProperty = PropertySchema.safeParse(property);
          if (validatedProperty.success) {
            properties.push(validatedProperty.data);
          } else {
            console.error(`❌ Validation failed for ${url}:`, validatedProperty.error.errors);
          }

        } catch (scrapeError) {
          console.error('❌ Scraping failed for:', url, scrapeError);
        }
      }
    } catch (error) {
      console.error('❌ Scraping error:', error);
    } finally {
      await browser.close();
    }

    return properties;
  }
};

export default scraperService;