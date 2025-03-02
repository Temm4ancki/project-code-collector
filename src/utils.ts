import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

// Промисифицируем функции fs для удобства использования
export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);
export const appendFile = promisify(fs.appendFile);
export const readdir = promisify(fs.readdir);
export const stat = promisify(fs.stat);
export const access = promisify(fs.access);

// Функция для проверки существования файла
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// Функция для чтения и парсинга .gitignore
export async function readGitignorePatterns(gitignorePath: string): Promise<string[]> {
  try {
    if (await fileExists(gitignorePath)) {
      const content = await readFile(gitignorePath, 'utf-8');
      // Разбиваем содержимое файла на строки, удаляем комментарии и пустые строки
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    }
    return [];
  } catch (error) {
    console.warn(`Не удалось прочитать .gitignore по пути ${gitignorePath}:`, error);
    return [];
  }
}

// Функция для проверки, соответствует ли путь шаблону игнорирования
export function matchesIgnorePattern(filePath: string, pattern: string): boolean {
  // Преобразуем путь к формату, который ожидает .gitignore (с прямыми слешами)
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Обрабатываем шаблоны с символом *
  if (pattern.includes('*')) {
    // Обработка шаблонов типа *.расширение
    if (pattern.startsWith('*.')) {
      const extension = pattern.substring(1); // получаем .расширение
      return normalizedPath.endsWith(extension);
    }
    
    // Обработка других шаблонов с *
    const regexPattern = pattern
      .replace(/\./g, '\\.')  // экранируем точки
      .replace(/\*/g, '.*');  // заменяем * на .* для регулярного выражения
    
    const regex = new RegExp(`^${regexPattern}$|/${regexPattern}$|^${regexPattern}/|/${regexPattern}/`);
    return regex.test(normalizedPath);
  }
  
  // Обрабатываем разные типы шаблонов без *
  if (pattern.startsWith('/')) {
    // Шаблон начинается с корня проекта
    const patternWithoutSlash = pattern.slice(1);
    return normalizedPath === patternWithoutSlash || normalizedPath.startsWith(patternWithoutSlash + '/');
  } else if (pattern.endsWith('/')) {
    // Шаблон для директории
    return normalizedPath === pattern.slice(0, -1) || normalizedPath.startsWith(pattern) || normalizedPath.includes('/' + pattern);
  } else {
    // Обычный шаблон
    return normalizedPath === pattern ||
      normalizedPath.endsWith('/' + pattern) ||
      normalizedPath.startsWith(pattern + '/') ||
      normalizedPath.includes('/' + pattern + '/');
  }
}

// Функция для проверки, должен ли файл быть проигнорирован
export function shouldIgnore(filePath: string, ignorePatterns: string[]): boolean {
  // Сначала проверяем, соответствует ли путь какому-либо шаблону исключения
  for (const pattern of ignorePatterns) {
    if (pattern.startsWith('!')) {
      const negatedPattern = pattern.slice(1);
      if (matchesIgnorePattern(filePath, negatedPattern)) {
        return false; // Файл явно исключен из игнорирования
      }
    }
  }

  // Затем проверяем, соответствует ли путь какому-либо шаблону игнорирования
  for (const pattern of ignorePatterns) {
    if (!pattern.startsWith('!') && matchesIgnorePattern(filePath, pattern)) {
      return true; // Файл должен быть проигнорирован
    }
  }

  return false;
}