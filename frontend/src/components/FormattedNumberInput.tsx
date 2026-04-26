"use client";

/**
 * @title FormattedNumberInput
 * @author Viqtorhvayx
 * @dev Reusable component for real-time thousands-separator formatting.
 * Handles the display state with commas while allowing the raw, unformatted 
 * value to be securely processed by Web3 hooks and smart contracts.
 */

import React, { useRef, useState, useEffect } from 'react';

export const stripCommas = (value: string) => value.replace(/,/g, '');

export const formatWithCommas = (val: string) => {
  let cleanValue = val.replace(/[^0-9.]/g, '');
  
  // Handle leading zeros gracefully
  if (cleanValue.length > 1 && cleanValue.startsWith('0') && !cleanValue.startsWith('0.')) {
    cleanValue = cleanValue.replace(/^0+/, '');
    if (cleanValue === '') cleanValue = '0';
    if (cleanValue.startsWith('.')) cleanValue = '0' + cleanValue;
  }

  const parts = cleanValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 8)}` : parts[0];
};

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
}

export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({ 
  value, 
  onValueChange, 
  ...props 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    let rawValue = input.value;
    let selectionStart = input.selectionStart || 0;

    // Detect backspacing a comma
    if (rawValue.length < value.length) {
      const testFormat = formatWithCommas(rawValue);
      if (testFormat === value) {
        if (selectionStart > 0) {
          const charToDeleteIndex = selectionStart - 1;
          rawValue = rawValue.substring(0, charToDeleteIndex) + rawValue.substring(charToDeleteIndex + 1);
          selectionStart--;
        }
      }
    }

    // Prevent multiple decimals
    const parts = rawValue.replace(/[^0-9.]/g, '').split('.');
    if (parts.length > 2) {
      setCursor(selectionStart - 1);
      return;
    }

    const formattedValue = formatWithCommas(rawValue);

    // Calculate new cursor position
    const beforeCursorRaw = rawValue.substring(0, selectionStart);
    const validCharsBeforeCursor = beforeCursorRaw.replace(/[^0-9.]/g, '').length;

    let newCursorPos = 0;
    let validCharsSeen = 0;

    for (let i = 0; i < formattedValue.length; i++) {
      if (validCharsSeen === validCharsBeforeCursor) {
        newCursorPos = i;
        break;
      }
      if (/[0-9.]/.test(formattedValue[i])) {
        validCharsSeen++;
      }
    }
    
    if (validCharsSeen === validCharsBeforeCursor) {
      newCursorPos = formattedValue.length;
    }

    setCursor(newCursorPos);
    onValueChange(formattedValue);
  };

  useEffect(() => {
    if (inputRef.current && cursor !== null) {
      inputRef.current.setSelectionRange(cursor, cursor);
    }
  }, [value, cursor]);

  return (
    <input
      {...props}
      ref={inputRef}
      value={value}
      onChange={handleChange}
      type="text"
    />
  );
};
