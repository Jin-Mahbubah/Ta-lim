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

// API PARA BUSCAR AS LIÇÕES DE UM CAPÍTULO
app.get('/api/lessons', async (req, res) => {
    const { chapter_id } = req.query;

    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('chapter_id', chapter_id)
            // ✨ CORREÇÃO ESTÁ AQUI ✨
            .order('lesson_number', { ascending: true }); // Usar lesson_number

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar lições:', error);
        res.status(500).json({ error: 'Erro ao buscar lições.' });
    }
});

// ✨ NOVA ROTA DE API PARA BUSCAR UMA ÚNICA LIÇÃO ✨
app.get('/api/lesson/:id', async (req, res) => {
    // Obter o ID da lição a partir do URL (ex: /api/lesson/1)
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', id)
            .single(); // .single() para obter apenas um resultado

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error(`Erro ao buscar lição com id ${id}:`, error);
        res.status(500).json({ error: 'Erro ao buscar a lição.' });
    }
});
// API de perguntas aleatórias (ainda aqui para o futuro)
app.get('/api/question', async (req, res) => {
    try {
        const { count, error: countError } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;
        const randomIndex = Math.floor(Math.random() * count);

        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .range(randomIndex, randomIndex)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar pergunta do Supabase:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});