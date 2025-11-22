require('dotenv').config();

// --- IMPORTAÇÕES ---
// [NOVO] Importamos ComponentLoader para o design
const { AdminJS, ComponentLoader } = require('adminjs'); 
const AdminJSExpress = require('./node_modules/@adminjs/express/lib/index.js');
const AdminJSSequelize = require('./node_modules/@adminjs/sequelize/lib/index.js');

const express = require('express');
const Sequelize = require('sequelize');
const cors = require('cors');
const path = require('path');

// --- 1. CONFIGURAÇÃO DO DESIGN (DASHBOARD) ---
// --- 1. CONFIGURAÇÃO DO DESIGN (DASHBOARD) ---
const componentLoader = new ComponentLoader();

// [CORREÇÃO] Usamos path.resolve para garantir o caminho absoluto
const dashboardPath = path.resolve(__dirname, './components/dashboard.jsx');

const Components = {
  Dashboard: componentLoader.add('Dashboard', dashboardPath),
};

// --- 2. CONFIGURAÇÃO DO BANCO DE DADOS ---
AdminJS.registerAdapter(AdminJSSequelize);

const dbPassword = process.env.DB_PASSWORD;

if (!dbPassword) {
    console.error("❌ ERRO FATAL: Senha não encontrada no .env");
    process.exit(1);
}

// Conexão com Frankfurt (eu-central-1)
const sequelize = new Sequelize('postgres', 'postgres.notcolkgbaydijmupssz', dbPassword, {
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 6543, 
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false
});

// --- 3. DEFINIÇÃO DOS MODELOS ---
const Chapter = sequelize.define('chapters', {
  title: { type: Sequelize.STRING, allowNull: false },
  chapter_number: { type: Sequelize.INTEGER, allowNull: false },
  description: { type: Sequelize.TEXT }
}, { timestamps: false, tableName: 'chapters' });

const Lesson = sequelize.define('lessons', {
  title: { type: Sequelize.STRING, allowNull: false },
  lesson_number: { type: Sequelize.INTEGER, allowNull: false },
}, { timestamps: false, tableName: 'lessons' });

Chapter.hasMany(Lesson, { foreignKey: 'chapter_id' });
Lesson.belongsTo(Chapter, { foreignKey: 'chapter_id' });

const LessonStep = sequelize.define('lesson_steps', {
  step_type: { 
    type: Sequelize.ENUM('intro_box', 'vocabulary', 'dialogue', 'interactive_yes_no', 'interactive_multiple_choice', 'interactive_word_bank'),
    allowNull: false 
  },
  content_markdown: { type: Sequelize.TEXT },
  image_url: { type: Sequelize.STRING },
  audio_url: { type: Sequelize.STRING },
  options: { type: Sequelize.TEXT },
  correct_option_index: { type: Sequelize.INTEGER },
  step_order: { type: Sequelize.INTEGER, defaultValue: 0 }
}, { timestamps: false, tableName: 'lesson_steps' });

Lesson.hasMany(LessonStep, { foreignKey: 'lesson_id' });
LessonStep.belongsTo(Lesson, { foreignKey: 'lesson_id' });

const Exercise = sequelize.define('exercises', {
  type: { type: Sequelize.STRING, defaultValue: 'multiple_choice' },
  text: { type: Sequelize.STRING, allowNull: false },
  options: { type: Sequelize.TEXT },
  correct_option_index: { type: Sequelize.INTEGER },
  image_url: { type: Sequelize.STRING }
}, { timestamps: false, tableName: 'exercises' });

Lesson.hasMany(Exercise, { foreignKey: 'lesson_id' });
Exercise.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// --- 4. INICIALIZAÇÃO DO SERVIDOR ---
const start = async () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  try {
    await sequelize.authenticate();
    console.log('✅ Banco Conectado (Frankfurt)!');
    await sequelize.sync(); 
  } catch (error) {
    console.error('❌ Erro de Conexão:', error.message);
  }

  // --- CONFIGURAÇÃO DO ADMINJS (COM DESIGN) ---
  const admin = new AdminJS({
    databases: [sequelize],
    rootPath: '/admin',
    componentLoader, // Carrega os componentes personalizados
    dashboard: {
      component: Components.Dashboard // Usa o nosso Dashboard bonito
    },
    // [NOVO] Isso ajuda a evitar cache do navegador durante o desenvolvimento
    assets: {
        styles: ['https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'],
    },
    branding: { 
        companyName: 'Ta-lim Admin', 
        logo: false,
        withMadeWithLove: false,
        theme: {
          colors: {
            primary100: '#61C5A8', // Verde Ta-lim
            primary80: '#4db396',
            accent: '#FF8C66',     // Laranja
          },
          components: {
              Button: { borderRadius: '12px' },
              Input: { borderRadius: '12px' }
          }
        }
    },
    resources: [
      { resource: Chapter, options: { navigation: { name: 'Curso', icon: 'Book' } } },
      { resource: Lesson, options: { navigation: { name: 'Curso', icon: 'BookOpen' } } },
      { resource: LessonStep, options: { navigation: { name: 'Conteúdo', icon: 'Layers' } } },
      { resource: Exercise, options: { navigation: { name: 'Conteúdo', icon: 'PenTool' } } },
    ],
  });
  
  const adminRouter = AdminJSExpress.buildRouter(admin);
  app.use(admin.options.rootPath, adminRouter);

  // --- API PÚBLICA ---
  app.get('/api/chapters', async (req, res) => {
    const chapters = await Chapter.findAll({ order: [['chapter_number', 'ASC']] });
    res.json(chapters);
  });
  app.get('/api/lessons', async (req, res) => {
    const lessons = await Lesson.findAll({ where: req.query.chapter_id ? { chapter_id: req.query.chapter_id } : {}, order: [['lesson_number', 'ASC']] });
    res.json(lessons);
  });
  app.get('/api/lesson-steps/:lesson_id', async (req, res) => {
    const steps = await LessonStep.findAll({ where: { lesson_id: req.params.lesson_id }, order: [['step_order', 'ASC']] });
    res.json(steps);
  });
  app.get('/api/chapter/:id', async (req, res) => {
    const chapter = await Chapter.findByPk(req.params.id);
    chapter ? res.json(chapter) : res.status(404).json({ error: 'Not found' });
  });
  app.get('/api/exercises', async (req, res) => {
    const exercises = await Exercise.findAll({ where: { lesson_id: req.query.lesson_id } });
    res.json(exercises);
  });

  // --- SERVIR ARQUIVOS ---
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
  app.get(/(.*)/, (req, res) => {
      const filePath = path.join(__dirname, 'public', req.path);
      res.sendFile(filePath, (err) => { if (err) res.sendFile(path.join(__dirname, 'public', 'index.html')); });
  });

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Admin Moderno em: http://localhost:${PORT}/admin`);
  });
};

start();