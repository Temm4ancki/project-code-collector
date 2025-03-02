import * as path from 'path';
import dotenv from 'dotenv';
import { stat } from './utils';
import { ProgramOptions } from './types';
import { discoverProjects, processProject } from './projectProcessor';

// Загружаем переменные окружения из .env файла
dotenv.config();

// Основная функция программы
async function main(): Promise<void> {
  try {
    // Получаем настройки из переменных окружения
    const projectsRootPath = process.env.PROJECTS_ROOT_PATH;
    const outputFileName = process.env.OUTPUT_FILE_NAME || 'project_code.txt';
    const maxFileSizeMB = Number(process.env.MAX_FILE_SIZE_MB || '5');
    const batchSize = Number(process.env.BATCH_SIZE || '10');
    
    if (!projectsRootPath) {
      throw new Error('Не указан путь к корневой папке проектов. Установите переменную окружения PROJECTS_ROOT_PATH');
    }
    
    const options: ProgramOptions = {
      projectsRootPath,
      outputFileName,
      maxFileSizeMB,
      batchSize
    };
    
    console.log(`Настройки программы:`);
    console.log(`- Корневая папка проектов: ${options.projectsRootPath}`);
    console.log(`- Имя выходного файла: ${options.outputFileName}`);
    console.log(`- Максимальный размер файла: ${options.maxFileSizeMB} МБ`);
    console.log(`- Размер пакета: ${options.batchSize} файлов`);
    
    // Проверяем, существует ли корневая директория
    const rootStats = await stat(options.projectsRootPath);
    if (!rootStats.isDirectory()) {
      throw new Error(`Указанный путь ${options.projectsRootPath} не является директорией`);
    }
    
    // Обнаруживаем проекты
    const projects = await discoverProjects(options.projectsRootPath);
    
    if (projects.length === 0) {
      console.log(`В директории ${options.projectsRootPath} не найдено проектов`);
      return;
    }
    
    console.log(`Найдено проектов: ${projects.length}`);
    
    // Обрабатываем каждый проект
    for (const project of projects) {
      await processProject(project, options);
      
      // Освобождаем память после каждого проекта
      global.gc && global.gc();
    }
    
    console.log('Все проекты успешно обработаны');
    
  } catch (error) {
    console.error('Произошла ошибка:', error);
    process.exit(1);
  }
}

// Запускаем программу
main();