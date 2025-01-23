import { db } from '../config/firebase.config.js';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { scrapeProperties } from '../lib/scraper.js';

export async function searchProperties(req, res, next) {
  try {
    const searchParams = req.body;
    const userId = req.user?.uid;

    // Check cache first
    const searchResultsRef = collection(db, 'search_results');
    const cacheQuery = query(
      searchResultsRef,
      where('search_params', '==', searchParams),
      where('expires_at', '>', Timestamp.now())
    );

    const cachedResults = await getDocs(cacheQuery);
    if (!cachedResults.empty) {
      const cachedData = cachedResults.docs[0].data();
      return res.json(cachedData.results);
    }

    // If not in cache, scrape new data
    const properties = await scrapeProperties(searchParams);

    // Store in cache if user is authenticated and properties were found
    if (properties.length > 0 && userId) {
      await addDoc(searchResultsRef, {
        search_params: searchParams,
        results: properties,
        user_id: userId,
        created_at: Timestamp.now(),
        expires_at: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours from now
      });
    }

    res.json(properties);
  } catch (error) {
    next(error);
  }
}

export async function saveSearch(req, res, next) {
  try {
    const { name, searchParams } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const savedSearchesRef = collection(db, 'saved_searches');
    const docRef = await addDoc(savedSearchesRef, {
      name,
      search_params: searchParams,
      user_id: userId,
      created_at: Timestamp.now()
    });

    const savedSearch = {
      id: docRef.id,
      name,
      search_params: searchParams,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    res.json(savedSearch);
  } catch (error) {
    next(error);
  }
}

export async function getSavedSearches(req, res, next) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const savedSearchesRef = collection(db, 'saved_searches');
    const q = query(
      savedSearchesRef,
      where('user_id', '==', userId),
      where('created_at', '<=', Timestamp.now())
    );

    const querySnapshot = await getDocs(q);
    const savedSearches = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at.toDate().toISOString()
    }));

    res.json(savedSearches);
  } catch (error) {
    next(error);
  }
}