require('dotenv').config();
const express = require('express');
const path = require('path'); 
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// CORRIGIDO: Servir a pasta 'public' com caminho absoluto
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- API ---

// API para buscar os capítulos
app.get('/api/chapters', async (req, res) => {
    try {
        const { data, error } = await supabase.from('chapters').select('*').order('chapter_number', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro API /api/chapters:', error);
        res.status(500).json({ error: 'Erro ao buscar capítulos.' });
    }
});

// API para buscar UM capítulo (usado em lesson.js)
app.get('/api/chapter/:id', async (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) { return res.status(400).json({ error: 'ID inválido.' }); }
    try {
        const { data, error } = await supabase.from('chapters').select('title, chapter_number').eq('id', id).maybeSingle(); 
        if (error) throw error;
        if (!data) { return res.status(404).json({ error: 'Capítulo não encontrado.' }); }
        res.json(data); 
    } catch (error) {
        console.error(`Erro API /api/chapter/${id}:`, error);
        res.status(500).json({ error: 'Erro ao buscar o capítulo.' });
    }
});


// API para buscar as lições de um capítulo
app.get('/api/lessons', async (req, res) => {
    const { chapter_id } = req.query;
     if (!chapter_id || isNaN(chapter_id)) { return res.status(400).json({ error: 'ID do capítulo inválido.' }); }
    try {
        const { data, error } = await supabase.from('lessons').select('*').eq('chapter_id', chapter_id).order('lesson_number', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error(`Erro API /api/lessons (chapter_id=${chapter_id}):`, error);
        res.status(500).json({ error: 'Erro ao buscar lições.' });
    }
});

// API para buscar os PASSOS da lição
app.get('/api/lesson-steps/:lesson_id', async (req, res) => {
    const { lesson_id } = req.params;
     if (isNaN(lesson_id)) { return res.status(400).json({ error: 'ID da lição inválido.' }); }
    try {
        const { data, error } = await supabase.from('lesson_steps').select('*').eq('lesson_id', lesson_id).order('step_order', { ascending: true }); 
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error(`Erro API /api/lesson-steps/${lesson_id}:`, error);
        res.status(500).json({ error: 'Erro ao buscar os passos da lição.' });
    }
});


// API para buscar os exercícios de uma lição
app.get('/api/exercises', async (req, res) => {
    const { lesson_id } = req.query;
    if (!lesson_id || isNaN(lesson_id)) { return res.status(400).json({ error: 'ID da lição inválido.' }); }
    try {
        const { data, error } = await supabase.from('questions').select('*').eq('lesson_id', lesson_id);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error(`Erro API /api/exercises (lesson_id=${lesson_id}):`, error);
        res.status(500).json({ error: 'Erro ao buscar exercícios.' });
    }
});

// A ROTA app.get('*', ...) FOI REMOVIDA DAQUI

app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});