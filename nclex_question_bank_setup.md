# Comprehensive NCLEX Question Bank Architecture & Implementation Guide

This guide provides an end-to-end blueprint for building a high-performance, scalable NCLEX (Next Generation NCLEX - NGN) Question Bank platform. It includes database schema design, bulk ingestion pipelines with Zod validation, NGN scoring engines (+/- and rationale scoring), API route handlers for Practice/Test modes, and a robust React client hook.

---

## Table of Contents
1. [Prerequisites & System Architecture](#1-prerequisites--system-architecture)
2. [Database Schema (Prisma ORM & PostgreSQL)](#2-database-schema-prisma-orm--postgresql)
3. [Bulk Ingestion & Zod Validation Engine](#3-bulk-ingestion--zod-validation-engine)
4. [NGN Scoring Algorithms Engine](#4-ngn-scoring-algorithms-engine)
5. [API Controllers & Route Handlers](#5-api-controllers--route-handlers)
6. [Frontend State Hook & UI Components](#6-frontend-state-hook--ui-components)
7. [Deployment & Performance Optimization](#7-deployment--performance-optimization)

---

## 1. Prerequisites & System Architecture

### Tech Stack
* **Runtime:** Node.js (v18+) / TypeScript (v5+)
* **Database:** PostgreSQL (v14+)
* **ORM:** Prisma ORM
* **Validation:** Zod
* **Frontend:** React (Next.js App Router or Vite + React)

### System Flow
```
+-----------------------------------------------------------------------------------+
|                                   Client Side                                     |
|  +---------------------------+                +--------------------------------+  |
|  | Practice Mode (Immediate) |                | Test Mode (Deferred Rationale) |  |
|  +-------------+-------------+                +---------------+----------------+  |
+----------------|----------------------------------------------|-------------------+
                 |                                              |
                 v                                              v
+-----------------------------------------------------------------------------------+
|                                   API Layer                                       |
|  POST /api/questions/submit                    POST /api/exams/finalize           |
|  - Calculates instant score                    - Calculates aggregate score       |
|  - Returns question rationale                  - Unlocks exam-wide rationales    |
+----------------|----------------------------------------------|-------------------+
                 |                                              |
                 +-----------------------+----------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                 Database Layer                                    |
|  PostgreSQL Database (Questions, Exam Sessions, User Responses, Analytics)       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Database Schema (Prisma ORM & PostgreSQL)

Save this file as `prisma/schema.prisma`.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum QuestionType {
  MULTIPLE_CHOICE
  MULTIPLE_RESPONSE     // Select All That Apply (SATA)
  MATRIX_GRID           // Clinical decision grids
  CLOZE_DROP_DOWN       // Dropdown filling in clinical case context
  RATIONALE_PAIRED      // Cause & Effect paired decisions
}

enum Category {
  SAFE_EFFECTIVE_CARE_ENVIRONMENT
  HEALTH_PROMOTION_AND_MAINTENANCE
  PSYCHOSOCIAL_INTEGRITY
  PHYSIOLOGICAL_INTEGRITY
}

enum SubCategory {
  MANAGEMENT_OF_CARE
  SAFETY_AND_INFECTION_CONTROL
  BASIC_CARE_AND_COMFORT
  PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES
  REDUCTION_OF_RISK_POTENTIAL
  PHYSIOLOGICAL_ADAPTATION
}

enum ExamMode {
  PRACTICE
  TEST
}

model Question {
  id               String          @id @default(uuid())
  stem             String          @db.Text // Clinical scenario or client context
  prompt           String          @db.Text // The actual question statement
  options          Json            // Array of options [{ id: "a", text: "...", group?: "row_1" }]
  correctAnswers   Json            // Standard correct array or paired mapping key-values
  rationale        String          @db.Text // Detailed rationale and key takeaways
  category         Category
  subCategory      SubCategory
  questionType     QuestionType
  difficulty       Float           @default(0.5) // Item difficulty index (0.00 - 1.00)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  userResponses    UserAnswer[]

  @@index([category, questionType])
}

model ExamSession {
  id           String       @id @default(uuid())
  userId       String
  mode         ExamMode
  isCompleted  Boolean      @default(false)
  score        Float?       // Final calculated score
  maxScore     Float?       // Maximum possible points
  timeSpentSec Int          @default(0)
  createdAt    DateTime     @default(now())
  completedAt  DateTime?

  answers      UserAnswer[]

  @@index([userId, isCompleted])
}

model UserAnswer {
  id           String       @id @default(uuid())
  userId       String
  examSessionId String
  questionId   String
  selected     Json         // Option IDs selected by user
  isCorrect    Boolean
  pointsEarned Float
  pointsPossible Float
  timeSpentSec Int          @default(0)
  createdAt    DateTime     @default(now())

  question    Question     @relation(fields: [questionId], references: [id], onDelete: Cascade)
  examSession ExamSession  @relation(fields: [examSessionId], references: [id], onDelete: Cascade)

  @@unique([examSessionId, questionId])
  @@index([userId, questionId])
}
```

---

## 3. Bulk Ingestion & Zod Validation Engine

Save this file as `scripts/ingestQuestions.ts`.

```typescript
import { PrismaClient, QuestionType, Category, SubCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

const prisma = new PrismaClient();

// --- Zod Validation Schemas ---

const OptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  group: z.string().optional(), // For Matrix Grid row/column assignments
});

const QuestionIngestSchema = z.object({
  stem: z.string().min(10, "Stem must be detailed"),
  prompt: z.string().min(5, "Prompt is required"),
  options: z.array(OptionSchema).min(2, "At least two options required"),
  correctAnswers: z.union([
    z.array(z.string()), // Standard array of IDs for MC / SATA
    z.record(z.string(), z.string()) // Mapping for Matrix / Cloze / Paired
  ]),
  rationale: z.string().min(10, "Detailed rationale is required"),
  category: z.nativeEnum(Category),
  subCategory: z.nativeEnum(SubCategory),
  questionType: z.nativeEnum(QuestionType),
  difficulty: z.number().min(0).max(1).default(0.5),
});

const BatchIngestSchema = z.array(QuestionIngestSchema);

// --- Ingestion Handler ---

async function runIngestion(filePath: string) {
  try {
    console.log(`Reading dataset from: ${filePath}`);
    const rawData = fs.readFileSync(path.resolve(filePath), 'utf-8');
    const parsedData = JSON.parse(rawData);

    // Validate payload against schema
    console.log('Validating schema integrity...');
    const validatedQuestions = BatchIngestSchema.parse(parsedData);

    console.log(`Validation successful. Importing ${validatedQuestions.length} questions...`);

    let importedCount = 0;
    
    // Batch processing in transactions of 100 to avoid buffer overflow
    const BATCH_SIZE = 100;
    for (let i = 0; i < validatedQuestions.length; i += BATCH_SIZE) {
      const batch = validatedQuestions.slice(i, i + BATCH_SIZE);
      
      await prisma.$transaction(
        batch.map((q) =>
          prisma.question.create({
            data: {
              stem: q.stem,
              prompt: q.prompt,
              options: q.options,
              correctAnswers: q.correctAnswers,
              rationale: q.rationale,
              category: q.category,
              subCategory: q.subCategory,
              questionType: q.questionType,
              difficulty: q.difficulty,
            },
          })
        )
      );
      importedCount += batch.length;
      console.log(`Progress: ${importedCount}/${validatedQuestions.length} inserted.`);
    }

    console.log('Bulk Ingestion completed successfully!');
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Schema Validation Failed:', JSON.stringify(error.errors, null, 2));
    } else {
      console.error('Ingestion Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Execute script
const inputFilePath = process.argv[2] || './data/questions_sample.json';
runIngestion(inputFilePath);
```

---

## 4. NGN Scoring Algorithms Engine

Save this file as `lib/scoringEngine.ts`.

```typescript
import { QuestionType } from '@prisma/client';

export interface ScoreResult {
  pointsEarned: number;
  pointsPossible: number;
  isCorrect: boolean;
}

/**
 * Calculates score based on NGN Official Rules:
 * 1. 0/1 Scoring (Multiple Choice, Cloze Dropdown)
 * 2. +/- Scoring (SATA / Multiple Response) - min score = 0
 * 3. Rationale / Paired Rule (All paired conditions must be true to earn points)
 */
export function calculateNGNScore(
  questionType: QuestionType,
  selected: any,
  correctAnswers: any
): ScoreResult {
  switch (questionType) {
    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.CLOZE_DROP_DOWN:
      return scoreZeroOneRule(selected, correctAnswers);

    case QuestionType.MULTIPLE_RESPONSE:
    case QuestionType.MATRIX_GRID:
      return scorePlusMinusRule(selected, correctAnswers);

    case QuestionType.RATIONALE_PAIRED:
      return scoreRationalePairedRule(selected, correctAnswers);

    default:
      return { pointsEarned: 0, pointsPossible: 1, isCorrect: false };
  }
}

/**
 * Standard 0/1 Scoring Rule
 */
function scoreZeroOneRule(selected: any, correctAnswers: any): ScoreResult {
  const isCorrect = Array.isArray(correctAnswers)
    ? Array.isArray(selected) && selected[0] === correctAnswers[0]
    : JSON.stringify(selected) === JSON.stringify(correctAnswers);

  return {
    pointsEarned: isCorrect ? 1 : 0,
    pointsPossible: 1,
    isCorrect,
  };
}

/**
 * NGN +/- Scoring Rule for SATA & Matrix Items
 * Points = Correct Selections - Incorrect Selections (Floor = 0)
 */
function scorePlusMinusRule(selected: string[], correctAnswers: string[]): ScoreResult {
  if (!Array.isArray(selected) || !Array.isArray(correctAnswers)) {
    return { pointsEarned: 0, pointsPossible: correctAnswers.length || 1, isCorrect: false };
  }

  const correctSet = new Set(correctAnswers);
  const selectedSet = new Set(selected);

  let rawPoints = 0;

  // Add 1 point for every correct selection
  // Subtract 1 point for every incorrect selection
  selectedSet.forEach((choice) => {
    if (correctSet.has(choice)) {
      rawPoints += 1;
    } else {
      rawPoints -= 1;
    }
  });

  // Score cannot drop below 0
  const pointsEarned = Math.max(0, rawPoints);
  const pointsPossible = correctAnswers.length;
  const isCorrect = pointsEarned === pointsPossible && selected.length === correctAnswers.length;

  return {
    pointsEarned,
    pointsPossible,
    isCorrect,
  };
}

/**
 * NGN Rationale/Paired Scoring Rule
 * Both conditions (Cause AND Effect) must be correct to get points.
 */
function scoreRationalePairedRule(
  selected: Record<string, string>,
  correctAnswers: Record<string, string>
): ScoreResult {
  const keys = Object.keys(correctAnswers);
  const pointsPossible = 1;

  let allMatch = true;
  for (const key of keys) {
    if (selected[key] !== correctAnswers[key]) {
      allMatch = false;
      break;
    }
  }

  return {
    pointsEarned: allMatch ? 1 : 0,
    pointsPossible,
    isCorrect: allMatch,
  };
}
```

---

## 5. API Controllers & Route Handlers

Save this file as `controllers/examController.ts` (or implement in Next.js `/api/` dynamic routes).

```typescript
import { Request, Response } from 'express';
import { PrismaClient, ExamMode } from '@prisma/client';
import { calculateNGNScore } from '../lib/scoringEngine';

const prisma = new PrismaClient();

/**
 * POST /api/questions/submit
 * Handles single answer submissions during an active test/practice session.
 */
export async function submitQuestionAnswer(req: Request, res: Response) {
  try {
    const { userId, examSessionId, questionId, selected, timeSpentSec } = req.body;

    // Fetch Question & Exam Session context
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    const session = await prisma.examSession.findUnique({ where: { id: examSessionId } });

    if (!question || !session) {
      return res.status(404).json({ error: 'Question or Exam Session not found' });
    }

    // Compute NGN Score
    const scoreResult = calculateNGNScore(question.questionType, selected, question.correctAnswers);

    // Save or Update User Answer Record
    const userAnswer = await prisma.userAnswer.upsert({
      where: {
        examSessionId_questionId: { examSessionId, questionId },
      },
      update: {
        selected,
        isCorrect: scoreResult.isCorrect,
        pointsEarned: scoreResult.pointsEarned,
        pointsPossible: scoreResult.pointsPossible,
        timeSpentSec,
      },
      create: {
        userId,
        examSessionId,
        questionId,
        selected,
        isCorrect: scoreResult.isCorrect,
        pointsEarned: scoreResult.pointsEarned,
        pointsPossible: scoreResult.pointsPossible,
        timeSpentSec,
      },
    });

    // MODE LOGIC BRANCHING
    if (session.mode === ExamMode.PRACTICE) {
      // PRACTICE MODE: Return score evaluation & rationale immediately
      return res.status(200).json({
        mode: ExamMode.PRACTICE,
        isCorrect: scoreResult.isCorrect,
        pointsEarned: scoreResult.pointsEarned,
        pointsPossible: scoreResult.pointsPossible,
        correctAnswers: question.correctAnswers,
        rationale: question.rationale,
      });
    } else {
      // TEST MODE: Acknowledge submission without exposing rationale or answer key
      return res.status(200).json({
        mode: ExamMode.TEST,
        acknowledged: true,
      });
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/exams/finalize
 * Finalizes test mode sessions and unlocks rationales for review.
 */
export async function finalizeExamSession(req: Request, res: Response) {
  try {
    const { examSessionId } = req.body;

    const answers = await prisma.userAnswer.findMany({
      where: { examSessionId },
      include: { question: true },
    });

    const totalEarned = answers.reduce((acc, curr) => acc + curr.pointsEarned, 0);
    const totalPossible = answers.reduce((acc, curr) => acc + curr.pointsPossible, 0);
    const totalTime = answers.reduce((acc, curr) => acc + curr.timeSpentSec, 0);

    const updatedSession = await prisma.examSession.update({
      where: { id: examSessionId },
      data: {
        isCompleted: true,
        score: totalEarned,
        maxScore: totalPossible,
        timeSpentSec: totalTime,
        completedAt: new Date(),
      },
    });

    // Unlocks all rationales and correct keys for review screen
    const reviewData = answers.map((ans) => ({
      questionId: ans.questionId,
      stem: ans.question.stem,
      prompt: ans.question.prompt,
      options: ans.question.options,
      selected: ans.selected,
      correctAnswers: ans.question.correctAnswers,
      rationale: ans.question.rationale,
      isCorrect: ans.isCorrect,
      pointsEarned: ans.pointsEarned,
      pointsPossible: ans.pointsPossible,
    }));

    return res.status(200).json({
      session: updatedSession,
      review: reviewData,
    });
  } catch (error) {
    console.error('Error finalizing exam:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 6. Frontend State Hook & UI Components

Save this file as `hooks/useNCLEXEngine.ts`.

```typescript
import { useState, useCallback } from 'react';

export interface Question {
  id: string;
  stem: string;
  prompt: string;
  options: { id: string; text: string }[];
  questionType: string;
}

export interface Feedback {
  isCorrect?: boolean;
  pointsEarned?: number;
  pointsPossible?: number;
  correctAnswers?: any;
  rationale?: string;
}

export function useNCLEXEngine(
  questions: Question[],
  sessionId: string,
  mode: 'PRACTICE' | 'TEST'
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (optionId: string) => {
    // Prevent changing answer if practice rationale is already shown
    if (mode === 'PRACTICE' && feedback[currentQuestion.id]) return;

    setSelectedAnswers((prev) => {
      const qId = currentQuestion.id;
      if (currentQuestion.questionType === 'MULTIPLE_RESPONSE') {
        const currentList: string[] = prev[qId] || [];
        const nextList = currentList.includes(optionId)
          ? currentList.filter((id) => id !== optionId)
          : [...currentList, optionId];
        return { ...prev, [qId]: nextList };
      }
      return { ...prev, [qId]: [optionId] };
    });
  };

  const submitCurrentAnswer = useCallback(async () => {
    const qId = currentQuestion.id;
    const selected = selectedAnswers[qId];
    if (!selected) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/questions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_123',
          examSessionId: sessionId,
          questionId: qId,
          selected,
          timeSpentSec: 30,
        }),
      });

      const data = await res.json();

      if (mode === 'PRACTICE') {
        setFeedback((prev) => ({
          ...prev,
          [qId]: {
            isCorrect: data.isCorrect,
            pointsEarned: data.pointsEarned,
            pointsPossible: data.pointsPossible,
            correctAnswers: data.correctAnswers,
            rationale: data.rationale,
          },
        }));
      }
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentQuestion, selectedAnswers, sessionId, mode]);

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    selected: selectedAnswers[currentQuestion.id] || [],
    currentFeedback: feedback[currentQuestion.id],
    handleSelectOption,
    submitCurrentAnswer,
    nextQuestion,
    prevQuestion,
    isSubmitting,
  };
}
```

---

## 7. Deployment & Performance Optimization

### Database Indexing Strategy
To maintain sub-10ms response times across a table with 1,000+ questions and thousands of student response records:
1. Ensure composite indexes are maintained on `(category, questionType)` in the `Question` model for instant quiz filters.
2. Maintain unique compound index `@@unique([examSessionId, questionId])` to allow atomic upserts on student answers without race conditions.

### Scaling & Infrastructure Checklist
* **Connection Pooling:** Use PgBouncer or Prisma Accelerate for serverless connection pooling to handle high traffic spikes during scheduled exams.
* **Payload Compression:** Gzip/Brotli compress json options and stem text at the gateway tier.
* **Caching:** Cache standard static question definitions in Redis if scaling beyond 10,000 concurrent students.
