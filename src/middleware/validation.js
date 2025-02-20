import { z } from 'zod';

const SearchParamsSchema = z.object({
  city: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minRooms: z.number().optional(),
  maxRooms: z.number().optional(),
  listingType: z.enum(['sale', 'rent']).optional()
});

export function validateSearchParams(req, res, next) {
  try {
    const validated = SearchParamsSchema.parse(req.body);
    req.body = validated; // TODO: fix this
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid search parameters' });
  }
}