
// Интерфейс для опций программы
export interface ProgramOptions {
    projectsRootPath: string;
    outputFileName: string;
    maxFileSizeMB: number;
    batchSize: number;
  }
  
  // Интерфейс для представления проекта
  export interface Project {
    name: string;
    path: string;
    hasGitignore: boolean;
    gitignorePath: string;
  }
  
  // Стандартные директории и файлы, которые нужно игнорировать
  export const DEFAULT_IGNORE_PATTERNS = [
    // Системные директории и файлы
    '.git/',
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.idea/',
    '.vscode/',
    '.qodo/',
    '.DS_Store',
    'Thumbs.db',
    
    // Логи и файлы блокировки
    '*.log',
    '*.lock',
    'package-lock.json',
    'package.json',
    'yarn.lock',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    
    // Документация и конфигурация
    'README.md',
    '.env',
    '.gitignore',
    
    // Аудио файлы
    '*.mp3',
    '*.wav',
    '*.ogg',
    '*.flac',
    '*.aac',
    '*.m4a',
    '*.wma',
    '*.mid',
    '*.midi',
    
    // Видео файлы
    '*.mp4',
    '*.avi',
    '*.mov',
    '*.wmv',
    '*.flv',
    '*.mkv',
    '*.webm',
    '*.m4v',
    '*.mpg',
    '*.mpeg',
    
    // Изображения
    '*.jpg',
    '*.jpeg',
    '*.png',
    '*.gif',
    '*.bmp',
    '*.tiff',
    '*.tif',
    '*.svg',
    '*.webp',
    '*.ico',
    '*.psd',
    '*.ai',
    
    // Архивы
    '*.zip',
    '*.rar',
    '*.7z',
    '*.tar',
    '*.gz',
    '*.bz2',
    
    // Шрифты
    '*.ttf',
    '*.otf',
    '*.woff',
    '*.woff2',
    '*.eot',
    
    // Документы
    '*.pdf',
    '*.doc',
    '*.docx',
    '*.xls',
    '*.xlsx',
    '*.ppt',
    '*.pptx',
    
    // Базы данных
    '*.db',
    '*.sqlite',
    '*.sqlite3',
    
    // Другие бинарные форматы
    '*.bin',
    '*.dat',
    '*.exe',
    '*.dll',
    '*.so',
    '*.dylib',
    '*.class',
    '*.jar',
    '*.war',
    '*.ear'
  ];
  