/**
 * Utility to phonetically transliterate Bengali text to English equivalents for PDF output compatibility.
 */

const banglaToEnglishNumbers: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

const banglaToEnglishChars: Record<string, string> = {
  // Consonants
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'v', 'ম': 'm',
  'য': 'z', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
  'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
  'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',

  // Inner Vowls & Signs (Kar)
  'া': 'a', 'ি': 'i', 'ী': 'ee', 'ু': 'u', 'ূ': 'oo',
  'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',

  // Initial Vowels
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'ee', 'উ': 'u',
  'ঊ': 'oo', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o',
  'ঔ': 'ou'
};

export function transliterateBanglaToEnglish(text: string | null | undefined): string {
  if (!text) return '';
  
  // Replace numbers first
  let result = '';
  const normalizedText = String(text);
  
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    
    if (banglaToEnglishNumbers[char] !== undefined) {
      result += banglaToEnglishNumbers[char];
    } else if (banglaToEnglishChars[char] !== undefined) {
      result += banglaToEnglishChars[char];
    } else {
      result += char;
    }
  }

  // Polish common combined representations & double vowels/capitalization
  result = result
    .replace(/aa/g, 'a')
    .replace(/shsh/g, 'sh')
    .replace(/ee([aeiou])/g, 'y$1')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter of words
  return result
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
