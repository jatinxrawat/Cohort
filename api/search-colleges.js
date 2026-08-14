import colleges from './colleges.json';

const POPULAR_COLLEGES = [
  { name: 'Delhi University', university: 'Delhi University', state: 'Delhi', district: 'Delhi', location: 'Delhi' },
  { name: 'IIT Bombay', university: 'Indian Institute of Technology, Bombay', state: 'Maharashtra', district: 'Mumbai', location: 'Mumbai, Maharashtra' },
  { name: 'IIT Delhi', university: 'Indian Institute of Technology, Delhi', state: 'Delhi', district: 'Delhi', location: 'Delhi' },
  { name: 'BITS Pilani', university: 'Birla Institute of Technology and Science', state: 'Rajasthan', district: 'Jhunjhunu', location: 'Pilani, Rajasthan' },
  { name: 'Christ University', university: 'Christ University', state: 'Karnataka', district: 'Bangalore', location: 'Bangalore, Karnataka' },
  { name: 'VIT Vellore', university: 'VIT Vellore', state: 'Tamil Nadu', district: 'Vellore', location: 'Vellore, Tamil Nadu' },
  { name: 'Manipal Academy of Higher Education', university: 'MAHE', state: 'Karnataka', district: 'Udupi', location: 'Manipal, Karnataka' },
  { name: 'Ashoka University', university: 'Ashoka University', state: 'Haryana', district: 'Sonipat', location: 'Sonipat, Haryana' },
  { name: 'SRM Institute of Science and Technology', university: 'SRM University', state: 'Tamil Nadu', district: 'Chennai', location: 'Chennai, Tamil Nadu' },
  { name: 'Delhi School of Economics', university: 'Delhi University', state: 'Delhi', district: 'Delhi', location: 'Delhi' }
];

export default async function handler(req, res) {
  try {
    const { q } = req.query || {};
    if (!q) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(POPULAR_COLLEGES);
    }

    const cleanQuery = q.trim().toLowerCase();
    if (cleanQuery.length < 2) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(POPULAR_COLLEGES);
    }

    const results = [];
    const cleanIdRegex = /\s*\(Id:\s*[^)]+\)/gi;

    for (let i = 0; i < colleges.length; i++) {
      const item = colleges[i];
      const collegeNameRaw = item.college || '';
      const universityNameRaw = item.university || '';

      const collegeName = collegeNameRaw.replace(cleanIdRegex, '').trim();
      const universityName = universityNameRaw.replace(cleanIdRegex, '').trim();

      const state = item.state || '';
      const district = item.district || '';

      if (
        collegeName.toLowerCase().includes(cleanQuery) ||
        universityName.toLowerCase().includes(cleanQuery) ||
        state.toLowerCase().includes(cleanQuery) ||
        district.toLowerCase().includes(cleanQuery)
      ) {
        results.push({
          name: collegeName,
          university: universityName,
          state,
          district,
          location: district ? `${district}, ${state}` : state
        });

        if (results.length >= 50) {
          break;
        }
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).json(results);
  } catch (error) {
    console.error('Search colleges error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
