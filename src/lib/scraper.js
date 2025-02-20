import puppeteer from 'puppeteer';
import { z } from 'zod';
import { googleSearchService } from '../services/googleSearch.service.js'; 

const PropertySchema = z.object({
  address: z.string(),
  city: z.string(),
  price: z.number(),
  rooms: z.number(),
  size_sqm: z.number().optional(),
  has_elevator: z.boolean().optional(),
  has_parking: z.boolean().optional(),
  has_saferoom: z.boolean().optional(),
  allows_pets: z.boolean().optional(),
  is_furnished: z.boolean().optional(),
  listing_type: z.enum(['sale', 'rent']),
  images: z.array(z.string()).optional(),
  source_url: z.string(),
  source_site: z.string()
});

export async function scrapeProperties(searchParams) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const properties = [];

  try {
    const listingUrls = await googleSearchService.fetchListingUrls(searchParams);

    if (listingUrls.length === 0) {
      console.log('❌ No listings found.');
      return [];
    }

    for (const url of listingUrls) {
      console.log('🌍 Scraping:', url);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        let property;
        if (url.includes('yad2.co.il')) {
          property = await page.evaluate(() => ({
            address: document.querySelector('.main_title')?.innerText || 'Unknown',
            city: document.querySelector('.subtitle')?.innerText || 'Unknown',
            price: parseInt(document.querySelector('.price')?.innerText.replace(/[^\d]/g, ''), 10) || 0,
            rooms: parseInt(document.querySelector('.info .room')?.innerText, 10) || 0,
            size_sqm: parseInt(document.querySelector('.info .size')?.innerText, 10) || null,
            has_parking: !!document.querySelector('.parking-icon'),
            has_elevator: !!document.querySelector('.elevator-icon'),
            listing_type: 'rent',
            images: Array.from(document.querySelectorAll('.img img')).map(img => img.src),
            source_url: window.location.href,
            source_site: 'yad2.co.il'
          }));
        } else if (url.includes('madlan.co.il')) {
          property = await page.evaluate(() => ({
            address: document.querySelector('.listing-title')?.innerText || 'Unknown',
            city: document.querySelector('.listing-location')?.innerText || 'Unknown',
            price: parseInt(document.querySelector('.listing-price')?.innerText.replace(/[^\d]/g, ''), 10) || 0,
            rooms: parseInt(document.querySelector('.listing-rooms')?.innerText, 10) || 0,
            size_sqm: parseInt(document.querySelector('.listing-size')?.innerText, 10) || null,
            has_parking: !!document.querySelector('.parking-icon'),
            has_elevator: !!document.querySelector('.elevator-icon'),
            listing_type: 'rent',
            images: Array.from(document.querySelectorAll('.listing-image img')).map(img => img.src),
            source_url: window.location.href,
            source_site: 'madlan.co.il'
          }));
        } else {
          console.log('⚠️ Unsupported site:', url);
          continue;
        }

        const validatedProperty = PropertySchema.parse(property);
        properties.push(validatedProperty);

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