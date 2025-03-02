
import * as path from 'path';
import { Project, ProgramOptions, DEFAULT_IGNORE_PATTERNS } from './types';
import {
  readdir, stat, fileExists, readFile, writeFile, appendFile,
  readGitignorePatterns, shouldIgnore
} from './utils';

// Функция для обнаружения проектов в корневой папке
export async function discoverProjects(rootPath: string): Promise<Project[]> {
  const projects: Project[] = [];
  try {
    const entries = await readdir(rootPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectPath = path.join(rootPath, entry.name);
        const gitignorePath = path.join(projectPath, '.gitignore');
        const hasGitignore = await fileExists(gitignorePath);
        projects.push({
          name: entry.name,
          path: projectPath,
          hasGitignore,
          gitignorePath
        });
      }
    }
    return projects;
  } catch (error) {
    console.error(`Ошибка при обнаружении проектов в ${rootPath}:`, error);
    return [];
  }
}

// Функция для получения списка всех файлов в проекте
export async function getAllFilePaths(
  dirPath: string,
  basePath: string,
  ignorePatterns: string[],
  result: string[] = []
): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      // Проверяем, должен ли файл быть проигнорирован
      if (shouldIgnore(relativePath, ignorePatterns)) {
        console.log(`Игнорируется: ${relativePath}`);
        continue;
      }

      if (entry.isDirectory()) {
        // Рекурсивно обходим поддиректории
        await getAllFilePaths(fullPath, basePath, ignorePatterns, result);
      } else {
        result.push(fullPath);
      }
    }
    return result;
  } catch (error) {
    console.error(`Ошибка при обходе директории ${dirPath}:`, error);
    return result;
  }
}

// Функция для обработки файла и записи его содержимого в выходной файл
export async function processFile(
  filePath: string,
  basePath: string,
  outputPath: string,
  maxFileSizeMB: number,
  isFirstFile: boolean
): Promise<boolean> {
  try {
    const relativePath = path.relative(basePath, filePath);

    // Пропускаем сам выходной файл, если он уже существует в проекте
    if (path.resolve(filePath) === path.resolve(outputPath)) {
      console.log(`Пропускается выходной файл: ${relativePath}`);
      return false;
    }

    const fileStats = await stat(filePath);

    // Проверяем размер файла
    const fileSizeMB = fileStats.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      console.log(`Пропускается файл ${relativePath} (размер: ${fileSizeMB.toFixed(2)} МБ > ${maxFileSizeMB} МБ)`);
      return false;
    }

    // Формируем заголовок для файла
    const header = `=== Файл: ${relativePath} ===\n\n`;

    try {
      // Пытаемся прочитать файл как текстовый
      const content = await readFile(filePath, 'utf-8');

      // Записываем содержимое в выходной файл
      if (isFirstFile) {
        await writeFile(outputPath, header + content + '\n\n');
      } else {
        await appendFile(outputPath, header + content + '\n\n');
      }
      return true;
    } catch (e) {
      // Если не удалось прочитать как текст, отмечаем как бинарный файл
      const binaryMessage = '[Бинарный файл]';
      if (isFirstFile) {
        await writeFile(outputPath, header + binaryMessage + '\n\n');
      } else {
        await appendFile(outputPath, header + binaryMessage + '\n\n');
      }
      return true;
    }
  } catch (error) {
    console.error(`Ошибка при обработке файла ${filePath}:`, error);
    return false;
  }
}

// Функция для обработки одного проекта
export async function processProject(project: Project, options: ProgramOptions): Promise<void> {
  console.log(`Обработка проекта: ${project.name}`);

  // Формируем путь для выходного файла
  const outputPath = path.join(project.path, options.outputFileName);

  // Проверяем, существует ли уже выходной файл
  const outputFileExists = await fileExists(outputPath);
  if (outputFileExists) {
    console.log(`Выходной файл ${options.outputFileName} уже существует в проекте ${project.name}. Очищаем файл...`);
    // Очищаем файл, записывая в него пустую строку
    await writeFile(outputPath, '');
    console.log(`Файл ${options.outputFileName} очищен.`);
  }

  // Читаем паттерны из .gitignore
  let ignorePatterns = project.hasGitignore
    ? await readGitignorePatterns(project.gitignorePath)
    : [];

  // Добавляем стандартные паттерны игнорирования
  ignorePatterns = [...ignorePatterns, ...DEFAULT_IGNORE_PATTERNS];

  // Добавляем выходной файл в список игнорируемых
  ignorePatterns.push(options.outputFileName);

  // Получаем список всех файлов в проекте
  const allFilePaths = await getAllFilePaths(project.path, project.path, ignorePatterns);

  if (allFilePaths.length === 0) {
    console.log(`В проекте ${project.name} не найдено файлов для обработки`);
    return;
  }

  console.log(`Найдено файлов для обработки: ${allFilePaths.length}`);

  // Обрабатываем файлы пакетами для экономии памяти
  const batchSize = options.batchSize;
  let processedCount = 0;

  for (let i = 0; i < allFilePaths.length; i += batchSize) {
    const batch = allFilePaths.slice(i, i + batchSize);
    for (let j = 0; j < batch.length; j++) {
      const filePath = batch[j];
      const isFirstFile = i === 0 && j === 0;
      const success = await processFile(
        filePath,
        project.path,
        outputPath,
        options.maxFileSizeMB,
        isFirstFile
      );
      if (success) {
        processedCount++;
      }
      // Освобождаем память после каждого файла
      global.gc && global.gc();
    }
    console.log(`Обработано ${Math.min(i + batchSize, allFilePaths.length)} из ${allFilePaths.length} файлов...`);
  }

  console.log(`Проект ${project.name} обработан. Обработано файлов: ${processedCount}. Результат сохранен в ${outputPath}`);
}
