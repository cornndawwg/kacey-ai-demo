const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';

export interface ParsedDocument {
  content: string;
  metadata: {
    title?: string;
    author?: string;
    pages?: number;
    wordCount?: number;
    language?: string;
    [key: string]: any;
  };
}

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const data = await pdfParse(buffer);
    return {
      content: data.text,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        pages: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        language: 'en' // Default, could be enhanced with language detection
      }
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF document');
  }
}

export async function parseWord(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      content: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).length,
        language: 'en'
      }
    };
  } catch (error) {
    console.error('Word document parsing error:', error);
    throw new Error('Failed to parse Word document');
  }
}

export async function parseExcel(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let content = '';
    const metadata: any = {
      sheets: workbook.SheetNames,
      sheetCount: workbook.SheetNames.length
    };

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_csv(worksheet);
      content += `\n--- Sheet: ${sheetName} ---\n${sheetData}\n`;
    });

    return {
      content,
      metadata: {
        ...metadata,
        wordCount: content.split(/\s+/).length
      }
    };
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error('Failed to parse Excel document');
  }
}

export async function parseHTML(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const html = buffer.toString('utf-8');
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Extract text content
    const content = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Extract metadata
    const metadata: any = {
      title: $('title').text(),
      wordCount: content.split(/\s+/).length
    };

    // Extract meta tags
    $('meta').each((_, element) => {
      const name = $(element).attr('name') || $(element).attr('property');
      const content = $(element).attr('content');
      if (name && content) {
        metadata[name] = content;
      }
    });

    return {
      content,
      metadata
    };
  } catch (error) {
    console.error('HTML parsing error:', error);
    throw new Error('Failed to parse HTML document');
  }
}

export async function parseText(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const content = buffer.toString('utf-8');
    return {
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        characterCount: content.length
      }
    };
  } catch (error) {
    console.error('Text parsing error:', error);
    throw new Error('Failed to parse text document');
  }
}

export async function parseDocument(
  buffer: Buffer, 
  mimeType: string, 
  filename: string
): Promise<ParsedDocument> {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (mimeType) {
    case 'application/pdf':
      return parsePDF(buffer);
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return parseWord(buffer);
    
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
    case 'text/csv':
      return parseExcel(buffer);
    
    case 'text/html':
      return parseHTML(buffer);
    
    case 'text/plain':
      return parseText(buffer);
    
    default:
      // Try to parse based on file extension
      switch (extension) {
        case 'pdf':
          return parsePDF(buffer);
        case 'docx':
        case 'doc':
          return parseWord(buffer);
        case 'xlsx':
        case 'xls':
        case 'csv':
          return parseExcel(buffer);
        case 'html':
        case 'htm':
          return parseHTML(buffer);
        case 'txt':
          return parseText(buffer);
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
  }
}

export function chunkText(
  text: string, 
  chunkSize: number = 500, 
  overlap: number = 50
): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}
