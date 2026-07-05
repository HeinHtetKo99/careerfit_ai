// Common skills used for local fallback extraction when Gemini is unavailable.
const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'FastAPI',
  'HTML', 'CSS', 'Tailwind CSS', 'SASS', 'GraphQL', 'REST API', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'CI/CD', 'Linux', 'Agile', 'Scrum',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'SQL', 'NoSQL',
  'Project Management', 'Leadership', 'Communication', 'Problem Solving', 'Teamwork',
  'Figma', 'UI/UX', 'Testing', 'Jest', 'Cypress', 'Webpack', 'Vite',
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSkillsFromText(text) {
  const found = new Set();
  const lower = text.toLowerCase();

  for (const skill of COMMON_SKILLS) {
    const pattern = new RegExp(`\\b${escapeRegex(skill.toLowerCase())}\\b`, 'i');
    if (pattern.test(lower)) {
      found.add(skill);
    }
  }

  return [...found];
}

module.exports = { COMMON_SKILLS, extractSkillsFromText };
