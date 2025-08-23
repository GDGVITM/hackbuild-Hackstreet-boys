// services/jobSearch.js
import { RAPIDAPI_KEY } from '../config/apiKeys';

/**
 * @typedef {Object} JobPosting
 * @property {string} id
 * @property {string} title
 * @property {string} company
 * @property {string | undefined} location
 * @property {string | undefined} salaryText
 * @property {string} applyUrl
 * @property {string} source
 */

/**
 * @interface
 */
class JobProvider {
  /**
   * @param {string} query
   * @param {string} [location]
   * @param {number} [limit]
   * @returns {Promise<JobPosting[]>}
   */
  async search(query, location, limit = 5) {
    throw new Error("Method not implemented.");
  }
}

class JSearchProvider extends JobProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = 'https://jsearch.p.rapidapi.com/search';
    this.host = 'jsearch.p.rapidapi.com';
  }

  async search(query, location, limit = 5) {
    let url = `${this.baseUrl}?query=${encodeURIComponent(query)}&page=1&num_pages=1`;
    if (location) {
      url += `&location=${encodeURIComponent(location)}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.host,
        },
      });

      if (!response.ok) {
        throw new Error(`JSearch API failed with status ${response.status}`);
      }

      const { data } = await response.json();
      return data.slice(0, limit).map(job => ({
        id: job.job_id,
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city || job.job_country,
        applyUrl: job.job_apply_link,
        source: 'JSearch',
        salaryText: job.job_salary_range || job.job_salary_period,
      }));
    } catch (error) {
      console.error("JSearch search failed:", error);
      return []; // Return empty on error
    }
  }
}

class MockJobProvider extends JobProvider {
  constructor() {
    super();
    this.mockData = {
      'Software Engineer': [{
        id: 'mock-1',
        title: 'Frontend Engineer',
        company: 'Innovate Inc.',
        location: 'Remote',
        applyUrl: 'https://www.linkedin.com/jobs/',
        source: 'Mock'
      }, {
        id: 'mock-2',
        title: 'Backend Developer (Node.js)',
        company: 'Solutions Co.',
        location: 'New York, NY',
        applyUrl: 'https://www.indeed.com/',
        source: 'Mock'
      }, ],
      'Data Scientist': [{
        id: 'mock-3',
        title: 'Data Scientist, Machine Learning',
        company: 'Data Insights',
        location: 'San Francisco, CA',
        applyUrl: 'https://google.careers.com/',
        source: 'Mock'
      }, ],
    };
  }

  async search(query, location, limit = 5) {
    console.log(`Mock search for: "${query}"`);
    const jobKey = Object.keys(this.mockData).find(key => query.toLowerCase().includes(key.toLowerCase()));
    const results = jobKey ? this.mockData[jobKey] : this.mockData['Software Engineer']; // Fallback
    return Promise.resolve(results.slice(0, limit));
  }
}


/**
 * Factory function to get the appropriate job provider.
 * @returns {JobProvider} An instance of a JobProvider.
 */
export function getJobProvider() {
  const apiKey = RAPIDAPI_KEY;
  if (apiKey && apiKey !== "PASTE_YOUR_RAPIDAPI_KEY_HERE") {
    return new JSearchProvider(apiKey);
  }
  return new MockJobProvider();
}