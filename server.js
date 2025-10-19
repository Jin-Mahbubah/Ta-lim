require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.static('public'));

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


// ==========================================================
// ✨ NOVA ROTA DE API PARA BUSCAR OS EXERCÍCIOS DE UMA LIÇÃO ✨
// ==========================================================
app.get('/api/exercises', async (req, res) => {
    // Pega o lesson_id da URL (ex: /api/exercises?lesson_id=1)
    const { lesson_id } = req.query;

    // Verifica se o ID foi fornecido
    if (!lesson_id) {
        return res.status(400).json({ error: 'O ID da lição é obrigatório.' });
    }

    try {
        // Vai à tabela 'questions' no Supabase
        const { data, error } = await supabase
            .from('questions')      // O nome da nossa tabela
            .select('*')            // Seleciona todas as colunas
            .eq('lesson_id', lesson_id); // Filtra apenas pelas perguntas com o lesson_id correto

        if (error) throw error;
        
        res.json(data); // Envia os dados encontrados como resposta
    } catch (error) {
        console.error('Erro ao buscar exercícios:', error);
        res.status(500).json({ error: 'Erro ao buscar exercícios.' });
    }
});
// ==========================================================


// API de pergunta aleatória (vamos manter, pode ser útil no futuro)
app.get('/api/question', async (req, res) => {
    // ... (código antigo)
});


app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});