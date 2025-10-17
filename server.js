require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.static('public'));

// ✨ NOVA ROTA DE API PARA BUSCAR OS CAPÍTULOS ✨
app.get('/api/chapters', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('chapters') // Da tabela 'chapters'
            .select('*') // Seleciona todas as colunas
            .order('chapter_number', { ascending: true }); // Ordena pelo número do capítulo

        if (error) {
            throw error;
        }
        res.json(data); // Envia a lista de capítulos como resposta
    } catch (error) {
        console.error('Erro ao buscar capítulos:', error);
        res.status(500).json({ error: 'Erro ao buscar capítulos.' });
    }
});


// A nossa API de perguntas aleatórias (vamos mantê-la por agora)
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