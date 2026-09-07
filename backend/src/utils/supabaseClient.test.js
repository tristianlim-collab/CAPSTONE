import { extractPublicId } from './supabaseClient.js';

describe('White-Box Unit Testing - Supabase Storage Helper Utility', () => {

  test('should extract storage path from full Supabase URL correctly', () => {
    const fullUrl = 'https://rkiexbxkicykuxykgznp.supabase.co/storage/v1/object/public/incident-photos/incidents/fire_scene_101.jpg';
    const path = extractPublicId(fullUrl);
    expect(path).toBe('incidents/fire_scene_101.jpg');
  });

  test('should handle short relative storage path without throwing exception', () => {
    const relativeUrl = 'incidents/photo_evidence.png';
    const path = extractPublicId(relativeUrl);
    expect(path).toBe('incidents/photo_evidence.png');
  });

  test('should return last two path elements for arbitrary CDN URL', () => {
    const cdnUrl = 'https://cdn.gaoirs.gov.ph/bucket/subfolder/evidence_09.jpg';
    const path = extractPublicId(cdnUrl);
    expect(path).toBe('subfolder/evidence_09.jpg');
  });

});
