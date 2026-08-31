import { useState, useEffect } from 'react';

export function useSecretCode(secretCode: string) {
  const [isTriggered, setIsTriggered] = useState(false);

  useEffect(() => {
    let input = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Handle special keys mapping if needed, but for simple string matching:
      const key = e.key.toLowerCase();
      // Allow only letters for simple codes to avoid messy strings
      if (key.length === 1 && key.match(/[a-z]/i)) {
        input += key;
        if (input.length > secretCode.length) {
          input = input.slice(input.length - secretCode.length);
        }
        
        if (input === secretCode.toLowerCase()) {
          setIsTriggered(prev => !prev);
          input = '';
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [secretCode]);

  return isTriggered;
}
