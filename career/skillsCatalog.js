// career/skillsCatalog.js

/**
 * @typedef {Record<string, string[]>} JobCatalog
 * @typedef {Record<string, string[]>} SynonymMap
 */

/** @type {JobCatalog} */
export const jobsCatalog = {
  "Software Engineer": ["JavaScript", "Python", "SQL", "Git", "REST", "Docker"],
  "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Git"],
  "Backend Developer": ["Node.js", "Python", "SQL", "REST", "Docker", "Kubernetes"],
  "Mobile Developer": ["JavaScript", "React Native", "Swift", "Kotlin", "Git"],
  "Data Scientist": ["Python", "SQL", "Pandas", "Scikit-learn", "TensorFlow/PyTorch", "Statistics"],
  "Data Analyst": ["SQL", "Python", "Pandas", "Excel", "Tableau"],
  "ML Engineer": ["Python", "TensorFlow/PyTorch", "Scikit-learn", "Docker", "Kubernetes", "AWS/GCP/Azure"],
  "Cloud/DevOps Engineer": ["AWS/GCP/Azure", "Docker", "Kubernetes", "CI/CD", "Linux", "Terraform"],
  "Cybersecurity Analyst": ["Networking", "Linux", "Python", "Security Auditing", "SIEM"],
  "UI/UX Designer": ["Figma", "Sketch", "Wireframing", "Prototyping", "User Research"],
  "Product Manager": ["Agile", "Roadmapping", "User Research", "Data Analysis", "JIRA"],
  "Business Analyst": ["SQL", "Excel", "Data Analysis", "Requirements Gathering", "Tableau"],
  "Digital Marketer": ["SEO", "SEM", "Google Analytics", "Content Marketing", "Social Media Marketing"],
};

/** @type {SynonymMap} */
export const skillSynonyms = {
  js: ["javascript"],
  py: ["python"],
  ml: ["machine learning"],
  "react.js": ["react"],
  "node js": ["node.js"],
  "machine learning": ["tensorflow/pytorch", "scikit-learn"],
  "cloud": ["aws/gcp/azure"],
  "devops": ["docker", "kubernetes", "ci/cd"],
  "ui": ["figma", "sketch"],
  "ux": ["user research", "wireframing"],
  "data science": ["python", "pandas", "statistics"],
};

/**
 * Normalizes a list of raw skills by trimming, lowercasing, expanding synonyms, and removing duplicates.
 * @param {string[]} rawSkills - An array of raw skill strings.
 * @returns {string[]} A new array of normalized, unique skills.
 */
export function normalizeSkills(rawSkills) {
  const normalized = new Set();
  rawSkills.forEach(rawSkill => {
    const skill = rawSkill.trim().toLowerCase();
    if (skill) {
      normalized.add(skill);
      const synonyms = skillSynonyms[skill] || [];
      synonyms.forEach(syn => normalized.add(syn));
    }
  });
  return Array.from(normalized);
}

/**
 * Matches user skills against a job catalog to find relevant roles.
 * @param {string[]} userSkills - An array of normalized user skills.
 * @param {JobCatalog} [catalog=jobsCatalog] - The job catalog to match against.
 * @returns {Array<{job: string; overlap: string[]; missing: string[]; score: number}>} A sorted array of matched jobs.
 */
export function matchJobs(userSkills, catalog = jobsCatalog) {
  const userSkillSet = new Set(userSkills);
  const matches = Object.entries(catalog).map(([job, requiredSkills]) => {
    const requiredSet = new Set(requiredSkills.map(s => s.toLowerCase()));
    const overlap = [...requiredSet].filter(skill => userSkillSet.has(skill));
    const missing = [...requiredSet].filter(skill => !userSkillSet.has(skill));
    const score = requiredSet.size > 0 ? overlap.length / requiredSet.size : 0;

    return { job, overlap, missing, score };
  });

  return matches.filter(m => m.score > 0).sort((a, b) => b.score - a.score);
}

/**
 * Computes the skill gap for a target job based on user skills.
 * @param {string[]} userSkills - An array of normalized user skills.
 * @param {string} targetJob - The name of the target job.
 * @returns {{required: string[]; missing: string[]} | null} An object with required and missing skills, or null if the job is not found.
 */
export function getSkillGap(userSkills, targetJob) {
  const required = jobsCatalog[targetJob];
  if (!required) {
    return null;
  }
  const userSkillSet = new Set(userSkills.map(s => s.toLowerCase()));
  const missing = required.filter(skill => !userSkillSet.has(skill.toLowerCase()));

  return { required, missing };
}