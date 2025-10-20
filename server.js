require('dotenv').config();
const express = require('express');
const path = require('path'); // Módulo 'path' é essencial aqui
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// ALTERAÇÃO CRÍTICA: Corrigido o caminho para a pasta 'public'
// Isto garante que o servidor encontra sempre os seus ficheiros CSS e JS.
app.use(express.static(path.join(__dirname, 'public')));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


// Rota para a página principal (login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para buscar os capítulos
app.get('/api/chapters', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('chapters')
            .select('*')
            .order('chapter_number', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar capítulos:', error);
        res.status(500).json({ error: 'Erro ao buscar capítulos.' });
    }
});

// API para buscar as lições de um capítulo
app.get('/api/lessons', async (req, res) => {
    const { chapter_id } = req.query;
    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('chapter_id', chapter_id)
            .order('lesson_number', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar lições:', error);
        res.status(500).json({ error: 'Erro ao buscar lições.' });
    }
});

// API para buscar uma única lição
app.get('/api/lesson/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error(`Erro ao buscar lição com id ${id}:`, error);
        res.status(500).json({ error: 'Erro ao buscar a lição.' });
    }
});

// API para buscar os exercícios de uma lição
app.get('/api/exercises', async (req, res) => {
    const { lesson_id } = req.query;

    if (!lesson_id) {
        return res.status(400).json({ error: 'O ID da lição é obrigatório.' });
    }

    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('lesson_id', lesson_id);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar exercícios:', error);
        res.status(500).json({ error: 'Erro ao buscar exercícios.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});