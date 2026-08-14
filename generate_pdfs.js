import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

function createPdfFromMarkdown(title, subtitle, sections, outputPath) {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true,
  });

  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Header Banner
  doc
    .rect(0, 0, 595.28, 110)
    .fill('#0F766E'); // Teal primary color

  doc
    .fillColor('#FFFFFF')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(title, 50, 30, { align: 'center', width: 495.28 });

  doc
    .fillColor('#D4A017') // Gold subtitle
    .fontSize(12)
    .font('Helvetica')
    .text(subtitle, 50, 65, { align: 'center', width: 495.28 });

  doc
    .fillColor('#CCFBF1')
    .fontSize(9)
    .text('Rihlat Da\'eyah Educational Platform System Document', 50, 85, { align: 'center', width: 495.28 });

  doc.moveDown(4);

  let currentY = 130;

  sections.forEach((sec, idx) => {
    // Check if we need a new page
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    // Section Header Box
    doc
      .rect(50, currentY, 495.28, 26)
      .fill('#F0FDF4');

    doc
      .rect(50, currentY, 4, 26)
      .fill('#0F766E');

    doc
      .fillColor('#0F766E')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(`${idx + 1}. ${sec.title}`, 62, currentY + 6, { width: 470 });

    currentY += 36;

    if (sec.content) {
      doc
        .fillColor('#334155')
        .fontSize(10)
        .font('Helvetica');

      const lines = sec.content.split('\n');
      lines.forEach((line) => {
        if (currentY > 730) {
          doc.addPage();
          currentY = 50;
        }

        if (line.startsWith('### ')) {
          doc
            .fillColor('#1E293B')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(line.replace('### ', ''), 50, currentY);
          currentY += 18;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          doc
            .fillColor('#0F766E')
            .text('• ', 60, currentY, { continued: true })
            .fillColor('#334155')
            .font('Helvetica')
            .fontSize(9.5)
            .text(line.substring(2), { width: 470 });
          currentY += 15;
        } else if (line.trim().length > 0) {
          doc
            .fillColor('#334155')
            .font('Helvetica')
            .fontSize(9.5)
            .text(line, 50, currentY, { width: 495.28, align: 'left' });
          currentY += Math.ceil(line.length / 80) * 13 + 4;
        } else {
          currentY += 6;
        }
      });

      currentY += 12;
    }

    if (sec.table) {
      if (currentY > 650) {
        doc.addPage();
        currentY = 50;
      }

      // Draw Table Headers
      const headers = sec.table.headers;
      const colWidth = 495.28 / headers.length;

      doc
        .rect(50, currentY, 495.28, 20)
        .fill('#0F766E');

      headers.forEach((h, hIdx) => {
        doc
          .fillColor('#FFFFFF')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(h, 50 + hIdx * colWidth + 5, currentY + 5, { width: colWidth - 10 });
      });

      currentY += 20;

      sec.table.rows.forEach((row, rIdx) => {
        if (currentY > 730) {
          doc.addPage();
          currentY = 50;
        }

        const bgColor = rIdx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
        doc
          .rect(50, currentY, 495.28, 18)
          .fill(bgColor);

        row.forEach((cell, cIdx) => {
          doc
            .fillColor('#334155')
            .fontSize(8.5)
            .font('Helvetica')
            .text(cell, 50 + cIdx * colWidth + 5, currentY + 4, { width: colWidth - 10 });
        });

        currentY += 18;
      });

      currentY += 15;
    }
  });

  // Footer with Page Numbers
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc
      .fillColor('#94A3B8')
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Rihlat Da'eyah Documentation • Page ${i + 1} of ${totalPages}`,
        50,
        780,
        { align: 'center', width: 495.28 }
      );
  }

  doc.end();

  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      console.log(`Successfully generated ${outputPath}`);
      resolve(true);
    });
  });
}

// Generate README.pdf
const readmeSections = [
  {
    title: 'Executive Summary & System Purpose',
    content: `Rihlat Da'eyah (Journey of a Caller) is an advanced Islamic Gamified Educational & Learning Management System designed specifically for Quranic circles, youth batches, and academic activity clubs.

The platform bridges the gap between student engagement and supervisor monitoring by combining structured Quranic progress tracking with gamification elements like XP points, level badges, custom journey stations, direct teacher messaging, activity clubs, digital library resources, and automated achievement reviews.`
  },
  {
    title: 'Core Architecture & User Roles',
    content: `The system operates under two primary user portals:

1. Student / Youth Portal:
- Journey Stations Bar: Tracks progress through 6 stations (🌱 Start, 📖 Knowledge Seeker, ⭐ Diligent, 💎 Distinguished, 🌟 Influential, 👑 Role Model).
- Live Challenges Module: Daily, Weekly, and Monthly challenges tied to real-time XP calculation.
- Specialized Student Clubs: Join clubs (Radio, Readers, Tech) and submit club tasks.
- Interactive Resource Library: Access PDFs, audio files, videos, documents, and links with target filtering.
- Direct Teacher Announcements: Receive announcements with real-time read receipt tracking.

2. Supervisor / Teacher Portal:
- Batch & Class Management: Create batches, organize classes, assign students, and monitor average performance metrics.
- Submissions Review Engine: Review student task submissions, award XP, approve or reject with teacher feedback notes.
- Targeted Messaging Engine: Send messages to specific students, classes, clubs, or entire batches with read status verification.
- System Customization: Customize station thresholds, XP multipliers, branding colors, and leaderboard visibility.`
  },
  {
    title: 'Technology Stack Specifications',
    table: {
      headers: ['Component', 'Technology', 'Version', 'Purpose'],
      rows: [
        ['Frontend Framework', 'React & TypeScript', '19.0.1 / 5.8', 'UI Rendering & Type Safety'],
        ['Build System', 'Vite', '6.2.3', 'Fast HMR & Production Bundling'],
        ['Styling Engine', 'Tailwind CSS', 'v4.1', 'Utility-first Responsive UI'],
        ['Animations', 'Motion (Framer)', '12.23', 'Fluid Transitions & Micro-interactions'],
        ['Icons', 'Lucide React', '0.546', 'Vector Icon System'],
        ['State Sync Engine', 'Reactive LocalStorage', 'v1.0', 'Instant Offline-first Multi-tab Event Sync'],
        ['Cloud Backend', 'Supabase Client JS', '2.112', 'Optional Cloud Data Backup & Auth'],
        ['Document Export', 'PDFKit', 'v0.16', 'Automated PDF Documentation Engine']
      ]
    }
  },
  {
    title: 'System Installation & Developer Guide',
    content: `Prerequisites: Node.js 18+ and npm installed.

Commands:
- npm install: Installs all required project packages.
- npm run dev: Launches local development server on port 3000.
- npm run build: Builds optimized production assets.
- npm run lint: Validates TypeScript compilation and syntax rules.`
  }
];

// Generate ERD_DOCUMENT.pdf
const erdSections = [
  {
    title: 'Database Architecture Overview',
    content: `The database model for Rihlat Da'eyah follows a clean relational structure supporting multi-tenant batch isolation, class hierarchies, student level progression, submission approvals, library management, and targeted messaging.

Data persistence uses a reactive state store backed by LocalStorage with custom update dispatchers, and is fully typed for seamless migration to Supabase PostgreSQL.`
  },
  {
    title: 'Core Entity Relational Schema',
    table: {
      headers: ['Entity Name', 'Primary Key', 'Foreign Keys', 'Description'],
      rows: [
        ['BATCH', 'id (UUID)', 'None', 'Main educational batch container'],
        ['BATCH_STUDENT', 'id (UUID)', 'batchId -> BATCH.id', 'Student profile, XP, and level badges'],
        ['BATCH_CLASS', 'id (UUID)', 'batchId -> BATCH.id', 'Class or Quranic circle within a batch'],
        ['BATCH_CLUB', 'id (UUID)', 'batchId -> BATCH.id', 'Extracurricular activity club'],
        ['CLUB_MEMBER', 'id (UUID)', 'clubId -> BATCH_CLUB.id', 'Student membership in a club'],
        ['CLUB_TASK', 'id (UUID)', 'clubId -> BATCH_CLUB.id', 'Tasks issued by club supervisor'],
        ['BATCH_CHALLENGE', 'id (UUID)', 'batchId -> BATCH.id', 'Daily, weekly, or monthly challenges'],
        ['PENDING_SUBMISSION', 'id (UUID)', 'studentId, challengeId', 'Student task submission for teacher review'],
        ['ACHIEVEMENT', 'id (UUID)', 'batchId -> BATCH.id', 'Badges and automated level unlock triggers'],
        ['BATCH_LIBRARY_ITEM', 'id (UUID)', 'batchId -> BATCH.id', 'Educational PDFs, videos, and links'],
        ['BATCH_ANNOUNCEMENT', 'id (UUID)', 'batchId -> BATCH.id', 'Teacher messages with readBy array']
      ]
    }
  },
  {
    title: 'Level Progression & Point System Logic',
    content: `Level Badges are calculated dynamically based on total student XP:
- Level 1 (0 - 199 XP): Start (🌱 البداية)
- Level 2 (200 - 499 XP): Knowledge Seeker (📖 طالب علم)
- Level 3 (500 - 999 XP): Diligent (⭐ مجتهد)
- Level 4 (1000 - 1799 XP): Distinguished (💎 متميز)
- Level 5 (1800 - 2799 XP): Influential (🌟 مؤثر)
- Level 6 (2800+ XP): Role Model (👑 قدوة)

All point rewards are managed by SystemSettingsService multipliers.`
  }
];

async function generateAll() {
  await createPdfFromMarkdown(
    'Rihlat Da\'eyah Platform',
    'System Architecture, Features & Developer Guide',
    readmeSections,
    path.join(process.cwd(), 'README.pdf')
  );

  await createPdfFromMarkdown(
    'Entity-Relationship Diagram & Data Schema',
    'Rihlat Da\'eyah Database Architecture Specification',
    erdSections,
    path.join(process.cwd(), 'ERD_DOCUMENT.pdf')
  );

  console.log('PDF Generation Complete!');
}

generateAll().catch(console.error);
