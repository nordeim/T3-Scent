// prisma/seed.ts
import { PrismaClient, QuizQuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Seed Quiz Questions ---
  const quizQuestionsData = [
    {
      id: 'clwzquiz0001', // Use fixed IDs for consistency if you re-run seed
      question: 'What type of scents are you usually drawn to?',
      description: 'Think about perfumes, candles, or natural smells you enjoy.',
      order: 1,
      type: QuizQuestionType.MULTIPLE_CHOICE_TEXT,
      options: [
        { id: 'opt001', label: 'Fresh & Clean (Citrus, Aquatic, Green)', tags: ['citrus', 'fresh', 'aquatic', 'green', 'uplifting'] },
        { id: 'opt002', label: 'Warm & Cozy (Vanilla, Amber, Spices)', tags: ['warm', 'cozy', 'vanilla', 'amber', 'spicy', 'comforting'] },
        { id: 'opt003', label: 'Earthy & Woody (Sandalwood, Cedar, Patchouli)', tags: ['earthy', 'woody', 'grounding', 'sandalwood', 'cedarwood'] },
        { id: 'opt004', label: 'Floral & Sweet (Rose, Jasmine, Lavender)', tags: ['floral', 'sweet', 'rose', 'jasmine', 'lavender', 'calming'] },
      ],
    },
    {
      id: 'clwzquiz0002',
      question: 'What mood are you hoping to cultivate?',
      description: 'Select the primary feeling you want your aromatherapy to support.',
      order: 2,
      type: QuizQuestionType.SINGLE_CHOICE_TEXT,
      options: [
        { id: 'opt005', label: 'Relaxation & Calm', tags: ['calming', 'relaxing', 'stress-relief', 'lavender', 'chamomile'] },
        { id: 'opt006', label: 'Energy & Focus', tags: ['energizing', 'focus', 'uplifting', 'citrus', 'peppermint', 'rosemary'] },
        { id: 'opt007', label: 'Comfort & Grounding', tags: ['comforting', 'grounding', 'woody', 'vanilla', 'sandalwood'] },
        { id: 'opt008', label: 'Uplift & Joy', tags: ['joyful', 'uplifting', 'happy', 'citrus', 'floral', 'bergamot'] },
      ],
    },
    {
      id: 'clwzquiz0003',
      question: 'Which of these images best represents your ideal ambiance?',
      description: 'Choose the one that resonates most with you.',
      order: 3,
      type: QuizQuestionType.SINGLE_CHOICE_IMAGE, // Client needs to render images for these options
      options: [
        { id: 'opt009', label: 'Sunlit Forest Path', imageUrl: '/images/quiz/forest.jpg', tags: ['woody', 'green', 'natural', 'grounding'] },
        { id: 'opt010', label: 'Cozy Fireside Reading', imageUrl: '/images/quiz/fireside.jpg', tags: ['warm', 'cozy', 'comforting', 'spicy'] },
        { id: 'opt011', label: 'Blooming Spring Garden', imageUrl: '/images/quiz/garden.jpg', tags: ['floral', 'fresh', 'sweet', 'uplifting'] },
        { id: 'opt012', label: 'Ocean Breeze at Dawn', imageUrl: '/images/quiz/ocean.jpg', tags: ['fresh', 'aquatic', 'clean', 'energizing'] },
      ],
    },
    // Add more questions as needed
  ];

  for (const qData of quizQuestionsData) {
    await prisma.quizQuestion.upsert({
      where: { id: qData.id },
      update: {
        ...qData,
        options: qData.options as any, // Prisma expects JsonValue for Json type
      },
      create: {
        ...qData,
        options: qData.options as any, // Prisma expects JsonValue for Json type
      },
    });
  }
  console.log('Quiz questions seeded.');

  // --- Seed other data if necessary (e.g., initial admin user, site settings, categories) ---
  // Example: Default Site Settings
  await prisma.siteSettings.upsert({
    where: { id: "global_settings" },
    update: {}, // No specific updates, just ensure it exists
    create: {
      id: "global_settings",
      siteName: "The Scent",
      // Add other default settings from your SiteSettings model
    },
  });
  console.log('Default site settings ensured.');


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });