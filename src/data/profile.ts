/** Facts about Brian that are not a job or a project. */

const DRIVE_FILE_ID = '1EzBz2eaRIJkU6yn8wHhpW0dpXrON6LP3';

export const profile = {
  name: 'Brian Park',
  title: 'Full Stack Software Engineer',
  location: 'London, Ontario, Canada',
  tagline:
    'I build and ship complete products: the mobile and web apps people use, and the APIs, data and cloud systems behind them.',
  description:
    'Brian Park is a Full Stack Software Engineer in London, Ontario, Canada. Shipped work across React Native, React, Django, Python and AWS, with what was built and the results.',
  email: 'brianpark1101@gmail.com',
  links: {
    linkedin: 'https://linkedin.com/in/brianpark1101',
    github: 'https://github.com/cheekane',
  },
  // The resume lives in Google Drive. Upload a new version of the same file
  // there and both the link and the preview on the site update by themselves.
  resume: {
    view: `https://drive.google.com/file/d/${DRIVE_FILE_ID}/view`,
    preview: `https://drive.google.com/file/d/${DRIVE_FILE_ID}/preview`,
  },
  about: [
    'I am a full stack software engineer based in London, Ontario. I graduated from Western University in April 2026 with a Bachelor of Science in Computer Science.',
    'I like owning a feature from end to end: the screen, the API behind it, the data it rests on, and the tests and deploy scripts that keep it working. I care about the unglamorous parts too, like deleting dead code, measuring before and after, and fixing the bug that only shows up in one time zone.',
    'Outside of work I play competitive games. I reached Radiant in Valorant, the highest rank, peaking at #450 in North America.',
  ],
  education: {
    school: 'Western University',
    degree: 'Bachelor of Science in Computer Science',
    start: '2021-09',
    end: '2026-04',
    honours: ["Dean's Honor List (2023 to 2025)", 'Western Scholarship of Distinction'],
  },
  skills: [
    {
      label: 'Languages',
      items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'C++', 'C', 'Bash', 'SQL', 'HTML/CSS'],
    },
    {
      label: 'Frontend',
      items: ['React', 'Next.js', 'React Native', 'Expo', 'Tailwind CSS', 'AWS Amplify'],
    },
    {
      label: 'Backend, cloud and data',
      items: [
        'Node.js',
        'Django',
        'FastAPI',
        'AWS (Lambda, API Gateway, DynamoDB, S3, Cognito, CloudFormation, CloudFront)',
        'PostgreSQL',
        'pgvector',
        'MySQL',
        'Polars',
        'Stripe',
      ],
    },
    {
      label: 'Tools and testing',
      items: ['Git', 'GitHub Actions', 'pytest', 'Jest', 'Maestro', 'Selenium'],
    },
  ],
} as const;
