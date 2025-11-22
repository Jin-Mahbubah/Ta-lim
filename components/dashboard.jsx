// components/dashboard.jsx
import React from 'react'
import { Box, H2, H4, Text, Button } from '@adminjs/design-system'

const pageStyle = { padding: '30px' }

const heroStyle = {
  background: 'linear-gradient(135deg, #61C5A8 0%, #4db396 100%)',
  color: 'white', padding: '40px', borderRadius: '20px', marginBottom: '40px',
  boxShadow: '0 10px 30px rgba(97, 197, 168, 0.3)', position: 'relative', overflow: 'hidden'
}

const cardGridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'
}

const cardStyle = (color1, color2) => ({
  background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
  padding: '25px', borderRadius: '20px', color: 'white',
  boxShadow: '0 8px 20px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s',
})

const Dashboard = () => {
  return (
    <Box style={pageStyle}>
      <Box style={heroStyle}>
        <Box maxWidth="600px">
          <H2 style={{ color: 'white', marginBottom: '10px' }}>Salam! Bem-vindo ao Ta-lim.</H2>
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '25px' }}>
            Gerencie cursos, lições e alunos num só lugar.
          </Text>
          <Button variant="light" size="lg" style={{ borderRadius: '12px', color: '#4db396' }}>
            Gerenciar Cursos
          </Button>
        </Box>
      </Box>

      <H4 style={{ marginBottom: '20px', color: '#888' }}>Visão Geral</H4>
      <Box style={cardGridStyle}>
        <Box style={cardStyle('#5E81F4', '#7191F7')}>
          <H4 style={{ color: 'white', marginTop: 0 }}>Alunos</H4>
          <H2 style={{ color: 'white' }}>124</H2>
        </Box>
        <Box style={cardStyle('#8B7EF8', '#A095F9')}>
          <H4 style={{ color: 'white', marginTop: 0 }}>Cursos</H4>
          <H2 style={{ color: 'white' }}>12</H2>
        </Box>
        <Box style={cardStyle('#FF8C66', '#FF9E7D')}>
          <H4 style={{ color: 'white', marginTop: 0 }}>Exercícios</H4>
          <H2 style={{ color: 'white' }}>350</H2>
        </Box>
      </Box>
    </Box>
  )
}
export default Dashboard