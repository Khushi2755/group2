import { describe, it, expect } from 'vitest';

describe('Unit Tests - Utility Functions', () => {
  describe('String Operations', () => {
    it('should capitalize first letter', () => {
      const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle single character', () => {
      const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
      expect(capitalize('a')).toBe('A');
    });

    it('should handle empty string', () => {
      const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
      expect(capitalize('')).toBe('');
    });

    it('should trim whitespace', () => {
      const trim = (str) => str.trim();
      expect(trim('  hello  ')).toBe('hello');
    });

    it('should convert to lowercase', () => {
      const lower = (str) => str.toLowerCase();
      expect(lower('HELLO')).toBe('hello');
    });
  });

  describe('Email Validation', () => {
    const isValidEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    it('should accept valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email without at', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('should reject invalid email without domain', () => {
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should accept email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });
  });

  describe('Array Operations', () => {
    it('should filter array elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const filtered = arr.filter(x => x > 2);
      expect(filtered).toEqual([3, 4, 5]);
    });

    it('should map array elements', () => {
      const arr = [1, 2, 3];
      const mapped = arr.map(x => x * 2);
      expect(mapped).toEqual([2, 4, 6]);
    });

    it('should find element in array', () => {
      const arr = [1, 2, 3, 4, 5];
      const found = arr.find(x => x === 3);
      expect(found).toBe(3);
    });

    it('should check array includes', () => {
      const arr = ['a', 'b', 'c'];
      expect(arr.includes('b')).toBe(true);
      expect(arr.includes('d')).toBe(false);
    });

    it('should reverse array', () => {
      const arr = [1, 2, 3];
      const reversed = [...arr].reverse();
      expect(reversed).toEqual([3, 2, 1]);
    });
  });

  describe('Object Operations', () => {
    it('should check object keys', () => {
      const obj = { name: 'John', age: 30 };
      expect(Object.keys(obj)).toEqual(['name', 'age']);
    });

    it('should check object values', () => {
      const obj = { name: 'John', age: 30 };
      expect(Object.values(obj)).toEqual(['John', 30]);
    });

    it('should merge objects', () => {
      const obj1 = { a: 1 };
      const obj2 = { b: 2 };
      const merged = { ...obj1, ...obj2 };
      expect(merged).toEqual({ a: 1, b: 2 });
    });

    it('should clone object', () => {
      const original = { a: 1, b: 2 };
      const clone = { ...original };
      expect(clone).toEqual(original);
    });
  });

  describe('Number Operations', () => {
    it('should round number', () => {
      const round = (num) => Math.round(num);
      expect(round(3.7)).toBe(4);
    });

    it('should get absolute value', () => {
      const abs = (num) => Math.abs(num);
      expect(abs(-5)).toBe(5);
    });

    it('should check if prime', () => {
      const isPrime = (num) => {
        if (num <= 1) return false;
        if (num <= 3) return true;
        for (let i = 2; i * i <= num; i++) {
          if (num % i === 0) return false;
        }
        return true;
      };
      expect(isPrime(7)).toBe(true);
      expect(isPrime(4)).toBe(false);
    });
  });
});
