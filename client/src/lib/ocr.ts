import Tesseract from 'tesseract.js';

export interface ExtractedIDData {
  name?: string;
  idNumber?: string;
  address?: string;
  city?: string;
}

export interface ExtractedPlateData {
  plateNumber?: string;
}

// Extract text from ID card image
export async function extractIDCardText(imageData: string): Promise<ExtractedIDData> {
  try {
    const result = await Tesseract.recognize(imageData, 'eng', {
      logger: (m: any) => console.log(m)
    });
    
    const text = result.data.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const extractedData: ExtractedIDData = {};
    
    console.log('OCR extracted lines:', lines);
    
    // Filter out header text and noise more aggressively
    let meaningfulLines: string[] = [];
    
    for (const line of lines) {
      const cleanLine = line.trim().replace(/[^\w\s.-]/g, '');
      const upperLine = cleanLine.toUpperCase();
      
      // Skip common ID card headers and labels
      if (
        cleanLine.length < 3 ||
        cleanLine.length > 50 ||
        upperLine.includes('IDENTITY') ||
        upperLine.includes('CARD') ||
        upperLine.includes('GOVERNMENT') ||
        upperLine.includes('REPUBLIC') ||
        upperLine.includes('ISSUED') ||
        upperLine.includes('EXPIRES') ||
        upperLine.includes('DOB') ||
        upperLine.includes('DATE') ||
        upperLine.includes('SEX') ||
        upperLine.includes('MALE') ||
        upperLine.includes('FEMALE') ||
        upperLine.includes('ADDRESS') ||
        upperLine.includes('SIGNATURE') ||
        upperLine.includes('VALID') ||
        upperLine.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || // Skip dates
        /^[^A-Za-z0-9]*$/.test(cleanLine) // Skip lines with only special characters
      ) {
        continue;
      }
      
      meaningfulLines.push(cleanLine);
    }
    
    console.log('Filtered meaningful lines:', meaningfulLines);
    
    // Find the best name candidate using scoring
    let bestNameCandidate = '';
    let bestNameScore = 0;
    
    for (const line of meaningfulLines) {
      const nameScore = calculateNameScore(line);
      if (nameScore > bestNameScore && nameScore > 0.7) {
        bestNameCandidate = line;
        bestNameScore = nameScore;
      }
    }
    
    if (bestNameCandidate) {
      extractedData.name = bestNameCandidate.replace(/\s+/g, ' ').trim();
    }
    
    // Find the best ID number candidate
    let bestIdCandidate = '';
    let bestIdScore = 0;
    
    for (const line of meaningfulLines) {
      if (line === bestNameCandidate) continue; // Skip the name line
      
      const idScore = calculateIdScore(line);
      if (idScore > bestIdScore && idScore > 0.6) {
        bestIdCandidate = line;
        bestIdScore = idScore;
      }
    }
    
    if (bestIdCandidate) {
      extractedData.idNumber = bestIdCandidate.replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');
    }
    
    // Fallback pattern matching if scoring didn't work
    if (!extractedData.name || !extractedData.idNumber) {
      const allText = meaningfulLines.join(' ');
      
      if (!extractedData.name) {
        // Look for name patterns: First Last or First Middle Last
        const nameMatches = allText.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g);
        if (nameMatches && nameMatches.length > 0) {
          extractedData.name = nameMatches[0];
        }
      }
      
      if (!extractedData.idNumber) {
        // Look for ID patterns: 8-15 alphanumeric characters
        const idMatches = allText.match(/\b[A-Z0-9]{8,15}\b/g);
        if (idMatches && idMatches.length > 0) {
          extractedData.idNumber = idMatches[0];
        }
      }
    }
    
    return extractedData;
  } catch (error) {
    console.error('OCR Error:', error);
    return {};
  }
}

// Calculate how likely a line is to be a person's name
function calculateNameScore(line: string): number {
  let score = 0;
  
  // Must contain letters
  if (!/[A-Za-z]/.test(line)) return 0;
  
  // Should be mostly alphabetic with spaces
  const alphaSpaceRatio = (line.match(/[A-Za-z\s]/g) || []).length / line.length;
  score += alphaSpaceRatio * 0.4;
  
  // Names typically have 2-4 words
  const words = line.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2 && words.length <= 4) {
    score += 0.3;
  }
  
  // Each word should start with capital letter
  const capitalizedWords = words.filter(w => /^[A-Z]/.test(w));
  score += (capitalizedWords.length / words.length) * 0.2;
  
  // Reasonable length
  if (line.length >= 5 && line.length <= 40) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
}

// Calculate how likely a line is to be an ID number
function calculateIdScore(line: string): number {
  let score = 0;
  
  // Must contain both letters and numbers, or just numbers
  const hasNumbers = /\d/.test(line);
  const hasLetters = /[A-Za-z]/.test(line);
  
  if (!hasNumbers && !hasLetters) return 0;
  if (hasNumbers) score += 0.4;
  if (hasLetters && hasNumbers) score += 0.2;
  
  // Should be alphanumeric with minimal spaces/special chars
  const cleanLine = line.replace(/[^A-Za-z0-9]/g, '');
  const cleanRatio = cleanLine.length / line.length;
  score += cleanRatio * 0.3;
  
  // ID numbers are typically 6-15 characters
  if (cleanLine.length >= 6 && cleanLine.length <= 15) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
}

// Extract license plate number
export async function extractLicensePlate(imageData: string): Promise<ExtractedPlateData> {
  try {
    const result = await Tesseract.recognize(imageData, 'eng', {
      logger: (m: any) => console.log(m)
    });

    const text = result.data.text;
    console.log('License plate OCR text:', text);

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // License plate patterns for various formats
    const platePatterns = [
      /\b[A-Z]{2,3}[-\s]?[0-9]{2,4}\b/g,    // ABC-123, AB-1234
      /\b[0-9]{2,3}[-\s]?[A-Z]{2,3}\b/g,    // 123-ABC, 12-AB
      /\b[A-Z]{1,2}[0-9]{2,4}[A-Z]?\b/g,    // A123, AB123, A1234B
      /\b[0-9]{1,3}[A-Z]{2,4}\b/g,          // 1ABC, 12ABCD
      /\b[A-Z0-9]{4,8}\b/g                  // General alphanumeric 4-8 chars
    ];
    
    let bestPlateCandidate = '';
    let bestPlateScore = 0;
    
    // Try each line
    for (const line of lines) {
      const cleanLine = line.replace(/[^A-Z0-9-\s]/g, '').toUpperCase().trim();
      if (cleanLine.length < 3) continue;
      
      for (const pattern of platePatterns) {
        const matches = cleanLine.match(pattern);
        if (matches && matches.length > 0) {
          for (const match of matches) {
            const score = calculatePlateScore(match);
            if (score > bestPlateScore) {
              bestPlateCandidate = match;
              bestPlateScore = score;
            }
          }
        }
      }
    }
    
    // Fallback: try the entire text as one potential plate
    if (!bestPlateCandidate) {
      const allText = lines.join(' ').replace(/[^A-Z0-9]/g, '').toUpperCase();
      if (allText.length >= 4 && allText.length <= 10) {
        const score = calculatePlateScore(allText);
        if (score > 0.5) {
          bestPlateCandidate = allText;
        }
      }
    }
    
    if (bestPlateCandidate) {
      // Format the plate number
      const formatted = bestPlateCandidate.replace(/\s+/g, '').replace(/--+/g, '-');
      return { plateNumber: formatted };
    }
    
    return {};
  } catch (error) {
    console.error('License Plate OCR Error:', error);
    return {};
  }
}

// Calculate likelihood of text being a license plate
function calculatePlateScore(text: string): number {
  let score = 0;
  const cleanText = text.replace(/[^A-Z0-9]/g, '');
  
  // Must have both letters and numbers, or be all numbers
  const hasNumbers = /\d/.test(cleanText);
  const hasLetters = /[A-Z]/.test(cleanText);
  
  if (!hasNumbers && !hasLetters) return 0;
  if (hasNumbers && hasLetters) score += 0.5;
  if (hasNumbers && !hasLetters && cleanText.length >= 3) score += 0.3; // All-numeric plates
  
  // Typical license plate length
  if (cleanText.length >= 4 && cleanText.length <= 8) {
    score += 0.3;
  } else if (cleanText.length >= 3 && cleanText.length <= 10) {
    score += 0.1;
  }
  
  // Common license plate patterns
  if (/^[A-Z]{2,3}[0-9]{2,4}$/.test(cleanText)) score += 0.2; // ABC123
  if (/^[0-9]{2,3}[A-Z]{2,3}$/.test(cleanText)) score += 0.2; // 123ABC
  if (/^[A-Z][0-9]{3,4}$/.test(cleanText)) score += 0.15;     // A1234
  
  return Math.min(score, 1);
}