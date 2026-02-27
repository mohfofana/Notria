import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db, schema } from "../db/index.js";

type SourceType = "cours" | "exercice" | "annale" | "livre";

interface RawContentDocument {
  sourceType: SourceType;
  subject: string;
  grade: string;
  chapter?: string | null;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface ChunkConfig {
  minTokens: number;
  targetTokens: number;
  maxTokens: number;
  overlapTokens: number;
}

interface DocumentChunk {
  content: string;
  chunkIndex: number;
  totalChunks: number;
}

interface SearchFilters {
  chapter?: string;
  grade?: string;
  sourceType?: SourceType;
}

interface SearchResult {
  id: number;
  content: string;
  chapter: string | null;
  sourceType: string;
  title: string;
  similarity: number;
  metadata: Record<string, unknown> | null;
}

interface IngestionSummary {
  filesProcessed: number;
  chunksCreated: number;
  chunksInserted: number;
  chunksSkipped: number;
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_BATCH_SIZE = 20;
const EMBEDDING_BATCH_PAUSE_MS = 200;
const SIMILARITY_THRESHOLD = 0.7;
const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  minTokens: 500,
  targetTokens: 650,
  maxTokens: 800,
  overlapTokens: 100,
};

let vectorExtensionEnsured = false;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }
  return new OpenAI({ apiKey });
}

function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

function splitIntoSentences(paragraph: string): string[] {
  const sentences = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.length > 0 ? sentences : [paragraph.trim()];
}

function splitTextToMaxTokenUnits(text: string, maxTokens: number): Array<{ text: string; tokens: number }> {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const units: Array<{ text: string; tokens: number }> = [];

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);
    if (paragraphTokens <= maxTokens) {
      units.push({ text: paragraph, tokens: paragraphTokens });
      continue;
    }

    const sentences = splitIntoSentences(paragraph);
    for (const sentence of sentences) {
      const sentenceTokens = estimateTokens(sentence);
      if (sentenceTokens <= maxTokens) {
        units.push({ text: sentence, tokens: sentenceTokens });
        continue;
      }

      const words = sentence.split(/\s+/).filter(Boolean);
      for (let i = 0; i < words.length; i += maxTokens) {
        const slice = words.slice(i, i + maxTokens);
        units.push({ text: slice.join(" "), tokens: slice.length });
      }
    }
  }

  return units;
}

function chunkDocument(content: string, config: ChunkConfig = DEFAULT_CHUNK_CONFIG): DocumentChunk[] {
  const units = splitTextToMaxTokenUnits(content, config.maxTokens);
  if (units.length === 0) return [];

  const chunks: DocumentChunk[] = [];
  let start = 0;

  while (start < units.length) {
    let currentTokens = 0;
    let end = start;

    while (end < units.length && currentTokens + units[end].tokens <= config.maxTokens) {
      currentTokens += units[end].tokens;
      end += 1;

      if (currentTokens >= config.targetTokens && currentTokens >= config.minTokens) {
        break;
      }
    }

    if (end === start) {
      end = Math.min(start + 1, units.length);
    }

    const chunkText = units
      .slice(start, end)
      .map((unit) => unit.text)
      .join("\n\n")
      .trim();

    if (chunkText) {
      chunks.push({
        content: chunkText,
        chunkIndex: chunks.length,
        totalChunks: 0,
      });
    }

    if (end >= units.length) {
      break;
    }

    let overlapCount = 0;
    let nextStart = end;
    for (let i = end - 1; i >= start; i -= 1) {
      overlapCount += units[i].tokens;
      nextStart = i;
      if (overlapCount >= config.overlapTokens) {
        break;
      }
    }

    if (nextStart <= start) {
      nextStart = start + 1;
    }
    start = nextStart;
  }

  const totalChunks = chunks.length;
  return chunks.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
    totalChunks,
  }));
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureVectorExtension(): Promise<void> {
  if (vectorExtensionEnsured) return;
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
  vectorExtensionEnsured = true;
}

async function createEmbeddings(input: string[]): Promise<number[][]> {
  const openai = getOpenAIClient();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input,
      });
      return response.data.map((item) => item.embedding);
    } catch (error: unknown) {
      const status = typeof error === "object" && error !== null && "status" in error
        ? Number((error as { status?: number }).status)
        : undefined;

      if (status !== 429 || attempt === 4) {
        throw error;
      }

      const backoffMs = 500 * 2 ** attempt;
      await sleep(backoffMs);
    }
  }

  throw new Error("Failed to create embeddings");
}

async function listJsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listJsonFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && fullPath.toLowerCase().endsWith(".json")) {
      results.push(fullPath);
    }
  }

  return results;
}

async function getExistingChunkIndexes(document: RawContentDocument): Promise<Set<number>> {
  const chapterPredicate = document.chapter
    ? eq(schema.contentChunks.chapter, document.chapter)
    : isNull(schema.contentChunks.chapter);

  const rows = await db
    .select({ chunkIndex: schema.contentChunks.chunkIndex })
    .from(schema.contentChunks)
    .where(and(
      eq(schema.contentChunks.sourceType, document.sourceType),
      eq(schema.contentChunks.subject, document.subject),
      eq(schema.contentChunks.grade, document.grade),
      eq(schema.contentChunks.title, document.title),
      chapterPredicate
    ))
    .orderBy(desc(schema.contentChunks.chunkIndex));

  return new Set(rows.map((row) => row.chunkIndex));
}

async function ingestSingleDocument(filePath: string): Promise<{
  chunkCount: number;
  insertedCount: number;
  skippedCount: number;
}> {
  const rawText = await readFile(filePath, "utf8");
  const document = JSON.parse(rawText) as RawContentDocument;

  if (!document.sourceType || !document.subject || !document.grade || !document.title || !document.content) {
    throw new Error(`Invalid JSON format: ${filePath}`);
  }

  const chunks = chunkDocument(document.content);
  const existingChunkIndexes = await getExistingChunkIndexes(document);
  const chunksToInsert = chunks.filter((chunk) => !existingChunkIndexes.has(chunk.chunkIndex));

  let insertedCount = 0;
  const skippedCount = chunks.length - chunksToInsert.length;

  for (let offset = 0; offset < chunksToInsert.length; offset += EMBEDDING_BATCH_SIZE) {
    const batch = chunksToInsert.slice(offset, offset + EMBEDDING_BATCH_SIZE);
    const embeddings = await createEmbeddings(batch.map((chunk) => chunk.content));

    const rows = batch.map((chunk, index) => ({
      sourceType: document.sourceType,
      subject: document.subject,
      grade: document.grade,
      chapter: document.chapter ?? null,
      title: document.title,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      totalChunks: chunk.totalChunks,
      embedding: embeddings[index],
      metadata: {
        ...(document.metadata ?? {}),
        filePath,
      },
    }));

    const inserted = await db
      .insert(schema.contentChunks)
      .values(rows)
      .onConflictDoNothing()
      .returning({ id: schema.contentChunks.id });

    insertedCount += inserted.length;

    if (offset + EMBEDDING_BATCH_SIZE < chunksToInsert.length) {
      await sleep(EMBEDDING_BATCH_PAUSE_MS);
    }
  }

  return {
    chunkCount: chunks.length,
    insertedCount,
    skippedCount,
  };
}

export const RagService = {
  async ingestFromDirectory(directoryPath: string): Promise<IngestionSummary> {
    await ensureVectorExtension();

    const files = await listJsonFiles(directoryPath);
    const summary: IngestionSummary = {
      filesProcessed: 0,
      chunksCreated: 0,
      chunksInserted: 0,
      chunksSkipped: 0,
    };

    for (const filePath of files) {
      const fileName = path.basename(filePath);
      const { chunkCount, insertedCount, skippedCount } = await ingestSingleDocument(filePath);

      summary.filesProcessed += 1;
      summary.chunksCreated += chunkCount;
      summary.chunksInserted += insertedCount;
      summary.chunksSkipped += skippedCount;

      console.log(`Ingesting ${fileName}... ${insertedCount} inserted, ${skippedCount} skipped`);
    }

    console.log(`Done. ${summary.chunksInserted} chunks inserted across ${summary.filesProcessed} files.`);
    return summary;
  },

  async search(
    query: string,
    limit = 5,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    await ensureVectorExtension();

    const normalizedLimit = Math.max(1, Math.min(limit, 10));
    const [queryEmbedding] = await createEmbeddings([query]);
    const queryVector = `[${queryEmbedding.join(",")}]`;

    const whereConditions: Array<ReturnType<typeof sql>> = [];
    if (filters?.chapter) {
      whereConditions.push(sql`chapter = ${filters.chapter}`);
    }
    if (filters?.grade) {
      whereConditions.push(sql`grade = ${filters.grade}`);
    }
    if (filters?.sourceType) {
      whereConditions.push(sql`source_type = ${filters.sourceType}`);
    }

    const whereClause =
      whereConditions.length > 0
        ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}`
        : sql``;

    const queryResult = await db.execute(sql<{
      id: number;
      content: string;
      chapter: string | null;
      sourceType: string;
      title: string;
      similarity: number;
      metadata: Record<string, unknown> | null;
    }>`
      SELECT
        id,
        content,
        chapter,
        source_type AS "sourceType",
        title,
        1 - (embedding <=> ${queryVector}::vector) AS similarity,
        metadata
      FROM content_chunks
      ${whereClause}
      ORDER BY embedding <=> ${queryVector}::vector
      LIMIT ${normalizedLimit}
    `);

    const rows = queryResult.rows as Array<{
      id: number;
      content: string;
      chapter: string | null;
      sourceType: string;
      title: string;
      similarity: number | string;
      metadata: Record<string, unknown> | null;
    }>;

    return rows
      .map((row) => ({
        ...row,
        similarity: typeof row.similarity === "number" ? row.similarity : Number(row.similarity),
      }))
      .filter((row) => row.similarity > SIMILARITY_THRESHOLD);
  },
};
