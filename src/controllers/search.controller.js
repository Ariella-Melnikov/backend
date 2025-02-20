import { scrapeProperties } from '../lib/scraper.js';
import { dbService } from '../services/db.service.js';

export async function searchProperties(req, res) {
  try {
    const { userId, searchParams } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log('🔎 Searching for:', searchParams);

    // 🏠 Start the web scraping process
    const newProperties = await scrapeProperties(searchParams);

    if (newProperties.length === 0) {
      return res.status(404).json({ error: "No properties found." });
    }

    // 🔄 Save or update search in Firestore (check existing data first)
    const searchId = await dbService.saveOrUpdateUserSearch(userId, searchParams, newProperties);

    // 🛠 Return updated properties to frontend
    return res.json({ searchId, properties: newProperties });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: "Failed to fetch property listings" });
  }
}

export async function saveSearch(req, res) {
  try {
    const { userId, searchParams, properties } = req.body;

    if (!userId || !searchParams || !properties) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    console.log("💾 Saving search for user:", userId);

    // 🔄 Save or update the search
    const searchId = await dbService.saveOrUpdateUserSearch(userId, searchParams, properties);

    return res.json({ success: true, searchId, properties });
  } catch (error) {
    console.error("❌ Error saving search:", error);
    res.status(500).json({ error: "Failed to save search results." });
  }
}

/**
 * ✅ Fetch user's saved searches from Firestore.
 */
export async function getSavedSearches(req, res) {
  try {
    const { userId } = req.user;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    console.log("📤 Fetching saved searches for user:", userId);

    const propertiesRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('properties')
      .orderBy('createdAt', 'desc'); // Latest first

    const snapshot = await propertiesRef.get();
    const savedProperties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.json({ searches: savedProperties });
  } catch (error) {
    console.error("❌ Error fetching saved searches:", error);
    return res.status(500).json({ error: "Failed to fetch saved searches." });
  }
}